import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeGraceUntil } from '@/lib/subscriptionAccess'

const SUBSCRIPTION_PLAN_CODE = 'sagesse-salomon'
const MOBILE_MONEY_PRICE_ID = 'mobile_money_manual'

const addMonths = (date: Date, months: number) => {
  const cloned = new Date(date.getTime())
  cloned.setMonth(cloned.getMonth() + months)
  return cloned
}

async function activateSubscriptionFromOrder(order: any) {
  if (!supabaseAdmin || !order?.user_id) {
    console.warn('[ADMIN/ORDERS] Impossible d\'activer abonnement: user_id manquant', { orderId: order?.id, userId: order?.user_id })
    return
  }

  console.log('[ADMIN/ORDERS] 🔵 Activation abonnement Mobile Money pour commande', {
    orderId: order.id,
    userId: order.user_id,
    productId: order.product_id,
    productName: order.product_name,
    paymentMethod: order.payment_method
  })

  try {
    const now = new Date()
    const { data: existingSub, error: fetchError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', order.user_id)
      .maybeSingle()

    if (fetchError) {
      console.error('[ADMIN/ORDERS] ❌ Erreur récupération abonnement existant:', fetchError)
      return
    }

    // IMPORTANT: Ne pas réactiver un abonnement qui a été explicitement terminé par l'admin
    // SAUF si la commande est plus récente que la terminaison (nouvelle commande légitime)
    if (existingSub?.status === 'canceled') {
      const metadata = existingSub?.metadata as any
      const manuallyTerminated = metadata?.manually_terminated_by_admin === true
      
      if (manuallyTerminated && metadata?.terminated_at) {
        const terminatedAt = new Date(metadata.terminated_at)
        const orderCreatedAt = new Date(order.created_at)
        
        // Si la commande a été créée AVANT la terminaison, bloquer la réactivation
        // Si la commande a été créée APRÈS la terminaison, c'est une nouvelle commande légitime
        if (orderCreatedAt <= terminatedAt) {
          console.log('[ADMIN/ORDERS] 🚫 Abonnement terminé manuellement par admin, réactivation bloquée (commande ancienne)', {
            userId: order.user_id,
            terminatedAt: metadata.terminated_at,
            orderCreatedAt: order.created_at,
            orderId: order.id
          })
          return
        } else {
          console.log('[ADMIN/ORDERS] ✅ Nouvelle commande après terminaison, réactivation autorisée', {
            userId: order.user_id,
            terminatedAt: metadata.terminated_at,
            orderCreatedAt: order.created_at,
            orderId: order.id
          })
          // Le marqueur sera effacé par le payload.metadata = {} plus bas
        }
      }
    }

    const previousPeriodEnd = existingSub?.current_period_end ? new Date(existingSub.current_period_end) : null
    const startDate = previousPeriodEnd && previousPeriodEnd > now ? previousPeriodEnd : now
    const startISO = startDate.toISOString()
    const endDate = addMonths(startDate, 1)
    const endISO = endDate.toISOString()
    // computeGraceUntil attend une Date ou un timestamp, pas une string ISO
    const graceUntil = computeGraceUntil(endDate, 3)
    const priceId = order.payment_method === 'mobile_money' ? MOBILE_MONEY_PRICE_ID : existingSub?.price_id || MOBILE_MONEY_PRICE_ID

    const payload = {
      status: 'active',
      plan_id: existingSub?.plan_id || SUBSCRIPTION_PLAN_CODE,
      price_id: priceId,
      current_period_start: startISO,
      current_period_end: endISO,
      cancel_at_period_end: false,
      grace_until: graceUntil,
      // Effacer le marqueur de terminaison manuelle lors de la réactivation
      metadata: {},
      updated_at: new Date().toISOString()
    }

    console.log('[ADMIN/ORDERS] 📦 Payload abonnement:', {
      userId: order.user_id,
      status: payload.status,
      start: payload.current_period_start,
      end: payload.current_period_end,
      graceUntil: payload.grace_until,
      existingSub: !!existingSub
    })

    if (existingSub) {
      const { error: updateError } = await supabaseAdmin
        .from('user_subscriptions')
        .update(payload)
        .eq('user_id', order.user_id)

      if (updateError) {
        console.error('[ADMIN/ORDERS] ❌ Erreur mise à jour abonnement mobile money:', updateError)
      } else {
        console.log('[ADMIN/ORDERS] ✅ Abonnement mobile money prolongé pour l\'utilisateur', order.user_id)
      }
    } else {
      const insertPayload = {
        user_id: order.user_id,
        ...payload,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabaseAdmin.from('user_subscriptions').insert(insertPayload)
      if (insertError) {
        console.error('[ADMIN/ORDERS] ❌ Erreur création abonnement mobile money:', insertError)
      } else {
        console.log('[ADMIN/ORDERS] ✅ Abonnement mobile money créé pour l\'utilisateur', order.user_id)
      }
    }
  } catch (error) {
    console.error('[ADMIN/ORDERS] ❌ Erreur activation abonnement mobile money:', error)
  }
}

async function cancelSubscriptionFromOrder(order: any) {
  if (!supabaseAdmin || !order?.user_id) {
    console.warn('[ADMIN/ORDERS] ⚠️ Impossible de désactiver abonnement: user_id manquant', { orderId: order?.id })
    return
  }

  console.log('[ADMIN/ORDERS] 🔴 Désactivation abonnement pour commande', {
    orderId: order.id,
    userId: order.user_id,
    productId: order.product_id,
    paymentMethod: order.payment_method
  })

  try {
    const { data: existingSub, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, stripe_subscription_id, price_id, status')
      .eq('user_id', order.user_id)
      .maybeSingle()

    if (error) {
      console.error('[ADMIN/ORDERS] ❌ Erreur récupération abonnement:', error)
      return
    }

    if (!existingSub) {
      console.log('[ADMIN/ORDERS] ⚠️ Aucun abonnement trouvé pour cet utilisateur')
      return
    }

    console.log('[ADMIN/ORDERS] 📋 Abonnement existant:', {
      id: existingSub.id,
      stripeSubscriptionId: existingSub.stripe_subscription_id,
      priceId: existingSub.price_id,
      status: existingSub.status
    })

    // Détecter si c'est un abonnement Mobile Money
    // Un abonnement Mobile Money n'a pas de stripe_subscription_id OU a le price_id mobile_money_manual
    // OU la commande a été payée avec mobile_money
    const isMobileMoney = !existingSub.stripe_subscription_id || 
                         existingSub.price_id === MOBILE_MONEY_PRICE_ID ||
                         existingSub.price_id === 'mobile_money_manual' ||
                         order.payment_method === 'mobile_money'
    
    // Ne pas annuler un abonnement Stripe actif (sauf si c'est Mobile Money)
    if (existingSub.stripe_subscription_id && !isMobileMoney) {
      console.log('[ADMIN/ORDERS] ⚠️ Abonnement Stripe détecté (stripe_subscription_id:', existingSub.stripe_subscription_id, ', price_id:', existingSub.price_id, '), pas de désactivation automatique')
      return
    }
    
    // Si c'est Mobile Money, on peut désactiver
    if (!isMobileMoney && existingSub.stripe_subscription_id) {
      console.log('[ADMIN/ORDERS] ⚠️ Abonnement Stripe détecté, pas de désactivation automatique')
      return
    }

    console.log('[ADMIN/ORDERS] 🔴 Désactivation abonnement Mobile Money...')

    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: false,
        grace_until: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', order.user_id)

    if (updateError) {
      console.error('[ADMIN/ORDERS] ❌ Erreur désactivation abonnement mobile money:', updateError)
    } else {
      console.log('[ADMIN/ORDERS] ✅ Abonnement mobile money désactivé pour l\'utilisateur', order.user_id)
    }
  } catch (error) {
    console.error('[ADMIN/ORDERS] ❌ Erreur lors de la désactivation abonnement mobile money:', error)
  }
}

// GET: Récupérer toutes les commandes (avec filtres optionnels)
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')

    // Récupérer les commandes de la table orders
    let query = supabaseAdmin!
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('[ORDERS API] Erreur:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('[ORDERS API]', orders?.length || 0, 'commandes récupérées depuis orders')

    // Récupérer aussi TOUS les achats depuis user_capsules pour avoir une vue complète
    // Cela inclut TOUS les types de produits : masterclass, coaching, capsules, packs, etc.
    // qui peuvent ne pas être dans orders
    let capsulesQuery = supabaseAdmin!
      .from('user_capsules')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      capsulesQuery = capsulesQuery.eq('user_id', userId)
    }

    const { data: userCapsules, error: capsulesError } = await capsulesQuery

    if (capsulesError) {
      console.error('[ORDERS API] Erreur récupération user_capsules:', capsulesError)
      // On continue quand même avec les orders
    }

    console.log('[ORDERS API]', userCapsules?.length || 0, 'achats récupérés depuis user_capsules')

    // Récupérer aussi tous les abonnements depuis user_subscriptions
    let subscriptionsQuery = supabaseAdmin!
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      subscriptionsQuery = subscriptionsQuery.eq('user_id', userId)
    }

    const { data: userSubscriptions, error: subscriptionsError } = await subscriptionsQuery

    if (subscriptionsError) {
      console.error('[ORDERS API] Erreur récupération user_subscriptions:', subscriptionsError)
      // On continue quand même
    }

    console.log('[ORDERS API]', userSubscriptions?.length || 0, 'abonnements récupérés depuis user_subscriptions')

    // Récupérer les informations des produits pour enrichir les données
    const { data: allProducts } = await supabaseAdmin!
      .from('products')
      .select('id, name, category, price')
    
    const productMap = new Map<string, any>()
    if (allProducts) {
      allProducts.forEach((product: any) => {
        productMap.set(product.id, product)
      })
    }

    // Trouver le produit abonnement pour avoir son prix
    const subscriptionProduct = allProducts?.find((p: any) => 
      p.category === 'abonnement' || p.id === 'abonnement' || p.id?.toLowerCase() === 'abonnement'
    )

    // Créer des entrées "orders" virtuelles pour les achats qui n'ont pas de commande correspondante
    const virtualOrders: any[] = []
    
    // 1. Traiter les achats depuis user_capsules (masterclass, coaching, capsules, packs, etc.)
    if (userCapsules) {
      for (const capsule of userCapsules) {
        // Appliquer les filtres aux capsules
        if (userId && capsule.user_id !== userId) {
          continue
        }

        // Vérifier si une commande existe déjà pour cet achat (tous statuts, pas seulement 'paid')
        // Comparer aussi par nom de produit au cas où le product_id serait différent
        const existingOrder = orders?.find((o: any) => 
          o.user_id === capsule.user_id && 
          (o.product_id === capsule.capsule_id || 
           o.product_id?.toLowerCase() === capsule.capsule_id?.toLowerCase())
        )

        // Si pas de commande existante, créer une entrée virtuelle
        if (!existingOrder) {
          const product = productMap.get(capsule.capsule_id)
          const virtualOrder = {
            id: `virtual-${capsule.id}`,
            user_id: capsule.user_id,
            product_id: capsule.capsule_id,
            product_name: product?.name || capsule.capsule_id,
            amount: product?.price || 0,
            amount_fcfa: null,
            payment_method: 'stripe', // Par défaut, on suppose Stripe si pas d'info
            status: 'paid', // Les achats dans user_capsules sont considérés comme payés
            operator: null,
            msisdn: null,
            tx_ref: null,
            proof_path: null,
            transaction_id: `virtual-${capsule.capsule_id}-${capsule.user_id}`,
            created_at: capsule.created_at,
            updated_at: capsule.created_at,
            validated_at: capsule.created_at,
            validated_by: null,
            is_virtual: true // Marqueur pour indiquer que c'est une entrée virtuelle
          }

          // Appliquer les filtres de statut et méthode de paiement
          if (status && virtualOrder.status !== status) {
            continue
          }
          if (paymentMethod && virtualOrder.payment_method !== paymentMethod) {
            continue
          }

          virtualOrders.push(virtualOrder)
        }
      }
    }

    // 2. Traiter les abonnements depuis user_subscriptions
    if (userSubscriptions) {
      for (const subscription of userSubscriptions) {
        // Appliquer les filtres
        if (userId && subscription.user_id !== userId) {
          continue
        }

        // Vérifier si une commande existe déjà pour cet abonnement
        const existingOrder = orders?.find((o: any) => 
          o.user_id === subscription.user_id && 
          (o.product_id === 'abonnement' || o.product_id?.toLowerCase() === 'abonnement' || 
           o.product_name?.toLowerCase()?.includes('abonnement') || 
           o.product_name?.toLowerCase()?.includes('sagesse'))
        )

        // Si pas de commande existante et que l'abonnement est actif ou a été actif, créer une entrée virtuelle
        if (!existingOrder && (subscription.status === 'active' || subscription.status === 'canceled' || subscription.status === 'past_due')) {
          const subscriptionName = subscriptionProduct?.name || 'Abonnement Sagesse de Salomon'
          const subscriptionPrice = subscriptionProduct?.price || 0
          
          // Déterminer la méthode de paiement selon si c'est Stripe ou Mobile Money
          const paymentMethodSub = subscription.stripe_subscription_id ? 'stripe' : 'mobile_money'
          
          const virtualOrder = {
            id: `virtual-subscription-${subscription.user_id}`,
            user_id: subscription.user_id,
            product_id: 'abonnement',
            product_name: subscriptionName,
            amount: subscriptionPrice,
            amount_fcfa: null,
            payment_method: paymentMethodSub,
            status: subscription.status === 'active' ? 'paid' : (subscription.status === 'canceled' ? 'rejected' : 'paid'),
            operator: null,
            msisdn: null,
            tx_ref: null,
            proof_path: null,
            transaction_id: subscription.stripe_subscription_id || `subscription-${subscription.user_id}`,
            created_at: subscription.created_at || subscription.current_period_start || new Date().toISOString(),
            updated_at: subscription.updated_at || subscription.current_period_start || new Date().toISOString(),
            validated_at: subscription.created_at || subscription.current_period_start || new Date().toISOString(),
            validated_by: null,
            is_virtual: true
          }

          // Appliquer les filtres de statut et méthode de paiement
          if (status && virtualOrder.status !== status) {
            continue
          }
          if (paymentMethod && virtualOrder.payment_method !== paymentMethod) {
            continue
          }

          virtualOrders.push(virtualOrder)
        }
      }
    }

    // Combiner les commandes réelles et virtuelles
    const allOrders = [...(orders || []), ...virtualOrders]

    // Récupérer tous les utilisateurs pour enrichir les commandes avec email et nom
    // IMPORTANT: listUsers retourne seulement 50 utilisateurs par page par défaut, il faut paginer
    const MAX_PER_PAGE = 200
    const allUsersList: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabaseAdmin!.auth.admin.listUsers({
        page,
        perPage: MAX_PER_PAGE
      })

      if (error) {
        console.error('[ORDERS API] Erreur récupération utilisateurs (page', page, '):', error)
        // On continue quand même avec les utilisateurs déjà récupérés
        break
      }

      const batch = data?.users || []
      allUsersList.push(...batch)

      if (batch.length < MAX_PER_PAGE) {
        hasMore = false
      } else {
        page += 1
      }
    }

    console.log('[ORDERS API]', allUsersList.length, 'utilisateurs récupérés pour enrichissement')

    const userMap = new Map<string, { email: string, name?: string }>()
    
    allUsersList.forEach((user) => {
      // Essayer plusieurs formats de nom dans les métadonnées
      const firstName = user.user_metadata?.first_name || ''
      const lastName = user.user_metadata?.last_name || ''
      const fullName = firstName && lastName 
        ? `${firstName} ${lastName}`.trim()
        : user.user_metadata?.full_name || user.user_metadata?.name || undefined
      
      userMap.set(user.id, {
        email: user.email || '',
        name: fullName || user.email?.split('@')[0] || 'Utilisateur'
      })
    })

    // Enrichir les commandes avec les informations utilisateur
    const enrichedOrders = allOrders.map((order: any) => {
      const userInfo = userMap.get(order.user_id)
      const userEmail = userInfo?.email || null
      let userName = userInfo?.name || null
      
      // Si pas de nom mais qu'on a l'email, utiliser la partie avant @
      if (!userName && userEmail) {
        userName = userEmail.split('@')[0]
      }
      
      // Si on n'a toujours pas d'info utilisateur, essayer de récupérer directement
      if (!userInfo && order.user_id) {
        // Log pour debug
        console.log('[ORDERS API] ⚠️ Utilisateur non trouvé dans userMap:', {
          userId: order.user_id,
          productId: order.product_id,
          productName: order.product_name
        })
      }
      
      return {
        ...order,
        user_email: userEmail,
        user_name: userName
      }
    })

    // Calculer les statistiques
    const stats = {
      total: enrichedOrders.length,
      pending: enrichedOrders.filter((o: any) => o.status === 'pending_review').length,
      paid: enrichedOrders.filter((o: any) => o.status === 'paid').length,
      rejected: enrichedOrders.filter((o: any) => o.status === 'rejected').length,
      mobileMoney: enrichedOrders.filter((o: any) => o.payment_method === 'mobile_money').length,
      stripe: enrichedOrders.filter((o: any) => o.payment_method === 'stripe').length,
      totalRevenue: enrichedOrders.filter((o: any) => o.status === 'paid' && o.amount).reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0) || 0
    }

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      stats
    })

  } catch (error: any) {
    console.error('Erreur API admin orders GET:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer une nouvelle commande (ajout manuel par admin)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, productId, productName, amount, amountFcfa, paymentMethod, operator, msisdn, txRef } = body

    // Validations
    if (!userId || !productId || !productName || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Données manquantes (userId, productId, productName, amount, paymentMethod requis)' },
        { status: 400 }
      )
    }

    // Générer un transaction_id unique
    const transactionId = `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Créer la commande
    const orderData = {
      user_id: userId,
      product_id: productId,
      product_name: productName,
      amount: parseFloat(amount),
      amount_fcfa: amountFcfa ? parseFloat(amountFcfa) : null,
      payment_method: paymentMethod,
      status: 'paid', // Les commandes créées par admin sont directement payées
      operator: operator || null,
      msisdn: msisdn || null,
      tx_ref: txRef || null,
      proof_path: null,
      transaction_id: transactionId,
      validated_at: new Date().toISOString()
    }

    const { data: createdOrder, error: orderError } = await supabaseAdmin!
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Erreur création commande:', orderError)
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      )
    }

    if (productId === 'abonnement') {
      await activateSubscriptionFromOrder(createdOrder)
    }
    // Ajouter dans user_capsules si c'est un produit qui doit apparaître dans "Mes achats"
    else if (productId !== 'analyse-financiere') {
      try {
        const { error: capsuleError } = await supabaseAdmin!
          .from('user_capsules')
          .insert({
            user_id: userId,
            capsule_id: productId,
            created_at: new Date().toISOString()
          })

        if (capsuleError) {
          console.error('Erreur ajout capsule:', capsuleError)
          // On continue quand même
        } else {
          console.log('Capsule ajoutée dans user_capsules')
        }
      } catch (capsuleErr: any) {
        console.error('Erreur ajout capsule:', capsuleErr)
      }
    }

    console.log('Commande créée avec succès:', createdOrder?.id)

    return NextResponse.json({
      success: true,
      message: 'Commande créée avec succès',
      order: createdOrder
    })

  } catch (error) {
    console.error('Erreur API admin orders POST:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT: Mettre à jour une commande (validation, rejet, etc.)
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { orderId, status, validatedBy } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'orderId et status requis' },
        { status: 400 }
      )
    }

    // Vérifier que le statut est valide
    if (!['pending_review', 'paid', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide (pending_review, paid, rejected)' },
        { status: 400 }
      )
    }

    // Récupérer la commande existante
    const { data: existingOrder, error: fetchError } = await supabaseAdmin!
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !existingOrder) {
      console.error('[ADMIN/ORDERS] Commande non trouvée:', { orderId, fetchError })
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }
    

    // Fonction pour détecter si c'est une analyse financière (par ID ou catégorie)
    const isAnalysisFinanciere = async (order: any) => {
      // Vérifier par product_id (avec variations possibles)
      const productIdLower = order.product_id?.toLowerCase() || ''
      if (productIdLower === 'analyse-financiere' || 
          productIdLower.includes('analyse-financiere') ||
          productIdLower.includes('analyse financiere')) {
        return true
      }
      
      // Vérifier aussi par product_name (au cas où le product_id serait différent)
      const productNameLower = order.product_name?.toLowerCase() || ''
      if (productNameLower.includes('analyse financière') || 
          productNameLower.includes('analyse-financiere') ||
          productNameLower.includes('analyse financiere')) {
        return true
      }
      
      // Vérifier par catégorie du produit
      try {
        const { data: product, error: productError } = await supabaseAdmin!
          .from('products')
          .select('category')
          .eq('id', order.product_id)
          .single()
        
        if (productError) {
          return false
        }
        
        return product?.category === 'analyse-financiere' || product?.category === 'analyse financiere'
      } catch (error) {
        return false
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Si on valide (status = 'paid'), ajouter validated_at et validated_by
    if (status === 'paid') {
      updateData.validated_at = new Date().toISOString()
      if (validatedBy) {
        updateData.validated_by = validatedBy
      }

      // Cas spécial pour "analyse-financiere" : créer une entrée dans payments pour débloquer l'accès
      const isAnalysis = await isAnalysisFinanciere(existingOrder)
      
      console.log('[ADMIN/ORDERS] 🔍 Vérification analyse financière:', {
        orderId: existingOrder.id,
        product_id: existingOrder.product_id,
        product_name: existingOrder.product_name,
        payment_method: existingOrder.payment_method,
        status: existingOrder.status,
        isAnalysis,
        user_id: existingOrder.user_id
      })
      
      if (isAnalysis) {
        if (!existingOrder.user_id) {
          console.error('[ADMIN/ORDERS] ❌ Impossible de créer le paiement : user_id manquant pour la commande', existingOrder.id)
        } else {
          // Vérifier si un paiement existe déjà pour cette commande
          const { data: existingPayments, error: checkError } = await supabaseAdmin!
            .from('payments')
            .select('*')
            .eq('user_id', existingOrder.user_id)
            .eq('product_id', existingOrder.product_id)
            .eq('transaction_id', existingOrder.transaction_id)
          
          if (checkError) {
            console.error('[ADMIN/ORDERS] ❌ Erreur vérification paiement existant:', checkError)
          }
          
          const existingPayment = existingPayments && existingPayments.length > 0 ? existingPayments[0] : null

          // IMPORTANT: On crée TOUJOURS une nouvelle analyse pour chaque validation de commande Mobile Money
          // Chaque achat d'analyse financière doit créer sa propre analyse (comme pour Stripe)
          // On vérifie seulement les doublons récents (si la commande est validée plusieurs fois dans un court délai)
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
          const { data: recentAnalyses, error: analysisCheckError } = await supabaseAdmin!
            .from('analyses')
            .select('id, ticket, created_at')
            .eq('user_id', existingOrder.user_id)
            .eq('mode_paiement', 'Mobile Money')
            .gte('created_at', twoMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(5) // Vérifier les 5 dernières analyses Mobile Money récentes

          if (analysisCheckError) {
            console.error('[ADMIN/ORDERS] ❌ Erreur vérification analyses récentes:', analysisCheckError)
          }

          // On crée une nouvelle analyse sauf si une analyse Mobile Money a été créée dans les 2 dernières minutes
          // (pour éviter les doublons si la commande est validée plusieurs fois rapidement)
          const hasRecentAnalysis = recentAnalyses && recentAnalyses.length > 0

          // 1. Créer le paiement s'il n'existe pas
          if (!existingPayment) {
            const paymentData = {
              user_id: existingOrder.user_id,
              product_id: existingOrder.product_id,
              payment_type: 'analysis',
              amount: existingOrder.amount,
              currency: 'EUR',
              status: 'success',
              method: 'Mobile Money',
              transaction_id: existingOrder.transaction_id,
              created_at: new Date().toISOString()
            }
            
            const { data: insertedPayment, error: paymentError } = await supabaseAdmin!
              .from('payments')
              .insert(paymentData)
              .select()
              .single()

            if (paymentError) {
              console.error('[ADMIN/ORDERS] ❌ Erreur création paiement pour analyse:', paymentError)
              // On continue quand même pour ne pas bloquer la validation de la commande
            }
          }

          // 2. Créer TOUJOURS une nouvelle analyse pour chaque validation (sauf doublon récent)
          if (!hasRecentAnalysis) {
            try {
              // Fonction helper pour générer un ticket court
              const generateShortTicket = (): string => {
                const numbers = Math.floor(10000 + Math.random() * 90000) // 10000-99999
                const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                const letter = letters[Math.floor(Math.random() * letters.length)]
                return `${numbers}${letter}`
              }
              
              // Récupérer les informations utilisateur
              const { data: userData, error: userError } = await supabaseAdmin!.auth.admin.getUserById(existingOrder.user_id)
              
              if (userError) {
                console.error('[ADMIN/ORDERS] ❌ Erreur récupération utilisateur:', userError)
              }
              
              const userEmail = userData?.user?.email || ''
              const firstName = userData?.user?.user_metadata?.first_name || ''
              const lastName = userData?.user?.user_metadata?.last_name || ''
              const clientName = `${firstName} ${lastName}`.trim() || userEmail.split('@')[0] || 'Client'
              
              // Générer un ticket unique
              const ticket = `CASH-${generateShortTicket()}`
              
              const analysisData = {
                ticket: ticket,
                client_name: clientName,
                client_email: userEmail,
                status: 'en_cours',
                progress: 10,
                mode_paiement: 'Mobile Money',
                message: null,
                user_id: existingOrder.user_id
              }
              
              // Créer l'entrée dans analyses
              const { data: analysis, error: analysisError } = await supabaseAdmin!
                .from('analyses')
                .insert(analysisData)
                .select()
                .single()
              
              if (analysisError) {
                console.error('[ADMIN/ORDERS] ❌ Erreur création analyse:', analysisError)
              }
            } catch (error) {
              console.error('[ADMIN/ORDERS] ❌ Erreur lors de la création de l\'analyse:', error)
              // On continue quand même pour ne pas bloquer la validation
            }
          }
        }
      }
      // Activation abonnement mobile money
      // Vérifier aussi par product_name au cas où le product_id serait différent
      const isAbonnement = existingOrder.product_id === 'abonnement' || 
                           existingOrder.product_id?.toLowerCase() === 'abonnement' ||
                           existingOrder.product_name?.toLowerCase()?.includes('abonnement') ||
                           existingOrder.product_name?.toLowerCase()?.includes('sagesse')
      
      if (isAbonnement) {
        console.log('[ADMIN/ORDERS] 🔍 Détection abonnement:', {
          orderId: existingOrder.id,
          productId: existingOrder.product_id,
          productName: existingOrder.product_name,
          paymentMethod: existingOrder.payment_method
        })
        await activateSubscriptionFromOrder(existingOrder)
      }
      // Ajouter dans user_capsules si ce n'est pas déjà fait et si le produit doit apparaître dans "Mes achats"
      else {
        // Vérifier si la capsule existe déjà
        const { data: existingCapsule } = await supabaseAdmin!
          .from('user_capsules')
          .select('*')
          .eq('user_id', existingOrder.user_id)
          .eq('capsule_id', existingOrder.product_id)
          .single()

        if (!existingCapsule) {
          // Ajouter dans user_capsules
          const { error: capsuleError } = await supabaseAdmin!
            .from('user_capsules')
            .insert({
              user_id: existingOrder.user_id,
              capsule_id: existingOrder.product_id,
              created_at: new Date().toISOString()
            })

          if (capsuleError) {
            console.error('Erreur ajout capsule:', capsuleError)
            // On continue quand même
          } else {
            console.log('Capsule ajoutée dans user_capsules après validation')
          }
        }
      }
    }

    // Si on rejette (status = 'rejected'), supprimer le paiement pour analyse-financiere si existant
    if (status === 'rejected') {
      // Cas spécial pour "analyse-financiere" : supprimer le paiement correspondant s'il existe
      const isAnalysis = await isAnalysisFinanciere(existingOrder)
      if (isAnalysis && existingOrder.user_id) {
        const { error: deletePaymentError } = await supabaseAdmin!
          .from('payments')
          .delete()
          .eq('user_id', existingOrder.user_id)
          .eq('product_id', existingOrder.product_id)
          .eq('transaction_id', existingOrder.transaction_id)

        if (deletePaymentError) {
          console.error('[ADMIN/ORDERS] Erreur suppression paiement pour analyse:', deletePaymentError)
          // On continue quand même
        } else {
        }
      }
      // Retirer de user_capsules si présent pour les autres produits
      // Vérifier aussi par product_name au cas où le product_id serait différent
      const isAbonnementReject = existingOrder.product_id === 'abonnement' || 
                                 existingOrder.product_id?.toLowerCase() === 'abonnement' ||
                                 existingOrder.product_name?.toLowerCase()?.includes('abonnement') ||
                                 existingOrder.product_name?.toLowerCase()?.includes('sagesse')
      
      if (isAbonnementReject) {
        await cancelSubscriptionFromOrder(existingOrder)
      }
      else if (existingOrder.status === 'paid') {
        const { error: deleteError } = await supabaseAdmin!
          .from('user_capsules')
          .delete()
          .eq('user_id', existingOrder.user_id)
          .eq('capsule_id', existingOrder.product_id)

        if (deleteError) {
          console.error('Erreur suppression capsule:', deleteError)
          // On continue quand même
        } else {
          console.log('Capsule retirée de user_capsules après rejet')
        }
      }
    }

    // Mettre à jour la commande
    const { data: updatedOrder, error: updateError } = await supabaseAdmin!
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur mise à jour commande:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    
    // Préparer la réponse avec les informations de paiement créé
    let paymentCreated = false
    if (status === 'paid') {
      const isAnalysisCheck = await isAnalysisFinanciere(existingOrder)
      if (isAnalysisCheck) {
        // Vérifier si un paiement a été créé
        const { data: checkPayment } = await supabaseAdmin!
          .from('payments')
          .select('id')
          .eq('user_id', existingOrder.user_id)
          .eq('product_id', existingOrder.product_id)
          .eq('transaction_id', existingOrder.transaction_id)
          .limit(1)
        
        paymentCreated = !!(checkPayment && checkPayment.length > 0)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Commande mise à jour avec succès',
      order: updatedOrder,
      paymentCreated: paymentCreated || undefined // Inclure seulement si true
    })

  } catch (error) {
    console.error('Erreur API admin orders PUT:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer une commande
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId requis' },
        { status: 400 }
      )
    }

    // Vérifier si c'est un achat virtuel (commence par "virtual-")
    if (orderId.startsWith('virtual-')) {
      // Extraire l'ID réel de user_capsules
      const capsuleId = orderId.replace('virtual-', '')
      
      // Récupérer l'entrée user_capsules
      const { data: capsule, error: capsuleFetchError } = await supabaseAdmin!
        .from('user_capsules')
        .select('*')
        .eq('id', capsuleId)
        .single()

      if (capsuleFetchError || !capsule) {
        return NextResponse.json(
          { error: 'Achat virtuel non trouvé' },
          { status: 404 }
        )
      }

      console.log('[ADMIN/ORDERS] 🗑️ Suppression achat virtuel:', {
        capsuleId: capsule.id,
        userId: capsule.user_id,
        capsuleId_product: capsule.capsule_id
      })

      // Supprimer depuis user_capsules
      const { error: deleteError } = await supabaseAdmin!
        .from('user_capsules')
        .delete()
        .eq('id', capsuleId)

      if (deleteError) {
        console.error('Erreur suppression achat virtuel:', deleteError)
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        )
      }

      console.log('Achat virtuel supprimé avec succès:', capsuleId)

      return NextResponse.json({
        success: true,
        message: 'Achat virtuel supprimé avec succès'
      })
    }

    // Récupérer la commande existante pour vérifier si elle était payée
    const { data: existingOrder, error: fetchError } = await supabaseAdmin!
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    console.log('[ADMIN/ORDERS] 🗑️ Suppression commande demandée:', {
      orderId: existingOrder.id,
      userId: existingOrder.user_id,
      productId: existingOrder.product_id,
      productName: existingOrder.product_name,
      status: existingOrder.status,
      paymentMethod: existingOrder.payment_method
    })

    // Supprimer la capsule de user_capsules si elle existe et si la commande était payée
    // Cas spécial pour "analyse-financiere" : supprimer aussi le paiement
    if (existingOrder.status === 'paid') {
      // Vérifier si c'est une commande d'abonnement (plus robuste)
      const isAbonnement = existingOrder.product_id === 'abonnement' || 
                           existingOrder.product_id?.toLowerCase() === 'abonnement' ||
                           existingOrder.product_name?.toLowerCase()?.includes('abonnement') ||
                           existingOrder.product_name?.toLowerCase()?.includes('sagesse')
      
      if (existingOrder.product_id === 'analyse-financiere' && existingOrder.user_id) {
        // Supprimer le paiement correspondant
        const { error: paymentDeleteError } = await supabaseAdmin!
          .from('payments')
          .delete()
          .eq('user_id', existingOrder.user_id)
          .eq('product_id', 'analyse-financiere')
          .eq('transaction_id', existingOrder.transaction_id)

        if (paymentDeleteError) {
          console.error('[ADMIN/ORDERS] Erreur suppression paiement pour analyse:', paymentDeleteError)
          // On continue quand même
        }
      } else if (isAbonnement && existingOrder.user_id) {
        console.log('[ADMIN/ORDERS] 🔍 Commande abonnement détectée pour suppression:', {
          orderId: existingOrder.id,
          userId: existingOrder.user_id,
          productId: existingOrder.product_id,
          productName: existingOrder.product_name,
          paymentMethod: existingOrder.payment_method,
          status: existingOrder.status
        })
        
        // Pour les abonnements, vérifier s'il reste d'autres commandes d'abonnement payées
        const { data: allPaidOrders, error: checkError } = await supabaseAdmin!
          .from('orders')
          .select('id, product_id, product_name')
          .eq('user_id', existingOrder.user_id)
          .eq('status', 'paid')
          .neq('id', orderId)
        
        if (checkError) {
          console.error('[ADMIN/ORDERS] ❌ Erreur vérification autres commandes abonnement:', checkError)
        }
        
        // Filtrer les commandes d'abonnement
        const otherSubscriptionOrders = (allPaidOrders || []).filter((o: any) => {
          const isSub = o.product_id === 'abonnement' || 
                       o.product_id?.toLowerCase() === 'abonnement' ||
                       o.product_name?.toLowerCase()?.includes('abonnement') ||
                       o.product_name?.toLowerCase()?.includes('sagesse')
          return isSub
        })
        
        console.log('[ADMIN/ORDERS] 📊 Autres commandes abonnement payées trouvées:', otherSubscriptionOrders.length)
        
        // Ne désactiver l'abonnement que s'il n'y a plus d'autres commandes d'abonnement payées
        const hasOtherPaidSubscriptions = otherSubscriptionOrders.length > 0
        
        if (!hasOtherPaidSubscriptions) {
          console.log('[ADMIN/ORDERS] 🔴 Dernière commande abonnement supprimée, désactivation abonnement pour', existingOrder.user_id)
          await cancelSubscriptionFromOrder(existingOrder)
        } else {
          console.log('[ADMIN/ORDERS] ⚠️ D\'autres commandes abonnement payées existent (' + otherSubscriptionOrders.length + '), abonnement maintenu')
          console.log('[ADMIN/ORDERS] 📋 Autres commandes:', otherSubscriptionOrders.map((o: any) => ({ id: o.id, productId: o.product_id, productName: o.product_name })))
        }
      } else {
        // Supprimer de user_capsules pour les autres produits
        const { error: capsuleDeleteError } = await supabaseAdmin!
          .from('user_capsules')
          .delete()
          .eq('user_id', existingOrder.user_id)
          .eq('capsule_id', existingOrder.product_id)

        if (capsuleDeleteError) {
          console.error('Erreur suppression capsule:', capsuleDeleteError)
          // On continue quand même
        } else {
          console.log('Capsule supprimée de user_capsules')
        }
      }
    }

    // Supprimer la commande
    const { error: deleteError } = await supabaseAdmin!
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (deleteError) {
      console.error('Erreur suppression commande:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    console.log('Commande supprimée avec succès:', orderId)

    return NextResponse.json({
      success: true,
      message: 'Commande supprimée avec succès'
    })

  } catch (error) {
    console.error('Erreur API admin orders DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

