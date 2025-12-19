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
    
    // Log pour vérification des dates calculées
    console.log('[METRICS OVERVIEW] Calcul des dates:', {
      range,
      days,
      startDate: startDate.toISOString(),
      startDateLocal: startDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      now: new Date().toISOString(),
      nowLocal: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
    })

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
    const day7dAgoISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const [
      { data: subscriptions, error: subscriptionsError },
      { data: payments, error: paymentsError },
      { count: activeUsers7dFromEvents, error: trackingEvents7dError },
      { count: activeUsers30dFromEvents, error: trackingEvents30dError },
      { data: allTrackingEvents7d, error: trackingEvents7dDataError },
      { data: allTrackingEvents30d, error: trackingEvents30dDataError }
    ] = await Promise.all([
      supabaseAdmin.from('user_subscriptions').select('*').in('status', ['active', 'trialing']),
      supabaseAdmin.from('payments').select('*').eq('status', 'success').gte('created_at', startDateISO),
      supabaseAdmin.from('tracking_events').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null).gte('created_at', day7dAgoISO),
      supabaseAdmin.from('tracking_events').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null).gte('created_at', startDateISO),
      supabaseAdmin.from('tracking_events').select('user_id, event_type').not('user_id', 'is', null).gte('created_at', day7dAgoISO),
      supabaseAdmin.from('tracking_events').select('user_id, event_type').not('user_id', 'is', null).gte('created_at', startDateISO)
    ])

    // Log des erreurs critiques uniquement
    if (subscriptionsError) console.error('[METRICS OVERVIEW] Erreur subscriptions:', subscriptionsError)
    if (paymentsError) console.error('[METRICS OVERVIEW] Erreur payments:', paymentsError)
    if (trackingEvents7dError) {
      console.error('[METRICS OVERVIEW] Erreur tracking_events 7d:', trackingEvents7dError)
      if (trackingEvents7dError.code === 'PGRST205') {
        console.warn('[METRICS OVERVIEW] PostgREST cache not refreshed for tracking_events. Using fallback to last_sign_in_at.')
      }
    }
    if (trackingEvents30dError) {
      console.error('[METRICS OVERVIEW] Erreur tracking_events 30d:', trackingEvents30dError)
      if (trackingEvents30dError.code === 'PGRST205') {
        console.warn('[METRICS OVERVIEW] PostgREST cache not refreshed for tracking_events. Using fallback to last_sign_in_at.')
      }
    }

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

    // Calculer les utilisateurs "Active Core" (au moins 1 core event dans la période)
    // Core events: budget.saved, budget.expense_added, debt.payment_made, debt.added, fast.day_logged, fast.started
    const CORE_EVENT_TYPES = new Set([
      'budget.saved',
      'budget.expense_added',
      'debt.payment_made',
      'debt.added',
      'fast.day_logged',
      'fast.started'
    ])

    const activeCoreUsers7d = new Set<string>()
    const activeCoreUsers30d = new Set<string>()

    if (allTrackingEvents7d && Array.isArray(allTrackingEvents7d)) {
      allTrackingEvents7d.forEach((event: any) => {
        if (event?.user_id && CORE_EVENT_TYPES.has(event.event_type)) {
          activeCoreUsers7d.add(event.user_id)
        }
      })
    }

    if (allTrackingEvents30d && Array.isArray(allTrackingEvents30d)) {
      allTrackingEvents30d.forEach((event: any) => {
        if (event?.user_id && CORE_EVENT_TYPES.has(event.event_type)) {
          activeCoreUsers30d.add(event.user_id)
        }
      })
    }

    // Log pour vérification (debug)
    console.log('[METRICS OVERVIEW] Active Core vs Active Any:', {
      '7d': {
        any: finalActiveUsers7d,
        core: activeCoreUsers7d.size,
        diff: finalActiveUsers7d - activeCoreUsers7d.size
      },
      '30d': {
        any: finalActiveUsers30d,
        core: activeCoreUsers30d.size,
        diff: finalActiveUsers30d - activeCoreUsers30d.size
      }
    })

    // Calculer MRR depuis les abonnements actifs
    // MRR = Monthly Recurring Revenue = revenu récurrent mensuel à l'instant T
    // Inclut: active, trialing, et past_due avec grace_until valide
    let mrr = 0
    let subscriptionPrice = 39.98 // Prix par défaut
    
    // Récupérer le prix de l'abonnement depuis la table products
    const { data: subscriptionProducts } = await supabaseAdmin
      .from('products')
      .select('*')
      .or('category.eq.abonnement,id.eq.abonnement')
      .limit(1)
    
    if (subscriptionProducts && subscriptionProducts.length > 0) {
      // Essayer différents champs pour le prix
      const product = subscriptionProducts[0]
      subscriptionPrice = parseFloat(product.price || product.amount || product.monthly_price || '39.98') || 39.98
    }
    
    // Récupérer TOUS les abonnements actifs (y compris past_due avec grace_until valide)
    // 1. Abonnements active/trialing
    const { data: activeTrialingSubs } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .in('status', ['active', 'trialing'])
    
    // 2. Abonnements past_due avec grace_until valide
    const nowISO = new Date().toISOString()
    const { data: pastDueValidSubs } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'past_due')
      .not('grace_until', 'is', null)
      .gt('grace_until', nowISO)
    
    const allActiveSubscriptions = [
      ...(activeTrialingSubs || []),
      ...(pastDueValidSubs || [])
    ]
    const activeSubsCount = allActiveSubscriptions.length
    mrr = activeSubsCount * subscriptionPrice

    // Calculer le revenu du mois
    const revenueMonth = payments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) || 0
    
    // Log détaillé pour vérification des revenus
    const paymentsByType = new Map<string, { count: number, total: number }>()
    payments?.forEach((p: any) => {
      const type = p.payment_type || p.product_id || 'unknown'
      const amount = parseFloat(p.amount) || 0
      const current = paymentsByType.get(type) || { count: 0, total: 0 }
      paymentsByType.set(type, {
        count: current.count + 1,
        total: current.total + amount
      })
    })
    
    console.log('[METRICS OVERVIEW] Calcul des revenus (30j):', {
      periode: {
        startDate: startDateISO,
        startDateLocal: startDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        endDate: new Date().toISOString(),
        endDateLocal: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        jours: days
      },
      paiements: {
        total: payments?.length || 0,
        avecMontant: payments?.filter((p: any) => parseFloat(p.amount || 0) > 0).length || 0,
        sansMontant: payments?.filter((p: any) => !p.amount || parseFloat(p.amount) === 0).length || 0
      },
      revenuTotal: revenueMonth,
      revenuParType: Object.fromEntries(paymentsByType),
      detailPaiements: payments?.slice(0, 5).map((p: any) => ({
        id: p.id,
        type: p.payment_type || p.product_id,
        amount: parseFloat(p.amount) || 0,
        status: p.status,
        date: p.created_at
      }))
    })

    metrics = {
      totalUsers,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      activeUsers7d: finalActiveUsers7d, // Active Any (7j)
      activeUsers30d: finalActiveUsers30d, // Active Any (30j)
      activeCoreUsers7d: activeCoreUsers7d.size, // Active Core (7j) - au moins 1 core event
      activeCoreUsers30d: activeCoreUsers30d.size, // Active Core (30j) - au moins 1 core event
      emailVerifiedCount: emailVerified,
      emailVerifiedRate: totalUsers > 0 ? (emailVerified / totalUsers) * 100 : 0,
      activeSubscriptions: activeSubsCount,
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

    // Calculer le MRR de la période précédente (même date du mois précédent)
    // Pour une comparaison juste, on calcule le MRR qui existait il y a X jours
    const previousComparisonDate = new Date(startDate)
    previousComparisonDate.setDate(previousComparisonDate.getDate() - days)
    const previousComparisonDateISO = previousComparisonDate.toISOString()
    
    // Récupérer les abonnements qui étaient actifs à la date de comparaison
    // Note: On utilise created_at < date_comparison car on veut savoir combien étaient actifs à ce moment
    // En réalité, pour un vrai MRR historique, il faudrait une table de snapshots, mais on approxime
    const { data: previousActiveTrialing } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .in('status', ['active', 'trialing'])
      .lt('created_at', previousComparisonDateISO)
    
    const { data: previousPastDueValid } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'past_due')
      .not('grace_until', 'is', null)
      .gt('grace_until', previousComparisonDateISO)
      .lt('created_at', previousComparisonDateISO)
    
    const previousSubscriptions = [
      ...(previousActiveTrialing || []),
      ...(previousPastDueValid || [])
    ]

    const previousRevenue = previousPayments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) || 0
    
    // Utiliser le même prix pour la comparaison (pas de calcul circulaire)
    const previousSubsCount = previousSubscriptions?.length || 0
    const previousMRR = previousSubsCount * subscriptionPrice

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
