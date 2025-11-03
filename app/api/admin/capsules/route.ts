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

    // Récupérer toutes les capsules achetées
    const { data: capsules, error } = await supabaseAdmin!
      .from('user_capsules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des capsules:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Récupérer les informations utilisateurs depuis auth.users (batch)
    const userIds = [...new Set((capsules || []).map((c: any) => c.user_id).filter(Boolean))]
    const userMap = new Map()
    
    if (userIds.length > 0) {
      const { data: allUsers } = await supabaseAdmin!.auth.admin.listUsers()
      
      if (allUsers?.users) {
        allUsers.users.forEach((authUser) => {
          if (userIds.includes(authUser.id)) {
            userMap.set(authUser.id, {
              email: authUser.email || 'Unknown',
              name: authUser.email?.split('@')[0] || 'Unknown User'
            })
          }
        })
      }
    }
    
    const enrichedCapsules = (capsules || []).map((capsule: any) => {
      const userInfo = userMap.get(capsule.user_id) || { email: 'Unknown', name: 'Unknown User' }
      return {
        ...capsule,
        user_email: userInfo.email,
        user_name: userInfo.name
      }
    })

    // Calculer les statistiques depuis les paiements réels
    const { data: allPayments } = await supabaseAdmin!
      .from('payments')
      .select('product_id, amount, payment_type')
      .eq('status', 'success')
      .in('payment_type', ['capsule', 'pack'])
    
    const totalSales = allPayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0
    const capsuleCounts = new Map<string, number>()
    
    allPayments?.forEach((p: any) => {
      if (p.payment_type === 'capsule' && p.product_id) {
        capsuleCounts.set(p.product_id, (capsuleCounts.get(p.product_id) || 0) + 1)
      }
    })
    
    const mostPopular = Array.from(capsuleCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Éducation financière'
    
    const stats = {
      totalSales,
      totalBuyers: new Set(enrichedCapsules.map(c => c.user_id)).size,
      mostPopular,
      repurchaseRate: 0 // TODO: calculer le taux de rachat
    }

    return NextResponse.json({
      success: true,
      capsules: enrichedCapsules,
      stats
    })

  } catch (error) {
    console.error('Erreur API admin capsules:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

