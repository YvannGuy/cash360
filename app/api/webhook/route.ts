import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

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

  // Gérer les événements de paiement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log('[WEBHOOK] ✅ Événement checkout.session.completed reçu')
    console.log('[WEBHOOK] Session ID:', session.id)
    console.log('[WEBHOOK] Métadonnées:', session.metadata)

    try {
      // Récupérer les métadonnées
      const userId = session.metadata?.user_id
      const itemsJson = session.metadata?.items

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
        // 6. Vérifier les capsules de la boutique (par catégorie)
        else if (product?.category === 'capsules') {
          paymentType = 'capsule'
          console.log(`[WEBHOOK] ✅ Capsule boutique détectée: ${item.id} (category: ${product.category}) → paymentType: capsule`)
        }
        // 7. Sinon, par défaut 'capsule' (pour les capsules prédéfinies non reconnues ou autres cas)
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

      // Insérer les paiements avec gestion d'erreur
      console.log(`[WEBHOOK] ===== INSERTION DE ${paymentEntries.length} PAIEMENT(S) =====`)
      console.log(`[WEBHOOK] Paiements à insérer:`, paymentEntries.map(p => ({ 
        product_id: p.product_id, 
        payment_type: p.payment_type, 
        amount: p.amount,
        transaction_id: p.transaction_id
      })))
      
      // Vérifier si paymentEntries n'est pas vide
      if (paymentEntries.length === 0) {
        console.error('[WEBHOOK] ❌ ERREUR: Aucun paiement à insérer! Vérifier la logique de création.')
        return NextResponse.json({ received: true, error: 'Aucun paiement à insérer' })
      }
      
      const { data: insertedPayments, error: paymentInsertError } = await supabaseAdmin
        .from('payments')
        .insert(paymentEntries)
        .select()

      if (paymentInsertError) {
        console.error('[WEBHOOK] ❌ ERREUR insertion paiements:', paymentInsertError)
        console.error('[WEBHOOK] Détails erreur:', JSON.stringify(paymentInsertError, null, 2))
        console.error('[WEBHOOK] Paiements tentés:', JSON.stringify(paymentEntries, null, 2))
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
        // Si c'est une capsule de la boutique (category === 'capsules')
        else if (productCategory === 'capsules') {
          console.log(`[WEBHOOK] ✅ Capsule boutique ${item.id} ajoutée`)
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

