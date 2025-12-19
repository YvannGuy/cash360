import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Récupérer les paiements depuis la base de données
    // La table payments pourrait ne pas exister, donc on essaie d'abord avec un fallback
    let payments: any[] = []
    let paymentsError: any = null
    
    try {
      const { data: paymentsData, error: paymentsErr } = await supabaseAdmin!
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (paymentsErr) {
        paymentsError = paymentsErr
        console.warn('[PAIEMENTS API] Table payments non trouvée, tentative depuis orders et user_subscriptions')
      } else {
        payments = paymentsData || []
      }
    } catch (err) {
      console.warn('[PAIEMENTS API] Erreur accès table payments:', err)
    }

    // Si la table payments n'existe pas ou est vide, récupérer depuis orders
    if (!payments || payments.length === 0 || paymentsError) {
      console.log('[PAIEMENTS API] Récupération depuis orders...')
      
      // Récupérer depuis orders (si la structure contient les champs nécessaires)
      let ordersData = null
      try {
        const result = await supabaseAdmin!
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000)
        ordersData = result.data
      } catch (err) {
        console.error('Erreur lors de la récupération des orders:', err)
        ordersData = null
      }

      // Convertir les orders en format payments si la structure le permet
      if (ordersData && Array.isArray(ordersData)) {
        // Vérifier si orders a les colonnes attendues (user_id, product_id, etc.)
        const sampleOrder = ordersData[0]
        if (sampleOrder && (sampleOrder.user_id || sampleOrder.customer_email)) {
          // Adapter les orders au format payments
          const convertedPayments = ordersData.map((order: any) => {
            // Essayer de trouver product_id dans metadata ou order_items
            let productId = order.product_id
            if (!productId && order.metadata) {
              try {
                const metadata = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata
                productId = metadata.product_id || metadata.items?.[0]?.id
              } catch {}
            }

            return {
              id: order.id,
              user_id: order.user_id || null,
              product_id: productId || 'unknown',
              payment_type: productId === 'abonnement' ? 'abonnement' : 'other',
              amount: order.total || order.subtotal || 0,
              status: order.status === 'PAID' ? 'paid' : order.status === 'PENDING' ? 'pending' : 'success',
              method: order.stripe_payment_intent_id ? 'stripe' : 'unknown',
              transaction_id: order.stripe_payment_intent_id || order.stripe_session_id || order.id,
              created_at: order.created_at || new Date().toISOString()
            }
          })
          payments = convertedPayments
        }
      }
    }

    // TOUJOURS récupérer les abonnements depuis user_subscriptions (même si payments existe)
    // Car les abonnements peuvent ne pas être dans payments
    console.log('[PAIEMENTS API] Récupération des abonnements depuis user_subscriptions...')
    let subscriptionsData = null
    try {
      const result = await supabaseAdmin!
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
      subscriptionsData = result.data
      console.log(`[PAIEMENTS API] ${subscriptionsData?.length || 0} abonnement(s) trouvé(s) dans user_subscriptions`)
    } catch (err) {
      console.error('Erreur lors de la récupération des subscriptions:', err)
      subscriptionsData = null
    }

    // Ajouter les abonnements depuis user_subscriptions
    if (subscriptionsData && Array.isArray(subscriptionsData) && subscriptionsData.length > 0) {
      // Récupérer le prix de l'abonnement depuis products
      const { data: subscriptionProducts } = await supabaseAdmin!
        .from('products')
        .select('id, name, price, category')
        .or('category.eq.abonnement,id.eq.abonnement')
        .limit(1)
      
      const subscriptionPrice = subscriptionProducts && subscriptionProducts.length > 0 
        ? parseFloat(subscriptionProducts[0].price || '0') 
        : 0
      
      // Filtrer pour éviter les doublons avec les paiements existants
      // Vérifier si un paiement existe déjà pour cet abonnement
      const existingSubscriptionIds = new Set(
        payments
          .filter((p: any) => p.payment_type === 'abonnement' || p.product_id === 'abonnement')
          .map((p: any) => p.user_id)
      )

      const subscriptionPayments = subscriptionsData
        .filter((sub: any) => !existingSubscriptionIds.has(sub.user_id)) // Éviter les doublons
        .map((sub: any) => ({
          id: `sub-${sub.user_id}-${sub.created_at || Date.now()}`,
          user_id: sub.user_id,
          product_id: 'abonnement',
          payment_type: 'abonnement',
          amount: subscriptionPrice,
          status: sub.status === 'active' ? 'paid' : (sub.status === 'canceled' ? 'completed' : (sub.status === 'past_due' ? 'pending' : (sub.status === 'trialing' ? 'paid' : 'paid'))),
          method: sub.stripe_subscription_id ? 'stripe' : 'mobile_money',
          transaction_id: sub.stripe_subscription_id || `subscription-${sub.user_id}`,
          created_at: sub.created_at || sub.current_period_start || new Date().toISOString()
        }))
      
      if (subscriptionPayments.length > 0) {
        payments = [...payments, ...subscriptionPayments]
        console.log(`[PAIEMENTS API] ${subscriptionPayments.length} abonnement(s) ajouté(s) depuis user_subscriptions`)
      } else {
        console.log('[PAIEMENTS API] Aucun nouvel abonnement à ajouter (déjà présents dans payments)')
      }
    }

    // Trier tous les paiements par date (plus récent en premier) après toutes les modifications
    if (payments && payments.length > 0) {
      payments = payments.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA // Plus récent en premier
      })
    }

    if (paymentsError && (!payments || payments.length === 0)) {
      console.error('[PAIEMENTS API] Aucun paiement trouvé après fallback')
    }

    console.log(`[PAIEMENTS API] ${payments?.length || 0} paiements récupérés de la DB`)
    
    // Log détaillé de tous les paiements
    if (payments && payments.length > 0) {
      console.log('[PAIEMENTS API] Détails de tous les paiements:', payments.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        product_id: p.product_id,
        payment_type: p.payment_type,
        amount: p.amount,
        status: p.status,
        created_at: p.created_at
      })))
      
      // Compter par type
      const byType = payments.reduce((acc: any, p: any) => {
        const type = p.payment_type || 'non défini'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      console.log('[PAIEMENTS API] Paiements par type:', byType)
      
      // Log spécifique pour les abonnements
      const subscriptions = payments.filter((p: any) => 
        p.payment_type === 'abonnement' || 
        p.payment_type === 'subscription' || 
        p.product_id === 'abonnement'
      )
      console.log(`[PAIEMENTS API] ${subscriptions.length} abonnement(s) trouvé(s):`, subscriptions.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        created_at: s.created_at,
        status: s.status
      })))
    }

    // Enrichir avec les infos utilisateurs (batch pour performance)
    const userIds = [...new Set((payments || []).map((p: any) => p.user_id).filter(Boolean))]
    const userMap = new Map()
    
    if (userIds.length > 0) {
      // Récupérer tous les utilisateurs en batch avec pagination (plus efficace)
      const MAX_PER_PAGE = 200
      let page = 1
      let hasMore = true
      const allUsersList: any[] = []

      while (hasMore) {
        const { data: usersData, error: usersError } = await supabaseAdmin!.auth.admin.listUsers({
          page,
          perPage: MAX_PER_PAGE
        })

        if (usersError) {
          console.error('[PAIEMENTS API] Erreur lors de la récupération des utilisateurs:', usersError)
          break
        }

        if (usersData?.users) {
          allUsersList.push(...usersData.users)
        }

        if (!usersData?.users || usersData.users.length < MAX_PER_PAGE) {
          hasMore = false
        } else {
          page += 1
        }
      }
      
      // Créer la map des utilisateurs
      allUsersList.forEach((authUser) => {
        if (userIds.includes(authUser.id)) {
          const firstName = authUser.user_metadata?.first_name || ''
          const lastName = authUser.user_metadata?.last_name || ''
          const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
          const email = authUser.email || ''
          
          userMap.set(authUser.id, {
            email: email,
            name: fullName || email?.split('@')[0] || 'Utilisateur inconnu'
          })
        }
      })
      
      console.log(`[PAIEMENTS API] ${userMap.size} utilisateurs trouvés sur ${userIds.length} user_ids uniques`)
    }

    // Récupérer les produits pour déterminer la catégorie (important pour détecter les abonnements)
    const { data: allProducts } = await supabaseAdmin!
      .from('products')
      .select('id, category, name')
    
    const productMap = new Map<string, any>()
    if (allProducts) {
      allProducts.forEach((product: any) => {
        productMap.set(product.id, product)
      })
    }

    const enrichedPayments = (payments || []).map((payment: any) => {
      const userInfo = userMap.get(payment.user_id)
      
      // Si l'utilisateur n'est pas trouvé, essayer d'utiliser l'email du paiement s'il existe
      let userName = 'Utilisateur inconnu'
      let userEmail = payment.user_email || payment.email || 'N/A'
      
      if (userInfo) {
        userName = userInfo.name
        userEmail = userInfo.email
      } else if (payment.user_id) {
        // Si on a un user_id mais pas d'utilisateur trouvé, afficher un ID tronqué
        userName = `ID: ${payment.user_id.substring(0, 8)}...`
        userEmail = 'Non trouvé'
      }
      
      // Déterminer le type de paiement en vérifiant aussi la catégorie du produit
      let paymentType = payment.payment_type
      const product = payment.product_id ? productMap.get(payment.product_id) : null
      
      // Si le payment_type n'est pas défini mais qu'on a une catégorie produit, l'utiliser
      if (!paymentType && product?.category) {
        paymentType = product.category
      }
      
      return {
        ...payment,
        user_name: userName,
        user_email: userEmail,
        type_label: getPaymentTypeLabel(paymentType, payment.product_id, product?.category),
        // Forcer payment_type si on peut le déterminer depuis la catégorie
        payment_type: paymentType || payment.payment_type
      }
    })
    
    // Log pour debug
    console.log(`[PAIEMENTS API] ${enrichedPayments.length} paiements enrichis et prêts à être renvoyés`)
    
    if (enrichedPayments.length > 0) {
      console.log(`[PAIEMENTS API] Tous les paiements enrichis:`, enrichedPayments.map((p: any) => ({
        id: p.id,
        user_email: p.user_email,
        product_id: p.product_id,
        payment_type: p.payment_type,
        type_label: p.type_label,
        amount: p.amount,
        status: p.status
      })))
    } else {
      console.log(`[PAIEMENTS API] Aucun paiement enrichi`)
    }

    // Calculer les statistiques
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Filtrer les paiements du mois actuel (tous statuts confondus pour le revenu mensuel)
    // Inclure tous les statuts qui indiquent un paiement réussi ou validé
    const monthlyPayments = enrichedPayments.filter(p => {
      const paymentDate = new Date(p.created_at)
      const validStatuses = ['success', 'succeeded', 'paid', 'completed', 'pending_review']
      return paymentDate >= firstDayOfMonth && validStatuses.includes(p.status)
    })
    
    // Filtrer tous les paiements réussis (tous statuts valides)
    const successfulPayments = enrichedPayments.filter(p => {
      const validStatuses = ['success', 'succeeded', 'paid', 'completed', 'pending_review']
      return validStatuses.includes(p.status)
    })
    
    const failedPayments = enrichedPayments.filter(p => p.status === 'failed')
    
    const stats = {
      monthlyRevenue: monthlyPayments.reduce((sum: number, p) => sum + parseFloat(p.amount || 0), 0),
      cumulativeRevenue: successfulPayments.reduce((sum: number, p) => sum + parseFloat(p.amount || 0), 0),
      transactions: enrichedPayments.length,
      failureRate: enrichedPayments.length > 0 ? (failedPayments.length / enrichedPayments.length) * 100 : 0,
      averageBasket: successfulPayments.length > 0 ? successfulPayments.reduce((sum: number, p) => sum + parseFloat(p.amount || 0), 0) / successfulPayments.length : 0
    }
    
    console.log('[PAIEMENTS API] Statistiques calculées:', {
      totalPayments: enrichedPayments.length,
      monthlyPayments: monthlyPayments.length,
      successfulPayments: successfulPayments.length,
      failedPayments: failedPayments.length,
      monthlyRevenue: stats.monthlyRevenue,
      cumulativeRevenue: stats.cumulativeRevenue
    })

    return NextResponse.json({
      success: true,
      payments: enrichedPayments,
      stats
    })

  } catch (error) {
    console.error('Erreur API admin paiements:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

function getPaymentTypeLabel(paymentType: string, productId?: string, productCategory?: string) {
  const typeLabels: { [key: string]: string } = {
    'analysis': 'Analyse financière',
    'analyse-financiere': 'Analyse financière',
    'capsule': 'Capsule',
    'pack': 'Pack complet',
    'ebook': 'Ebook',
    'abonnement': 'Abonnement',
    'subscription': 'Abonnement',
    'coaching': 'Coaching',
    'masterclass': 'Masterclass',
    'formation': 'Formation',
    'other': 'Autre'
  }
  
  // Si la catégorie du produit indique un abonnement, le traiter comme tel
  if (productCategory === 'abonnement' || productId?.toLowerCase() === 'abonnement') {
    return 'Abonnement'
  }
  
  // Si c'est une capsule prédéfinie (capsule1-5)
  if (productId && /^capsule[1-5]$/.test(productId)) {
    const capsuleNames: { [key: string]: string } = {
      'capsule1': "L'éducation financière",
      'capsule2': 'La mentalité de pauvreté',
      'capsule3': "Les lois spirituelles liées à l'argent",
      'capsule4': 'Les combats liés à la prospérité',
      'capsule5': 'Épargne et Investissement'
    }
    return `Capsule "${capsuleNames[productId] || productId}"`
  }
  
  if (paymentType === 'capsule' && productId) {
    const productNames: { [key: string]: string } = {
      'education-financiere': "L'éducation financière",
      'mentalite-pauvrete': 'La mentalité de pauvreté',
      'epargne-investissement': 'Épargne & investissement',
      'budget-responsable': 'Budget responsable',
      'endettement': 'Endettement intelligent',
      'pack-complet': 'Pack complet Cash360'
    }
    return `Capsule "${productNames[productId] || productId}"`
  }
  
  // Vérifier aussi par catégorie si payment_type n'est pas défini
  if (!paymentType && productCategory) {
    return typeLabels[productCategory] || productCategory || 'Non défini'
  }
  
  return typeLabels[paymentType] || paymentType || 'Non défini'
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const paymentIdRaw = searchParams.get('paymentId')

    if (!paymentIdRaw) {
      return NextResponse.json(
        { error: 'ID de paiement manquant' },
        { status: 400 }
      )
    }

    // Extraire uniquement l'UUID du paymentId (peut contenir une date après l'UUID)
    // Format attendu: UUID standard (36 caractères avec tirets) ou UUID suivi d'une date
    // Exemple: "sub-86ef448c-3ebf-411f-8ffe-ff4981f0fed4-2025-12-03T10:03:59.84+00:00"
    // Regex pour extraire un UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    
    let paymentId = paymentIdRaw
    
    // Si le paymentId commence par "sub-", extraire l'UUID qui suit
    if (paymentIdRaw.startsWith('sub-')) {
      // Prendre les 36 caractères après "sub-" (longueur d'un UUID standard)
      const uuidPart = paymentIdRaw.substring(4, 40) // "sub-" (4 chars) + UUID (36 chars)
      if (uuidPart.match(uuidRegex)) {
        paymentId = uuidPart
        console.log('UUID extrait depuis sub-:', paymentId, '(original:', paymentIdRaw, ')')
      } else {
        // Fallback: chercher l'UUID dans toute la chaîne
        const match = paymentIdRaw.match(uuidRegex)
        if (match) {
          paymentId = match[1]
          console.log('UUID extrait via regex:', paymentId, '(original:', paymentIdRaw, ')')
        }
      }
    } else {
      // Si pas de préfixe "sub-", chercher l'UUID dans la chaîne
      const match = paymentIdRaw.match(uuidRegex)
      if (match) {
        paymentId = match[1]
      }
    }

    console.log('Suppression du paiement:', paymentId, '(original reçu:', paymentIdRaw, ')')

    // Supprimer le paiement de la base de données avec l'ID nettoyé
    const { error: deleteError } = await supabaseAdmin!
      .from('payments')
      .delete()
      .eq('id', paymentId)

    if (deleteError) {
      console.error('Erreur lors de la suppression du paiement:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    console.log('Paiement supprimé avec succès:', paymentId)

    return NextResponse.json({
      success: true,
      message: 'Paiement supprimé avec succès',
      deletedPaymentId: paymentId
    })

  } catch (error) {
    console.error('Erreur API admin paiements DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

