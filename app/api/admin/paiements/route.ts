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

    if (paymentsError) {
      console.error('Erreur lors de la récupération des paiements:', paymentsError)
      return NextResponse.json(
        { error: paymentsError.message },
        { status: 500 }
      )
    }

    // Enrichir avec les infos utilisateurs
    const enrichedPayments = await Promise.all(
      (payments || []).map(async (payment: any) => {
        try {
          const { data: authUser } = await supabaseAdmin!.auth.admin.getUserById(payment.user_id)
          return {
            ...payment,
            user_name: authUser?.user?.email?.split('@')[0] || 'Unknown',
            user_email: authUser?.user?.email || 'Unknown',
            type_label: getPaymentTypeLabel(payment.payment_type, payment.product_id)
          }
        } catch (err) {
          return {
            ...payment,
            user_name: 'Unknown',
            user_email: 'Unknown',
            type_label: getPaymentTypeLabel(payment.payment_type, payment.product_id)
          }
        }
      })
    )

    // Calculer les statistiques
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const monthlyPayments = enrichedPayments.filter(p => new Date(p.created_at) >= firstDayOfMonth)
    const successfulPayments = enrichedPayments.filter(p => p.status === 'success')
    const failedPayments = enrichedPayments.filter(p => p.status === 'failed')
    
    const stats = {
      monthlyRevenue: monthlyPayments.reduce((sum: number, p) => sum + parseFloat(p.amount), 0),
      cumulativeRevenue: successfulPayments.reduce((sum: number, p) => sum + parseFloat(p.amount), 0),
      transactions: enrichedPayments.length,
      failureRate: enrichedPayments.length > 0 ? (failedPayments.length / enrichedPayments.length) * 100 : 0,
      averageBasket: successfulPayments.length > 0 ? successfulPayments.reduce((sum: number, p) => sum + parseFloat(p.amount), 0) / successfulPayments.length : 0
    }

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
    'capsule': 'Capsule',
    'pack': 'Pack complet',
    'formation': 'Formation',
    'other': 'Autre'
  }
  
  if (paymentType === 'capsule' && productId) {
    const productNames: { [key: string]: string } = {
      'education-financiere': 'L\'éducation financière',
      'mentalite-pauvrete': 'La mentalité de pauvreté',
      'epargne-investissement': 'Épargne & investissement',
      'budget-responsable': 'Budget responsable',
      'endettement': 'Endettement intelligent',
      'pack-complet': 'Pack complet Cash360'
    }
    return `Capsule "${productNames[productId] || productId}"`
  }
  
  return typeLabels[paymentType] || paymentType
}

