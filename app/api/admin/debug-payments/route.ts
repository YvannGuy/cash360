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

    // Récupérer tous les paiements avec détails
    const { data: payments, error: paymentsError } = await supabaseAdmin!
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (paymentsError) {
      return NextResponse.json(
        { error: paymentsError.message, payments: null },
        { status: 500 }
      )
    }

    // Récupérer tous les utilisateurs pour matcher
    const { data: allUsers } = await supabaseAdmin!.auth.admin.listUsers()
    const userMap = new Map()
    
    if (allUsers?.users) {
      allUsers.users.forEach((user) => {
        userMap.set(user.id, user.email)
      })
    }

    // Enrichir avec emails
    const enriched = (payments || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      user_email: userMap.get(p.user_id) || 'UNKNOWN',
      product_id: p.product_id,
      payment_type: p.payment_type,
      amount: p.amount,
      status: p.status,
      method: p.method,
      transaction_id: p.transaction_id,
      created_at: p.created_at
    }))

    // Filtrer par email sndrush12@gmail.com
    const searchParams = new URL(request.url).searchParams
    const emailFilter = searchParams.get('email')
    
    let filtered = enriched
    if (emailFilter) {
      filtered = enriched.filter((p: any) => 
        p.user_email?.toLowerCase().includes(emailFilter.toLowerCase())
      )
    }

    // Compter par type de paiement
    const byType = enriched.reduce((acc: any, p: any) => {
      const type = p.payment_type || 'non défini'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      total: payments?.length || 0,
      enriched: enriched.length,
      filtered: filtered.length,
      payments: filtered,
      allPayments: enriched,
      byType: byType,
      summary: {
        analysis: enriched.filter((p: any) => p.payment_type === 'analysis').length,
        capsule: enriched.filter((p: any) => p.payment_type === 'capsule').length,
        pack: enriched.filter((p: any) => p.payment_type === 'pack').length,
        ebook: enriched.filter((p: any) => p.payment_type === 'ebook').length,
        abonnement: enriched.filter((p: any) => p.payment_type === 'abonnement').length
      }
    })

  } catch (error: any) {
    console.error('Erreur debug paiements:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

