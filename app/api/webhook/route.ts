import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'
import { computeGraceUntil } from '@/lib/subscriptionAccess'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover'
})

const SUBSCRIPTION_PLAN_CODE = 'sagesse-salomon'
const SUBSCRIPTION_GRACE_DAYS = Number(process.env.SALOMON_GRACE_DAYS || '3')

const resolveCustomerId = (customer: Stripe.Checkout.Session['customer']): string | null => {
  if (!customer) return null
  if (typeof customer === 'string') return customer
  if ('id' in customer) return customer.id
  return null
}

const resolveSubscriptionUserId = (
  explicitUserId?: string | null,
  subscription?: Stripe.Subscription | null
): string | null => {
  if (explicitUserId) return explicitUserId
  if (subscription?.metadata?.user_id) return subscription.metadata.user_id
  return null
}

async function persistSubscriptionRecord(
  subscription: Stripe.Subscription,
  explicitUserId?: string | null,
  statusOverride?: string
) {
  if (!supabaseAdmin) {
    console.error('[WEBHOOK][SUBSCRIPTION] supabaseAdmin not configured')
    return
  }

  const userId = resolveSubscriptionUserId(explicitUserId, subscription)
  if (!userId) {
    console.warn('[WEBHOOK][SUBSCRIPTION] Impossible de déterminer user_id pour la souscription', subscription.id)
    return
  }

  // Récupérer l'abonnement existant pour vérifier s'il a été manuellement terminé
  const { data: existingSubData } = await supabaseAdmin
    .from('user_subscriptions')
    .select('metadata, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  const existingMetadata = (existingSubData?.metadata || {}) as any
  const wasManuallyTerminated = existingMetadata?.manually_terminated_by_admin === true

  // Si l'abonnement a été manuellement terminé par l'admin, vérifier si c'est un nouveau paiement
  const status = statusOverride || subscription.status
  if (wasManuallyTerminated && status === 'active') {
    const terminatedAt = existingMetadata?.terminated_at ? new Date(existingMetadata.terminated_at) : null
    const subscriptionCreatedAt = new Date(subscription.created * 1000) // Stripe timestamp en secondes
    
    // Si l'abonnement Stripe a été créé APRÈS la terminaison, c'est un nouveau paiement légitime
    if (terminatedAt && subscriptionCreatedAt > terminatedAt) {
      console.log('[WEBHOOK][SUBSCRIPTION] ✅ Nouveau paiement Stripe après terminaison, webhook autorisé', {
        userId,
        subscriptionId: subscription.id,
        terminatedAt: terminatedAt.toISOString(),
        subscriptionCreatedAt: subscriptionCreatedAt.toISOString()
      })
      // Le marqueur sera effacé ci-dessous
    } else {
      console.log('[WEBHOOK][SUBSCRIPTION] ⏸️ Abonnement manuellement terminé par admin, webhook Stripe ignoré', {
        userId,
        subscriptionId: subscription.id,
        terminatedAt: terminatedAt?.toISOString(),
        subscriptionCreatedAt: subscriptionCreatedAt.toISOString()
      })
      return
    }
  }

  const firstItem = subscription.items.data[0]
  const currentPeriodEnd = (subscription as any).current_period_end
  const currentPeriodStart = (subscription as any).current_period_start

  // Effacer le marqueur de terminaison manuelle si c'est un nouvel abonnement actif
  const mergedMetadata = (status === 'active' && wasManuallyTerminated) 
    ? (subscription.metadata || {}) 
    : {
        ...(subscription.metadata || {}),
        ...(wasManuallyTerminated ? { manually_terminated_by_admin: true, terminated_at: existingMetadata?.terminated_at } : {})
      }

  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: resolveCustomerId(subscription.customer),
        status,
        plan_id: subscription.metadata?.plan || SUBSCRIPTION_PLAN_CODE,
        price_id: firstItem?.price?.id || null,
        current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : null,
        current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
        grace_until: computeGraceUntil(currentPeriodEnd, SUBSCRIPTION_GRACE_DAYS),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        metadata: mergedMetadata
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('[WEBHOOK][SUBSCRIPTION] upsert error', error)
  }
}

async function syncSubscriptionById(
  subscriptionId?: string | null,
  explicitUserId?: string | null,
  statusOverride?: string
) {
  if (!subscriptionId) return
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    await persistSubscriptionRecord(subscription, explicitUserId, statusOverride)
  } catch (error) {
    console.error('[WEBHOOK][SUBSCRIPTION] sync error', error)
  }
}

// Désactiver le body parser pour Stripe webhook
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    await syncSubscriptionById((invoice as any).subscription as string, invoice.metadata?.user_id)
    return NextResponse.json({ received: true })
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    await syncSubscriptionById((invoice as any).subscription as string, invoice.metadata?.user_id, 'past_due')
    return NextResponse.json({ received: true })
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await persistSubscriptionRecord(subscription, subscription.metadata?.user_id, 'canceled')
    return NextResponse.json({ received: true })
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    await persistSubscriptionRecord(subscription, subscription.metadata?.user_id)
    return NextResponse.json({ received: true })
  }

  // Gérer les événements de paiement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log('[WEBHOOK] ✅ Événement checkout.session.completed reçu')
    console.log('[WEBHOOK] Session ID:', session.id)
    console.log('[WEBHOOK] Payment status:', session.payment_status)
    console.log('[WEBHOOK] Métadonnées:', session.metadata)
    
    // Vérifier que le paiement est bien complété
    if (session.payment_status !== 'paid') {
      console.log('[WEBHOOK] ⚠️ Paiement non complété, statut:', session.payment_status)
      return NextResponse.json({ received: true, message: 'Payment not completed yet' })
    }

    try {
      if (session.mode === 'subscription' && session.subscription) {
        await syncSubscriptionById(session.subscription as string, session.metadata?.user_id)
      }

      // Récupérer les métadonnées
      const userId = session.metadata?.user_id
      const itemsJson = session.metadata?.items

      // Tracker l'achat complété
      if (userId && session.amount_total) {
        try {
          const { tracking } = await import('@/lib/tracking')
          const items = itemsJson ? JSON.parse(itemsJson) : []
          await tracking.purchaseCompleted(
            session.id,
            session.amount_total / 100, // Convertir de centimes en euros
            'eur',
            items
          )
        } catch (trackingError) {
          console.warn('[WEBHOOK] Erreur tracking purchase_completed:', trackingError)
        }
      }

      if (!userId || !itemsJson) {
        console.error('[WEBHOOK] ❌ Metadata manquante dans la session Stripe')
        console.error('[WEBHOOK] userId:', userId)
        console.error('[WEBHOOK] itemsJson:', itemsJson)
        return NextResponse.json({ received: true })
      }

      const items = JSON.parse(itemsJson)
      console.log(`[WEBHOOK] ${items.length} item(s) dans le panier:`, items.map((i: any) => ({ id: i.id, quantity: i.quantity })))
      
      // Récupérer les line items de Stripe pour avoir les montants réels
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      })

      if (!supabaseAdmin) {
        console.error('supabaseAdmin not initialized')
        return NextResponse.json({ received: true })
      }

      // Récupérer les produits depuis la DB
      // IMPORTANT: Ne pas filtrer les capsules prédéfinies car on veut vérifier TOUS les items
      const productIds = items.map((item: any) => item.id).filter((id: string) => id)
      
      // Pour les capsules prédéfinies (capsule1-5), elles ne sont pas dans products
      // On doit récupérer uniquement les produits qui existent dans la table products
      let products: any[] = []
      // Filtrer seulement les IDs qui ne sont pas des capsules prédéfinies pour la requête DB
      const dbProductIds = productIds.filter((id: string) => !/^capsule[1-5]$/.test(id))
      
      if (dbProductIds.length > 0) {
        const { data: productsData, error: productsError } = await supabaseAdmin
          .from('products')
          .select('*')
          .in('id', dbProductIds)

        if (productsError) {
          console.error('[WEBHOOK] ❌ Erreur récupération produits:', productsError)
        } else {
          products = productsData || []
          console.log(`[WEBHOOK] ${products.length} produit(s) trouvé(s) dans DB:`, products.map(p => ({ id: p.id, category: p.category, name: p.name })))
        }
      } else {
        console.log(`[WEBHOOK] ℹ️ Aucun produit à rechercher dans DB (seulement capsules prédéfinies)`)
      }

      // Créer les paiements en utilisant les line items de Stripe pour les montants réels
      // IMPORTANT : Pour l'analyse financière avec quantité > 1, créer un paiement par quantité
      const paymentEntries = []
      
      console.log(`[WEBHOOK] Début création de ${items.length} paiement(s)`)
      
      for (const item of items) {
        console.log(`[WEBHOOK] Traitement item: ${item.id}, quantité: ${item.quantity}`)
        // Trouver le line item correspondant dans Stripe
        const lineItem = lineItems.data.find((li: any) => {
          const productName = (li.price?.product?.name || '').toLowerCase()
          const description = (li.description || '').toLowerCase()
          const itemIdLower = item.id.toLowerCase()
          return description.includes(itemIdLower) || productName.includes(itemIdLower)
        }) || lineItems.data[items.indexOf(item)]
        
        const product = products?.find(p => p.id === item.id)
        
        // Debug: vérifier si le produit existe
        if (!product && !/^capsule[1-5]$/.test(item.id)) {
          console.warn(`[WEBHOOK] ⚠️ Produit ${item.id} NON TROUVÉ dans la table products!`)
          console.warn(`[WEBHOOK] IDs recherchés:`, dbProductIds)
          console.warn(`[WEBHOOK] Produits trouvés:`, products.map(p => p.id))
        }
        
        console.log(`[WEBHOOK] Item ${item.id}:`, {
          productFound: !!product,
          productCategory: product?.category,
          productIsPack: product?.is_pack,
          itemId: item.id,
          isPredefinedCapsule: /^capsule[1-5]$/.test(item.id)
        })
        
        // Déterminer le type de paiement selon le produit
        // IMPORTANT: Vérifier les capsules prédéfinies EN PREMIER car elles ne sont pas dans products
        let paymentType = 'capsule' // Par défaut
        
        // 1. Vérifier d'abord les capsules prédéfinies (capsule1-5) - PRIORITÉ ABSOLUE
        if (/^capsule[1-5]$/.test(item.id)) {
          paymentType = 'capsule'
          console.log(`[WEBHOOK] ✅ Capsule prédéfinie détectée: ${item.id} → paymentType: capsule`)
        }
        // 2. Vérifier si c'est l'analyse financière (par ID ou catégorie)
        else if (item.id === 'analyse-financiere' || product?.category === 'analyse-financiere' || product?.id === 'analyse-financiere') {
          paymentType = 'analysis'
          console.log(`[WEBHOOK] ✅ Analyse financière détectée: ${item.id} → paymentType: analysis`)
        } 
        // 3. Vérifier les packs (par catégorie ou is_pack)
        else if (product?.category === 'pack' || product?.is_pack) {
          paymentType = 'pack'
          console.log(`[WEBHOOK] ✅ Pack détecté: ${item.id} → paymentType: pack`)
        } 
        // 4. Vérifier les ebooks
        else if (product?.category === 'ebook') {
          paymentType = 'ebook'
          console.log(`[WEBHOOK] ✅ Ebook détecté: ${item.id} → paymentType: ebook`)
        } 
        // 5. Vérifier les abonnements
        else if (product?.category === 'abonnement') {
          paymentType = 'abonnement'
          console.log(`[WEBHOOK] ✅ Abonnement détecté: ${item.id} → paymentType: abonnement`)
        }
        // 6. Vérifier les coaching
        else if (product?.category === 'coaching') {
          paymentType = 'coaching'
          console.log(`[WEBHOOK] ✅ Coaching détecté: ${item.id} → paymentType: coaching`)
        }
        // 7. Vérifier les masterclass
        else if (product?.category === 'masterclass') {
          paymentType = 'masterclass'
          console.log(`[WEBHOOK] ✅ Masterclass détectée: ${item.id} → paymentType: masterclass`)
        }
        // 8. Vérifier les capsules de la boutique (par catégorie)
        else if (product?.category === 'capsules') {
          paymentType = 'capsule'
          console.log(`[WEBHOOK] ✅ Capsule boutique détectée: ${item.id} (category: ${product.category}) → paymentType: capsule`)
        }
        // 9. Sinon, par défaut 'capsule' (pour les capsules prédéfinies non reconnues ou autres cas)
        else {
          paymentType = 'capsule'
          console.log(`[WEBHOOK] ⚠️ Type par défaut utilisé pour ${item.id}: capsule (product: ${product ? 'trouvé' : 'non trouvé'}, category: ${product?.category || 'N/A'})`)
        }
        
        console.log(`[WEBHOOK] Type de paiement final pour ${item.id}:`, paymentType)
        
        // Calculer le montant unitaire
        let unitAmount = 0
        if (lineItem?.amount_total) {
          // amount_total est le total pour cette ligne (incluant la quantité)
          unitAmount = (lineItem.amount_total / 100) / item.quantity
        } else if (lineItem?.amount_subtotal) {
          unitAmount = (lineItem.amount_subtotal / 100)
        } else if (product?.price) {
          unitAmount = parseFloat(product.price)
        } else {
          // Fallback
          const totalAmount = session.amount_total ? session.amount_total / 100 : 0
          const totalQuantity = items.reduce((sum: number, i: any) => sum + i.quantity, 0)
          unitAmount = totalQuantity > 0 ? totalAmount / totalQuantity : 0
        }
        
        // Créer UN paiement par quantité pour tous les produits
        // Pour l'analyse financière: quantity = 3 → 3 paiements distincts (3 analyses possibles)
        // Pour autres produits: quantity = 1 → 1 paiement
        console.log(`[WEBHOOK] Création de ${item.quantity} paiement(s) pour ${item.id} (type: ${paymentType}, montant unitaire: ${unitAmount}€)`)
        for (let qty = 0; qty < item.quantity; qty++) {
          const paymentEntry = {
            user_id: userId,
            product_id: item.id,
            payment_type: paymentType,
            amount: unitAmount,
            currency: 'EUR',
            status: 'success',
            method: 'Stripe',
            transaction_id: `${session.id}-${item.id}-${qty}`,
            created_at: new Date().toISOString()
          }
          paymentEntries.push(paymentEntry)
          console.log(`[WEBHOOK] Paiement créé ${qty + 1}/${item.quantity}:`, {
            product_id: paymentEntry.product_id,
            payment_type: paymentEntry.payment_type,
            amount: paymentEntry.amount
          })
        }
      }

      // Vérifier si paymentEntries n'est pas vide
      if (paymentEntries.length === 0) {
        console.error('[WEBHOOK] ❌ ERREUR: Aucun paiement à insérer! Vérifier la logique de création.')
        return NextResponse.json({ received: true, error: 'Aucun paiement à insérer' })
      }
      
      // Vérifier si les paiements existent déjà pour cette session
      let existingPayments: any[] = []
      const { data: existingPaymentsData } = await supabaseAdmin
        .from('payments')
        .select('*')
        .or(`transaction_id.eq.${session.id},transaction_id.ilike.%${session.id}%`)
        .eq('status', 'success')
      
      if (existingPaymentsData && existingPaymentsData.length > 0) {
        existingPayments = existingPaymentsData
        console.log(`[WEBHOOK] ⚠️ ${existingPayments.length} paiement(s) existant(s) déjà pour cette session`)
      }
      
      // Insérer les paiements avec gestion d'erreur (ignorer les doublons)
      console.log(`[WEBHOOK] ===== INSERTION DE ${paymentEntries.length} PAIEMENT(S) =====`)
      console.log(`[WEBHOOK] Paiements à insérer:`, paymentEntries.map(p => ({ 
        product_id: p.product_id, 
        payment_type: p.payment_type, 
        amount: p.amount,
        transaction_id: p.transaction_id
      })))
      
      const { data: insertedPayments, error: paymentInsertError } = await supabaseAdmin
        .from('payments')
        .insert(paymentEntries)
        .select()

      let paymentsToUse: any[] = []
      
      if (paymentInsertError) {
        console.error('[WEBHOOK] ❌ ERREUR insertion paiements:', paymentInsertError)
        console.error('[WEBHOOK] Détails erreur:', JSON.stringify(paymentInsertError, null, 2))
        console.error('[WEBHOOK] Paiements tentés:', JSON.stringify(paymentEntries, null, 2))
        
        // Si erreur d'insertion mais paiements existent déjà, utiliser ceux-ci
        if (existingPayments.length > 0) {
          console.log('[WEBHOOK] ✅ Utilisation des paiements existants pour les emails')
          paymentsToUse = existingPayments
        }
      } else {
        console.log(`[WEBHOOK] ✅ ${insertedPayments?.length || 0} paiement(s) inséré(s) avec succès dans la DB`)
        console.log('[WEBHOOK] Paiements insérés:', insertedPayments?.map(p => ({
          id: p.id,
          product_id: p.product_id,
          payment_type: p.payment_type,
          amount: p.amount,
          status: p.status,
          transaction_id: p.transaction_id
        })))
        
        // Vérifier les types de paiements insérés
        const byType = insertedPayments?.reduce((acc: any, p: any) => {
          const type = p.payment_type || 'non défini'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {})
        console.log('[WEBHOOK] Paiements insérés par type:', byType)
        
        paymentsToUse = insertedPayments || []
      }
      
      // Créer les entrées dans la table orders pour les paiements Stripe
      const orderEntries = []
      for (const payment of paymentsToUse) {
        // Récupérer le nom du produit
        let productName = payment.product_id
        
        // Vérifier si c'est une capsule prédéfinie
        if (/^capsule[1-5]$/.test(payment.product_id)) {
          const capsuleNames: { [key: string]: string } = {
            'capsule1': "L'éducation financière",
            'capsule2': 'La mentalité de pauvreté',
            'capsule3': "Les lois spirituelles liées à l'argent",
            'capsule4': 'Les combats liés à la prospérité',
            'capsule5': 'Épargne et Investissement'
          }
          productName = capsuleNames[payment.product_id] || payment.product_id
        } else {
          // Chercher dans les produits récupérés
          const product = products?.find(p => p.id === payment.product_id)
          if (product) {
            productName = product.name || payment.product_id
          }
        }
        
        const orderEntry = {
          user_id: payment.user_id,
          product_id: payment.product_id,
          product_name: productName,
          amount: payment.amount,
          amount_fcfa: null,
          payment_method: 'stripe',
          status: 'paid',
          operator: null,
          msisdn: null,
          tx_ref: null,
          proof_path: null,
          transaction_id: payment.transaction_id,
          validated_at: new Date().toISOString()
        }
        
        orderEntries.push(orderEntry)
      }
      
      // Insérer les commandes dans orders
      if (orderEntries.length > 0) {
        console.log(`[WEBHOOK] ===== CRÉATION DE ${orderEntries.length} COMMANDE(S) DANS ORDERS =====`)
        const { data: ordersData, error: orderInsertError } = await supabaseAdmin
          .from('orders')
          .insert(orderEntries)
          .select()
        
        if (orderInsertError) {
          console.error('[WEBHOOK] ❌ Erreur insertion commandes:', orderInsertError)
        } else {
          console.log(`[WEBHOOK] ✅ ${ordersData?.length || 0} commande(s) créée(s) dans orders`)
        }
      }
      
      // Créer une entrée dans analyses pour chaque NOUVEAU paiement d'analyse financière
      // IMPORTANT: On ne crée une analyse que pour les NOUVEAUX paiements (insertedPayments)
      // Les paiements existants ont déjà créé leur analyse
      // Fonction helper pour générer un ticket court
      const generateShortTicket = (): string => {
        const numbers = Math.floor(10000 + Math.random() * 90000) // 10000-99999
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const letter = letters[Math.floor(Math.random() * letters.length)]
        return `${numbers}${letter}`
      }
      
      // Utiliser SEULEMENT les nouveaux paiements insérés pour créer des analyses
      // Les paiements existants ont déjà créé leur analyse
      const newPaymentsOnly = insertedPayments || []
      console.log(`[WEBHOOK] Création d'analyses pour ${newPaymentsOnly.length} nouveau(x) paiement(s) (sur ${paymentsToUse.length} total)`)
      
      for (const payment of newPaymentsOnly) {
        // Vérifier si c'est un paiement d'analyse financière
        const isAnalysis = payment.product_id === 'analyse-financiere' || 
                          payment.payment_type === 'analysis' ||
                          (products?.find(p => p.id === payment.product_id) as any)?.category === 'analyse-financiere'
        
        if (isAnalysis) {
          try {
            // IMPORTANT: On crée une analyse pour CHAQUE paiement d'analyse financière
            // Même si l'utilisateur a déjà une analyse, chaque nouvel achat doit créer une nouvelle analyse
            // La vérification ci-dessous évite seulement les doublons si le webhook est appelé plusieurs fois pour le MÊME paiement
            
            // Vérifier si une analyse a été créée pour ce transaction_id spécifique dans les 2 dernières minutes
            // (pour éviter les doublons si le webhook est appelé plusieurs fois)
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
            const { data: duplicateCheck } = await supabaseAdmin
              .from('analyses')
              .select('id, ticket, created_at')
              .eq('user_id', payment.user_id)
              .eq('mode_paiement', 'Stripe')
              .gte('created_at', twoMinutesAgo)
              .order('created_at', { ascending: false })
              .limit(10) // Vérifier les 10 dernières analyses récentes
            
            // Si une analyse a été créée dans les 2 dernières minutes, c'est probablement un doublon
            // Mais on permet quand même si c'est un nouveau paiement (transaction_id différent)
            // On ne peut pas lier directement par transaction_id, donc on crée quand même
            // et on laisse la contrainte unique de la base gérer les vrais doublons
            if (duplicateCheck && duplicateCheck.length > 0) {
              console.log(`[WEBHOOK] ⚠️ ${duplicateCheck.length} analyse(s) créée(s) récemment. On crée quand même pour éviter de manquer un nouveau paiement.`)
            }
            
            // Récupérer les informations utilisateur
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(payment.user_id)
            const userEmail = userData?.user?.email || ''
            const firstName = userData?.user?.user_metadata?.first_name || ''
            const lastName = userData?.user?.user_metadata?.last_name || ''
            const clientName = `${firstName} ${lastName}`.trim() || userEmail.split('@')[0] || 'Client'
            
            // Générer un ticket unique
            const ticket = `CASH-${generateShortTicket()}`
            
            // Créer l'entrée dans analyses - TOUJOURS créer une nouvelle analyse pour chaque nouveau paiement
            const { error: analysisError } = await supabaseAdmin
              .from('analyses')
              .insert({
                ticket: ticket,
                client_name: clientName,
                client_email: userEmail,
                status: 'en_cours',
                progress: 10,
                mode_paiement: 'Stripe',
                message: null,
                user_id: payment.user_id
              })
              .select()
              .single()
            
            if (analysisError) {
              console.error('[WEBHOOK] ❌ Erreur création analyse:', analysisError)
              // Si l'erreur est une contrainte unique ou doublon, c'est OK
              if (analysisError.code === '23505' || analysisError.message?.includes('duplicate')) {
                console.log('[WEBHOOK] ⚠️ Analyse déjà existante (doublon détecté), on continue')
              }
            } else {
              console.log(`[WEBHOOK] ✅ Nouvelle analyse créée: ${ticket} pour utilisateur ${payment.user_id} (paiement: ${payment.transaction_id})`)
            }
          } catch (error) {
            console.error('[WEBHOOK] ❌ Erreur lors de la création de l\'analyse:', error)
          }
        }
      }
      
      // Envoyer les emails de confirmation de paiement (même si paiements existaient déjà)
      // Uniquement si payment_status est 'paid' et qu'on a des paiements à traiter
      console.log('[WEBHOOK] 🔍 Vérification pour envoi emails:', {
        paymentStatus: session.payment_status,
        paymentsCount: paymentsToUse.length,
        sessionId: session.id
      })
      
      if (session.payment_status === 'paid' && paymentsToUse.length > 0) {
        try {
          // Récupérer les informations de l'utilisateur
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
          
          if (userError || !userData?.user || !userData.user.email) {
            console.error('[WEBHOOK] ❌ Erreur récupération utilisateur pour email:', userError || 'Email manquant')
          } else {
            const userEmail = userData.user.email
            const userName = userData.user.user_metadata?.full_name || 
                            userData.user.user_metadata?.name ||
                            userEmail.split('@')[0] || 
                            'Client'
            const firstName = userName.split(' ')[0] || userName
            
            // Capsules prédéfinies
            const capsuleNames: { [key: string]: string } = {
              'capsule1': "L'éducation financière",
              'capsule2': 'La mentalité de pauvreté',
              'capsule3': "Les lois spirituelles liées à l'argent",
              'capsule4': 'Les combats liés à la prospérité',
              'capsule5': 'Épargne et Investissement'
            }
            
            // Grouper les paiements par produit pour éviter les doublons
            const productsMap = new Map()
            
            for (const payment of paymentsToUse) {
              const productId = payment.product_id
              const paymentType = payment.payment_type
              const amount = payment.amount
              
              // Récupérer le nom du produit
              let productName = productId
              
              // Vérifier si c'est une capsule prédéfinie
              if (/^capsule[1-5]$/.test(productId)) {
                productName = capsuleNames[productId] || productId
              } else {
                // Chercher dans les produits récupérés
                const product = products?.find(p => p.id === productId)
                if (product) {
                  productName = product.name || productId
                }
              }
              
              // Déterminer le type de produit en français
              let productTypeLabel = 'Produit'
              switch (paymentType) {
                case 'analysis':
                  productTypeLabel = 'Analyse financière'
                  break
                case 'capsule':
                  productTypeLabel = 'Capsule'
                  break
                case 'pack':
                  productTypeLabel = 'Pack'
                  break
                case 'ebook':
                  productTypeLabel = 'Ebook'
                  break
                case 'abonnement':
                  productTypeLabel = 'Abonnement'
                  break
                default:
                  productTypeLabel = 'Produit'
              }
              
              // Compter les quantités par produit
              if (!productsMap.has(productId)) {
                productsMap.set(productId, {
                  id: productId,
                  name: productName,
                  type: productTypeLabel,
                  quantity: 1,
                  totalAmount: amount
                })
              } else {
                const existing = productsMap.get(productId)
                existing.quantity += 1
                existing.totalAmount += amount
              }
            }
            
            // Convertir la Map en tableau
            const uniqueProducts = Array.from(productsMap.values())
            
            // Calculer le montant total
            const totalAmount = uniqueProducts.reduce((sum, p) => sum + p.totalAmount, 0)
            
            // Générer et envoyer l'email admin
            const adminEmailHtml = generatePaymentAdminEmailHtml(
              firstName,
              userName,
              userEmail,
              uniqueProducts,
              totalAmount,
              session.id
            )
            
            const adminEmail = process.env.MAIL_ADMIN || process.env.DESTINATION_EMAIL || 'cash@cash360.finance'
            console.log('[WEBHOOK] 📧 Envoi email admin à:', adminEmail)
            try {
              await sendMail({
                to: adminEmail,
                subject: `[Cash360] Nouveau paiement reçu – ${firstName} ${userName} – ${session.id.replace(/^cs_test_/, '').substring(0, 8)}`,
                html: adminEmailHtml
              })
              console.log('[WEBHOOK] ✅ Email admin envoyé avec succès à:', adminEmail)
            } catch (adminEmailError: any) {
              console.error('[WEBHOOK] ❌ Erreur envoi email admin:', adminEmailError)
              console.error('[WEBHOOK] Détails erreur admin email:', JSON.stringify(adminEmailError, null, 2))
              // Continuer même si l'email admin échoue
            }
            
            // Attendre 1 seconde pour respecter les limites de rate
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Vérifier si c'est un abonnement
            const isSubscription = uniqueProducts.some(p => p.type === 'abonnement' || p.id === 'sagesse-salomon' || p.name?.toLowerCase().includes('sagesse'))
            
            // Générer et envoyer l'email client
            let clientEmailHtml: string
            let emailSubject: string
            
            if (isSubscription) {
              // Email spécialisé pour l'abonnement
              clientEmailHtml = generateSubscriptionWelcomeEmailHtml(
                firstName,
                totalAmount,
                session.id
              )
              emailSubject = '🎉 Bienvenue dans l\'abonnement Sagesse de Salomon – Accès premium activé !'
            } else {
              // Email standard pour les autres produits
              clientEmailHtml = generatePaymentClientEmailHtml(
                firstName,
                uniqueProducts,
                totalAmount,
                session.id
              )
              emailSubject = `Cash360 – Confirmation de paiement – ${session.id.replace(/^cs_test_/, '').substring(0, 8)}`
            }
            
            console.log('[WEBHOOK] 📧 Envoi email client à:', userEmail, isSubscription ? '(abonnement)' : '(produit standard)')
            await sendMail({
              to: userEmail,
              subject: emailSubject,
              html: clientEmailHtml
            })
            
            console.log('[WEBHOOK] ✅ Email client envoyé avec succès')
          }
        } catch (emailError: any) {
          console.error('[WEBHOOK] ❌ Erreur envoi emails:', emailError)
          console.error('[WEBHOOK] Détails erreur email:', JSON.stringify(emailError, null, 2))
          // Ne pas bloquer le processus si les emails échouent
        }
      } else {
        console.log('[WEBHOOK] ⚠️ Emails non envoyés:', {
          paymentStatus: session.payment_status,
          paymentsCount: paymentsToUse.length,
          reason: session.payment_status !== 'paid' ? 'Payment status !== paid' : 'No payments to use'
        })
      }

      // Créer les capsules achetées (user_capsules)
      // LOGIQUE: Seulement si category = 'capsules' OU capsule prédéfinie (capsule1-5) OU pack
      // EXCLURE "analyse-financiere", "ebook", "abonnement"
      const capsuleEntries = []
      for (const item of items) {
        // Vérifier si c'est une capsule prédéfinie (capsule1-5) - toujours ajoutée
        const isPredefinedCapsule = /^capsule[1-5]$/.test(item.id)
        if (isPredefinedCapsule) {
          console.log(`[WEBHOOK] ✅ Capsule prédéfinie ${item.id} ajoutée`)
          capsuleEntries.push({
            user_id: userId,
            capsule_id: item.id,
            created_at: new Date().toISOString()
          })
          continue
        }
        
        // EXCLURE explicitement "analyse-financiere", ebooks et abonnements
        if (item.id === 'analyse-financiere') {
          console.log(`[WEBHOOK] ⏭️ Analyse financière ignorée - n'apparaît jamais dans "Mes achats"`)
          continue
        }
        
        const product = products?.find(p => p.id === item.id)
        
        if (!product) {
          console.log(`[WEBHOOK] ⏭️ Produit ${item.id} ignoré car non trouvé dans products`)
          continue
        }
        
        // Vérifier la catégorie du produit
        const productCategory = (product as any)?.category || 'capsules'
        
        // EXCLURE uniquement "analyse-financiere" et "abonnement" (les abonnements ne doivent pas apparaître dans "Mes achats")
        // Les ebooks et packs DOIVENT apparaître dans "Mes achats"
        if (productCategory === 'abonnement' || productCategory === 'analyse-financiere') {
          console.log(`[WEBHOOK] ⏭️ Produit ${item.id} ignoré - catégorie: ${productCategory}`)
          continue
        }
        
        // Si c'est un ebook, l'ajouter directement (sans créer de sessions)
        if (productCategory === 'ebook') {
          console.log(`[WEBHOOK] ✅ Ebook ${item.id} ajouté à "Mes achats"`)
          capsuleEntries.push({
            user_id: userId,
            capsule_id: item.id,
            created_at: new Date().toISOString()
          })
          continue
        }
        
        // Si c'est un pack (category === 'pack' ou is_pack)
        // IMPORTANT: Le pack est un produit indépendant, il n'achète pas toutes les capsules
        if (productCategory === 'pack' || (product as any)?.is_pack) {
          console.log(`[WEBHOOK] ✅ Pack détecté ${item.id}, ajout du pack uniquement (pas les capsules individuelles)`)
          // Ajouter uniquement le pack lui-même dans user_capsules
          capsuleEntries.push({
            user_id: userId,
            capsule_id: item.id,
            created_at: new Date().toISOString()
          })
        } 
        // Si c'est une capsule, masterclass ou coaching de la boutique
        else if (productCategory === 'capsules' || productCategory === 'masterclass' || productCategory === 'coaching') {
          console.log(`[WEBHOOK] ✅ Produit boutique ${item.id} (${productCategory}) ajouté`)
          capsuleEntries.push({
            user_id: userId,
            capsule_id: item.id,
            created_at: new Date().toISOString()
          })
        }
      }
      
      console.log(`[WEBHOOK] ${capsuleEntries.length} capsule(s) à créer pour utilisateur ${userId}`)

      // Insérer les capsules achetées
      if (capsuleEntries.length > 0) {
        const { data: insertedCapsules, error: capsuleInsertError } = await supabaseAdmin
          .from('user_capsules')
          .insert(capsuleEntries)
          .select()
        
        if (capsuleInsertError) {
          console.error('[WEBHOOK] ❌ Erreur insertion capsules achetées:', capsuleInsertError)
          console.error('[WEBHOOK] Capsules tentées:', JSON.stringify(capsuleEntries, null, 2))
        } else {
          console.log(`[WEBHOOK] ✅ ${insertedCapsules?.length || 0} capsule(s) insérée(s) avec succès`)
          console.log('[WEBHOOK] Capsules insérées:', insertedCapsules?.map(c => c.capsule_id))
        }
      } else {
        console.log('[WEBHOOK] ℹ️ Aucune capsule à insérer (analyse financière, ebook ou abonnement)')
      }
    } catch (error: any) {
      console.error('Erreur lors du traitement du webhook:', error)
    }
  }

  return NextResponse.json({ received: true })
}

// Fonction pour générer l'email admin de paiement
function generatePaymentAdminEmailHtml(
  firstName: string,
  fullName: string,
  userEmail: string,
  products: Array<{ id: string; name: string; type: string; quantity: number; totalAmount: number }>,
  totalAmount: number,
  transactionId: string
): string {
  const timestamp = new Date().toLocaleString('fr-FR')
  
  // Générer la liste des produits
  const productsList = products.map(product => `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #3b82f6;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: #1f2937; font-size: 16px;">${product.name}</strong>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${product.type}${product.quantity > 1 ? ` x${product.quantity}` : ''}</p>
        </div>
        <div style="text-align: right;">
          <strong style="color: #1f2937; font-size: 16px;">${product.totalAmount.toFixed(2)} €</strong>
        </div>
      </div>
    </div>
  `).join('')
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e293b, #1e40af); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">💳 Nouveau paiement reçu - Cash360</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</p>
        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">Paiement validé avec succès</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">Informations client</h2>
        
        <div style="margin-bottom: 15px;">
          <strong>Nom complet:</strong> ${fullName}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Email:</strong> ${userEmail}
        </div>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 20px;">
          <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">💳 Produits achetés</h3>
          ${productsList}
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #065f46; font-size: 18px;">Total:</strong>
              <strong style="color: #065f46; font-size: 20px;">${totalAmount.toFixed(2)} €</strong>
            </div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p>Email généré automatiquement le ${timestamp}</p>
      </div>
    </div>
  `
}

// Fonction pour générer l'email client de paiement
function generatePaymentClientEmailHtml(
  firstName: string,
  products: Array<{ id: string; name: string; type: string; quantity: number; totalAmount: number }>,
  totalAmount: number,
  transactionId: string
): string {
  // Générer la liste des produits
  const productsList = products.map(product => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
      <div>
        <span style="color: #1f2937; font-weight: 500; font-size: 15px;">${product.name}</span>
        <span style="color: #6b7280; font-size: 13px; margin-left: 8px;">(${product.type}${product.quantity > 1 ? ` x${product.quantity}` : ''})</span>
      </div>
      <span style="color: #1f2937; font-weight: 600; font-size: 15px;">${product.totalAmount.toFixed(2)} €</span>
    </div>
  `).join('')
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      
      <!-- Header avec logo -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px; font-weight: bold;">✓</span>
        </div>
        <h1 style="margin: 0; font-size: 28px; color: #1f2937; font-weight: 600;">Merci pour votre achat !</h1>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;"><strong style="color: #1f2937;">${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</strong></p>
      </div>

      <!-- Contenu principal -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Merci pour votre confiance ! Votre paiement a été validé avec succès.
        </p>

        <!-- Produits achetés -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px; text-align: center;">Vos achats</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${productsList}
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #1f2937; font-size: 18px;">Total:</strong>
                <strong style="color: #1f2937; font-size: 20px;">${totalAmount.toFixed(2)} €</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Prochaines étapes -->
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 30px;">
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; margin-right: 12px; color: #3b82f6;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 600;">Accédez à vos achats</h3>
              <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                Vous pouvez maintenant accéder à vos produits dans votre <strong>dashboard</strong> dans l'onglet <strong>"Mes achats"</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Besoin d'aide ?</h3>
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
            Pour toute question concernant votre achat :
          </p>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; margin-right: 8px; color: #6b7280;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
            </div>
            <a href="mailto:cash@cash360.finance" style="color: #3b82f6; text-decoration: none; font-weight: 500;">cash@cash360.finance</a>
          </div>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
            Référencez <strong>${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</strong> dans votre email
          </p>
        </div>

        <!-- Récapitulatif -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Récapitulatif</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Nombre de produits:</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${products.length}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Montant total:</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${totalAmount.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">ID:</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px; font-family: monospace;">${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280; font-size: 14px;">Statut :</span>
            <span style="color: #10b981; font-weight: 500; font-size: 14px;">✓ Payé</span>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">Cash360 - Transformation financière et spirituelle</p>
      </div>
    </div>
  `
}

// Fonction pour générer l'email de bienvenue pour l'abonnement
function generateSubscriptionWelcomeEmailHtml(
  firstName: string,
  totalAmount: number,
  transactionId: string
): string {
  const dashboardUrl = 'https://cash360.finance'
  const dashboardOverviewUrl = `${dashboardUrl}/dashboard?tab=overview`
  const dashboardBudgetUrl = `${dashboardUrl}/dashboard?tab=budget`
  const dashboardFastUrl = `${dashboardUrl}/dashboard?tab=fast`
  const dashboardDebtFreeUrl = `${dashboardUrl}/dashboard?tab=debtfree`
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      
      <!-- Header avec logo premium -->
      <div style="background: linear-gradient(135deg, #FEBE02 0%, #F59E0B 100%); padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(254, 190, 2, 0.3); margin-bottom: 20px; text-align: center; border: 2px solid #FEBE02;">
        <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          <span style="color: white; font-size: 40px; font-weight: bold;">👑</span>
        </div>
        <h1 style="margin: 0; font-size: 32px; color: #012F4E; font-weight: 700;">Félicitations ${firstName} !</h1>
        <p style="margin: 15px 0 0 0; color: #012F4E; font-size: 20px; font-weight: 600;">Ton abonnement Sagesse de Salomon est activé</p>
        <p style="margin: 10px 0 0 0; color: #012F4E; font-size: 14px; opacity: 0.9;">Référence: <strong>${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</strong></p>
      </div>

      <!-- Contenu principal -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <p style="color: #374151; font-size: 18px; line-height: 1.7; margin-bottom: 30px; text-align: center;">
          <strong>🎉 Bienvenue dans l'abonnement premium Cash360 !</strong><br><br>
          Tu as maintenant accès à tous les outils pour transformer ta vie financière. C'est le début d'un nouveau chapitre vers la liberté financière.
        </p>

        <!-- Section outils premium -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #00A1C6;">
          <h2 style="color: #012F4E; margin-top: 0; font-size: 24px; font-weight: 700; margin-bottom: 20px; text-align: center;">✨ Tes outils premium sont maintenant disponibles</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #012F4E; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 10px;">📊 Tableau de bord</h3>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
              Visualise en un coup d'œil ta situation financière : revenus, dépenses, épargne du mois avec comparaison au mois précédent. Reçois aussi ton verset biblique quotidien pour aligner tes finances avec ta foi.
            </p>
            <a href="${dashboardOverviewUrl}" style="display: inline-block; background: #00A1C6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 5px;">
              Accéder au tableau de bord →
            </a>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #012F4E; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 10px;">💰 Budget & suivi</h3>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
              Gère ton budget mois par mois, catégorie par catégorie. Suis tes dépenses en temps réel et optimise chaque euro. Visualise tes principales catégories et ton taux d'utilisation.
            </p>
            <a href="${dashboardBudgetUrl}" style="display: inline-block; background: #00A1C6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 5px;">
              Configurer mon budget →
            </a>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #012F4E; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 10px;">⛔ Jeûne financier – 30 jours</h3>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
              Reprends le contrôle de tes dépenses impulsives. Lance un jeûne de 30 jours en choisissant les catégories à éviter (restaurants, shopping, etc.). Suis ta progression jour après jour et calcule tes économies.
            </p>
            <a href="${dashboardFastUrl}" style="display: inline-block; background: #00A1C6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 5px;">
              Lancer mon jeûne financier →
            </a>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3 style="color: #012F4E; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 10px;">🛡️ DebtFree</h3>
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
              Crée ton plan de remboursement de dettes intelligent. DebtFree analyse automatiquement tes dettes à partir de ton budget et de tes économies du jeûne. Visualise ta date estimée de libération financière.
            </p>
            <a href="${dashboardDebtFreeUrl}" style="display: inline-block; background: #00A1C6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 5px;">
              Créer mon plan DebtFree →
            </a>
          </div>
        </div>

        <!-- Section bienfaits -->
        <div style="background: #fef3c7; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #FEBE02;">
          <h2 style="color: #92400e; margin-top: 0; font-size: 22px; font-weight: 700; margin-bottom: 20px; text-align: center;">💎 Ce que tu vas accomplir avec ton abonnement</h2>
          <ul style="color: #92400e; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
            <li><strong>Reprendre le contrôle</strong> → Comprends où va ton argent et prends des décisions éclairées</li>
            <li><strong>Développer la discipline</strong> → Le jeûne financier renforce ta maîtrise de soi</li>
            <li><strong>Éliminer les dettes</strong> → DebtFree t'aide à créer un plan concret pour retrouver ta liberté</li>
            <li><strong>Épargner intelligemment</strong> → Suis tes économies et vois-les grandir mois après mois</li>
            <li><strong>Alignement spirituel</strong> → Reçois chaque jour une inspiration biblique pour guider tes finances</li>
            <li><strong>Résultats mesurables</strong> → Voie ta progression et célèbre tes victoires</li>
          </ul>
        </div>

        <!-- CTA principal -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${dashboardOverviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #012F4E 0%, #023d68 100%); color: #FEBE02; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(1, 47, 78, 0.3);">
            🚀 Accéder à mon dashboard premium
          </a>
        </div>

        <!-- Informations abonnement -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">📋 Informations sur ton abonnement</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Montant mensuel:</span>
            <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${totalAmount.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Référence:</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px; font-family: monospace;">${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Statut:</span>
            <span style="color: #10b981; font-weight: 600; font-size: 14px;">✓ Actif</span>
          </div>
          <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
            Tu peux gérer ton abonnement (suspendre, relancer, annuler) depuis ton <strong>Profil</strong> dans le dashboard. L'annulation est possible à tout moment.
          </p>
        </div>

        <!-- Accompagnement personnalisé -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; border: 2px solid #FEBE02; margin-bottom: 30px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <span style="font-size: 40px;">🤝</span>
          </div>
          <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 20px; font-weight: 700;">Besoin d'un accompagnement personnalisé ?</h3>
          <p style="margin: 0 0 20px 0; color: #92400e; font-size: 15px; line-height: 1.6;">
            Réserve un rendez-vous gratuit avec notre équipe pour découvrir toutes les fonctionnalités de ton abonnement et créer un plan d'action adapté à ta situation financière.
          </p>
          <a href="https://calendly.com/cash360/accompagnement-abonnement" style="display: inline-block; background: #012F4E; color: #FEBE02; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(1, 47, 78, 0.3);">
            📅 Réserver mon accompagnement gratuit
          </a>
          <p style="margin: 15px 0 0 0; color: #92400e; font-size: 13px; font-style: italic;">
            Durée : 30 minutes • Gratuit • En ligne ou par téléphone
          </p>
        </div>

        <!-- Contact -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Besoin d'aide ?</h3>
          <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
            Notre équipe est là pour t'accompagner dans ta transformation financière.
          </p>
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 20px; height: 20px; margin-right: 8px; color: #6b7280;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
            </div>
            <a href="mailto:cash@cash360.finance" style="color: #3b82f6; text-decoration: none; font-weight: 500;">cash@cash360.finance</a>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; margin-right: 8px; color: #6b7280;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
            </div>
            <a href="https://wa.me/33756848734" style="color: #3b82f6; text-decoration: none; font-weight: 500;">WhatsApp : +33 7 56 84 87 34</a>
          </div>
        </div>

        <!-- Message final -->
        <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 10px; margin-top: 30px;">
          <p style="color: #065f46; font-size: 18px; line-height: 1.7; margin: 0 0 15px 0; font-weight: 600;">
            🎯 Tu as fait le choix de transformer ta vie financière.
          </p>
          <p style="color: #065f46; font-size: 16px; line-height: 1.7; margin: 0;">
            Avec l'abonnement Sagesse de Salomon, tu as tous les outils pour y arriver. Commence dès aujourd'hui et vois la différence dès le premier mois !
          </p>
        </div>

        <!-- Signature -->
        <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">À très vite,</p>
          <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">L'équipe Cash360</p>
          <p style="color: #6b7280; font-size: 12px; font-style: italic; margin: 0;">
            "La maîtrise de vos finances, de A à Z, avec sagesse et foi."
          </p>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">Cash360 - Abonnement Sagesse de Salomon</p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">Tu reçois cet email car tu as souscrit à l'abonnement premium Cash360.</p>
      </div>
    </div>
  `
}

