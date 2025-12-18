import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/metrics/overview?range=7d|30d
 * 
 * Retourne les KPI principaux pour le dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'autorisation admin (à implémenter selon votre système)
    // Pour l'instant, on assume que c'est appelé depuis une route admin protégée

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const days = range === '7d' ? 7 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateISO = startDate.toISOString()

    // Calculer en temps réel pour avoir les données les plus récentes
    let metrics: any = {}
    
    // Récupérer tous les utilisateurs avec pagination
    const MAX_PER_PAGE = 200
    const allUsersList: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: MAX_PER_PAGE
      })

      if (usersError) {
        console.error('[METRICS OVERVIEW] Erreur récupération utilisateurs:', usersError)
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

    // Récupérer les autres données
    const [
      { data: subscriptions, error: subscriptionsError },
      { data: payments, error: paymentsError },
      { count: activeUsers7dFromEvents },
      { count: activeUsers30dFromEvents }
    ] = await Promise.all([
      supabaseAdmin.from('user_subscriptions').select('*').in('status', ['active', 'trialing']),
      supabaseAdmin.from('payments').select('*').eq('status', 'success').gte('created_at', startDateISO),
      supabaseAdmin.from('tracking_events').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin.from('tracking_events').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null).gte('created_at', startDateISO)
    ])

    // Log des erreurs critiques uniquement
    if (subscriptionsError) console.error('[METRICS OVERVIEW] Erreur subscriptions:', subscriptionsError)
    if (paymentsError) console.error('[METRICS OVERVIEW] Erreur payments:', paymentsError)

    // Calculer les métriques depuis les utilisateurs
    const totalUsers = allUsersList.length
    const emailVerified = allUsersList.filter(u => u.email_confirmed_at).length
    const now = Date.now()
    const day24hAgo = now - 24 * 60 * 60 * 1000
    const day7dAgo = now - 7 * 24 * 60 * 60 * 1000
    const day30dAgo = startDate.getTime()

    const newUsers24h = allUsersList.filter(u => new Date(u.created_at).getTime() >= day24hAgo).length
    const newUsers7d = allUsersList.filter(u => new Date(u.created_at).getTime() >= day7dAgo).length
    const newUsers30d = allUsersList.filter(u => new Date(u.created_at).getTime() >= day30dAgo).length

    // Calculer les utilisateurs actifs depuis last_sign_in_at (plus fiable que tracking_events qui peut être vide)
    const activeUsers7d = allUsersList.filter(u => {
      if (!u.last_sign_in_at) return false
      return new Date(u.last_sign_in_at).getTime() >= day7dAgo
    }).length

    const activeUsers30d = allUsersList.filter(u => {
      if (!u.last_sign_in_at) return false
      return new Date(u.last_sign_in_at).getTime() >= day30dAgo
    }).length

    // Utiliser tracking_events si disponible, sinon fallback sur last_sign_in_at
    const finalActiveUsers7d = activeUsers7dFromEvents && activeUsers7dFromEvents > 0 ? activeUsers7dFromEvents : activeUsers7d
    const finalActiveUsers30d = activeUsers30dFromEvents && activeUsers30dFromEvents > 0 ? activeUsers30dFromEvents : activeUsers30d

    // Calculer MRR depuis les abonnements
    let mrr = 0
    if (subscriptions && subscriptions.length > 0) {
      // Récupérer le prix de l'abonnement depuis la table products
      const { data: subscriptionProducts } = await supabaseAdmin
        .from('products')
        .select('price')
        .or('category.eq.abonnement,id.eq.abonnement')
        .limit(1)
      
      const subscriptionPrice = subscriptionProducts && subscriptionProducts.length > 0 && subscriptionProducts[0]?.price
        ? parseFloat(subscriptionProducts[0].price) 
        : 39.98 // Fallback: valeur par défaut
      
      mrr = subscriptions.length * subscriptionPrice
    }

    // Calculer le revenu du mois
    const revenueMonth = payments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) || 0

    metrics = {
      totalUsers,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      activeUsers7d: finalActiveUsers7d,
      activeUsers30d: finalActiveUsers30d,
      emailVerifiedCount: emailVerified,
      emailVerifiedRate: totalUsers > 0 ? (emailVerified / totalUsers) * 100 : 0,
      activeSubscriptions: subscriptions?.length || 0,
      mrr,
      revenueMonth,
      paymentsCount: payments?.length || 0
    }

    // Calculer les variations en comparant avec la période précédente
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)
    const previousEndDate = new Date(startDate)
    const previousStartDateISO = previousStartDate.toISOString()
    const previousEndDateISO = previousEndDate.toISOString()
    
    // Récupérer les métriques de la période précédente (même durée)
    const previousDay7dAgo = previousEndDate.getTime() - 7 * 24 * 60 * 60 * 1000
    
    // Compter les nouveaux utilisateurs de la période précédente
    const previousNewUsers = allUsersList.filter(u => {
      const created = new Date(u.created_at).getTime()
      return created >= previousStartDate.getTime() && created < startDate.getTime()
    }).length

    // Utilisateurs actifs période précédente (7j et 30j)
    const previousActiveUsers7d = allUsersList.filter(u => {
      if (!u.last_sign_in_at) return false
      const lastSignIn = new Date(u.last_sign_in_at).getTime()
      return lastSignIn >= previousDay7dAgo && lastSignIn < day7dAgo
    }).length

    const previousActiveUsers30d = allUsersList.filter(u => {
      if (!u.last_sign_in_at) return false
      const lastSignIn = new Date(u.last_sign_in_at).getTime()
      return lastSignIn >= previousStartDate.getTime() && lastSignIn < startDate.getTime()
    }).length

    // Récupérer les paiements de la période précédente
    const { data: previousPayments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'success')
      .gte('created_at', previousStartDateISO)
      .lt('created_at', startDateISO)

    // Récupérer les abonnements de la période précédente pour MRR
    const { data: previousSubscriptions } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .in('status', ['active', 'trialing'])
      .lt('created_at', startDateISO)

    const previousRevenue = previousPayments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) || 0
    const subscriptionPrice = subscriptions && subscriptions.length > 0 ? mrr / subscriptions.length : 39.98
    const previousMRR = previousSubscriptions && previousSubscriptions.length > 0
      ? previousSubscriptions.length * subscriptionPrice
      : 0

    // Calculer les variations en pourcentage
    const calculateVariation = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100 * 10) / 10 // Arrondir à 1 décimale
    }

    const variations = {
      newUsers24h: 0, // Pas de comparaison pour 24h (trop court)
      newUsers7d: calculateVariation(newUsers7d, previousNewUsers),
      newUsers30d: calculateVariation(newUsers30d, previousNewUsers),
      activeUsers7d: calculateVariation(finalActiveUsers7d, previousActiveUsers7d),
      activeUsers30d: calculateVariation(finalActiveUsers30d, previousActiveUsers30d),
      mrr: calculateVariation(mrr, previousMRR),
      revenueMonth: calculateVariation(revenueMonth, previousRevenue)
    }

    return NextResponse.json({
      success: true,
      metrics: {
        ...metrics,
        variations
      },
      range,
      computedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[METRICS OVERVIEW] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des métriques' },
      { status: 500 }
    )
  }
}
