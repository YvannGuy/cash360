import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    console.log('[ORDERS API]', orders?.length || 0, 'commandes récupérées')

    // Récupérer tous les utilisateurs pour enrichir les commandes avec email et nom
    const { data: allUsers } = await supabaseAdmin!.auth.admin.listUsers()
    const userMap = new Map<string, { email: string, name?: string }>()
    
    if (allUsers?.users) {
      allUsers.users.forEach((user) => {
        userMap.set(user.id, {
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || undefined
        })
      })
    }

    // Enrichir les commandes avec les informations utilisateur
    const enrichedOrders = (orders || []).map((order: any) => {
      const userInfo = userMap.get(order.user_id)
      return {
        ...order,
        user_email: userInfo?.email || null,
        user_name: userInfo?.name || userInfo?.email?.split('@')[0] || null
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

    // Ajouter dans user_capsules si c'est un produit qui doit apparaître dans "Mes achats"
    // Exclure "analyse-financiere" et "abonnement"
    if (productId !== 'analyse-financiere' && productId !== 'abonnement') {
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
      // Ajouter dans user_capsules si ce n'est pas déjà fait et si le produit doit apparaître dans "Mes achats"
      else if (existingOrder.product_id !== 'abonnement') {
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
      else if (existingOrder.product_id !== 'abonnement' && existingOrder.status === 'paid') {
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

    // Supprimer la capsule de user_capsules si elle existe et si la commande était payée
    // Cas spécial pour "analyse-financiere" : supprimer aussi le paiement
    if (existingOrder.status === 'paid') {
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
      } else if (existingOrder.product_id !== 'abonnement') {
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
