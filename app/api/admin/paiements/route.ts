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
    const { data: payments, error: paymentsError } = await supabaseAdmin!
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000) // Limiter pour performance

    if (paymentsError) {
      console.error('[PAIEMENTS API] Erreur lors de la récupération des paiements:', paymentsError)
      return NextResponse.json(
        { error: paymentsError.message },
        { status: 500 }
      )
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
    }

    // Enrichir avec les infos utilisateurs (batch pour performance)
    const userIds = [...new Set((payments || []).map((p: any) => p.user_id).filter(Boolean))]
    const userMap = new Map()
    
    if (userIds.length > 0) {
      // Récupérer tous les utilisateurs en batch (plus efficace)
      const { data: allUsers } = await supabaseAdmin!.auth.admin.listUsers()
      
      if (allUsers?.users) {
        allUsers.users.forEach((authUser) => {
          if (userIds.includes(authUser.id)) {
            userMap.set(authUser.id, {
              email: authUser.email || 'Unknown',
              name: authUser.email?.split('@')[0] || 'Unknown'
            })
          }
        })
      }
    }

    const enrichedPayments = (payments || []).map((payment: any) => {
      const userInfo = userMap.get(payment.user_id) || { email: 'Unknown', name: 'Unknown' }
      return {
        ...payment,
        user_name: userInfo.name,
        user_email: userInfo.email,
        type_label: getPaymentTypeLabel(payment.payment_type, payment.product_id)
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
    const monthlyPayments = enrichedPayments.filter(p => {
      const paymentDate = new Date(p.created_at)
      return paymentDate >= firstDayOfMonth && (p.status === 'success' || p.status === 'succeeded' || p.status === 'paid')
    })
    
    // Filtrer tous les paiements réussis (tous statuts valides)
    const successfulPayments = enrichedPayments.filter(p => 
      p.status === 'success' || p.status === 'succeeded' || p.status === 'paid'
    )
    
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

function getPaymentTypeLabel(paymentType: string, productId?: string) {
  const typeLabels: { [key: string]: string } = {
    'analysis': 'Analyse financière',
    'analyse-financiere': 'Analyse financière',
    'capsule': 'Capsule',
    'pack': 'Pack complet',
    'ebook': 'Ebook',
    'abonnement': 'Abonnement',
    'subscription': 'Abonnement',
    'formation': 'Formation',
    'other': 'Autre'
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
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID de paiement manquant' },
        { status: 400 }
      )
    }

    console.log('Suppression du paiement:', paymentId)

    // Supprimer le paiement de la base de données
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

