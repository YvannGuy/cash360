import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/metrics/paid-usage?range=30d
 * 
 * Métriques d'usage des abonnés actifs (niveau SaaS)
 * Utilise des requêtes SQL directes pour des métriques précises
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const days = range === '7d' ? 7 : 30

    // Récupérer les données via PostgREST et traiter côté serveur
    let toolUsageData: any[] = []
    let totalActive = 0
    let cartFunnel: any = { carts_opened: 0, checkouts_started: 0, purchases_completed: 0, abandoned: 0 }

    try {
      // 1. Récupérer les abonnés actifs
      // Récupérer tous les abonnés actifs/trialing
      const { data: activeTrialing } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id, status, grace_until')
        .in('status', ['active', 'trialing'])

      // Récupérer les past_due avec grace_until valide
      const { data: pastDueValid } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id, status, grace_until')
        .eq('status', 'past_due')
        .not('grace_until', 'is', null)
        .gt('grace_until', new Date().toISOString())

      const activeSubs = [...(activeTrialing || []), ...(pastDueValid || [])]

      const activeUserIds = new Set((activeSubs || []).map((s: any) => s.user_id))
      totalActive = activeUserIds.size

      // 2. Récupérer les événements de tracking des 30 derniers jours
      const startDateObj = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const startDate = startDateObj.toISOString()
      
      // Log pour vérification des dates calculées
      console.log('[METRICS PAID-USAGE] Calcul des dates:', {
        range,
        days,
        startDate,
        startDateLocal: startDateObj.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        now: new Date().toISOString(),
        nowLocal: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
      })
      
      const { data: allEvents } = await supabaseAdmin
        .from('tracking_events')
        .select('*')
        .gte('created_at', startDate)
        .not('user_id', 'is', null)
        .limit(50000)

      // 3. Filtrer les événements des abonnés actifs et grouper par outil
      const CORE_EVENTS: Record<string, Set<string>> = {
        budget: new Set(['budget.saved', 'budget.expense_added']),
        debt_free: new Set(['debt.payment_made', 'debt.added']),
        fast: new Set(['fast.day_logged', 'fast.started'])
      }

      const toolMap = new Map<string, {
        users: Set<string>
        sessions: Set<string>
        days: Set<string>
        events_total: number   // tous les events (debug)
        visits: number         // tool.opened
        core_actions: number   // actions clés
        lastActivity: Date | null
      }>()

      allEvents?.forEach((event: any) => {
        if (!event?.user_id) return
        if (!activeUserIds.has(event.user_id)) return

        // Déterminer l'outil
        let tool: string | null = null

        if (event.event_type?.startsWith('budget.') || event.payload?.tool === 'budget') {
          tool = 'budget'
        } else if (event.event_type?.startsWith('debt.') || event.payload?.tool === 'debt_free') {
          tool = 'debt_free'
        } else if (event.event_type?.startsWith('fast.') || event.payload?.tool === 'fast') {
          tool = 'fast'
        } else if (event.event_type === 'tool.opened' || event.event_type === 'tool.used') {
          tool = event.payload?.tool || null
        }

        if (!tool) return

        if (!toolMap.has(tool)) {
          toolMap.set(tool, {
            users: new Set(),
            sessions: new Set(),
            days: new Set(),
            events_total: 0,
            visits: 0,
            core_actions: 0,
            lastActivity: null
          })
        }

        const stats = toolMap.get(tool)!

        stats.users.add(event.user_id)
        if (event.session_id) stats.sessions.add(event.session_id)

        const eventDate = new Date(event.created_at)
        const eventDay = eventDate.toISOString().split('T')[0]
        stats.days.add(eventDay)

        // 1) total events (debug)
        stats.events_total++

        // 2) visits
        if (event.event_type === 'tool.opened') {
          stats.visits++
        }

        // 3) core actions (vraie valeur)
        const coreSet = CORE_EVENTS[tool]
        if (coreSet?.has(event.event_type)) {
          stats.core_actions++
        }

        // last activity
        if (!stats.lastActivity || eventDate > stats.lastActivity) {
          stats.lastActivity = eventDate
        }
      })

      toolUsageData = Array.from(toolMap.entries()).map(([tool, stats]) => ({
        tool,
        paid_users_used: stats.users.size,
        sessions: stats.sessions.size,         // si session_id est fiable
        active_days: stats.days.size,          // robuste
        visits: stats.visits,                  // utile si tu veux l'afficher / tooltip
        core_actions: stats.core_actions,      // ✅ vrai core
        events_total: stats.events_total,      // debug/tooltip
        last_activity: stats.lastActivity?.toISOString() || null
      }))

      // 4. Funnel panier
      const cartEvents = allEvents?.filter((e: any) =>
        ['shop.cart_opened', 'shop.checkout_started', 'shop.purchase_completed'].includes(e.event_type)
      ) || []

      const cartSessions = new Map<string, { opened: boolean, checkoutStarted: boolean, completed: boolean }>()
      cartEvents.forEach((event: any) => {
        const sessionKey = event.session_id || event.user_id || `anon_${event.id}`
        if (!cartSessions.has(sessionKey)) {
          cartSessions.set(sessionKey, { opened: false, checkoutStarted: false, completed: false })
        }
        const session = cartSessions.get(sessionKey)!
        if (event.event_type === 'shop.cart_opened') session.opened = true
        if (event.event_type === 'shop.checkout_started') session.checkoutStarted = true
        if (event.event_type === 'shop.purchase_completed') session.completed = true
      })

      cartFunnel = {
        carts_opened: Array.from(cartSessions.values()).filter(s => s.opened).length,
        checkouts_started: Array.from(cartSessions.values()).filter(s => s.checkoutStarted).length,
        purchases_completed: Array.from(cartSessions.values()).filter(s => s.completed).length,
        abandoned: Array.from(cartSessions.values()).filter(s => s.opened && !s.completed).length
      }
    } catch (error: any) {
      console.error('[METRICS PAID USAGE] Error processing data:', error)
      // Continuer avec des valeurs par défaut
      const { data: allEvents } = await supabaseAdmin
        .from('tracking_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .not('user_id', 'is', null)
        .limit(10000)

      // Traiter les données côté serveur (fallback avec même logique)
      const activeSubs = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id')
        .or('status.eq.active,status.eq.trialing,and(past_due.gt.grace_until,grace_until.gt.now())')

      const activeUserIds = new Set((activeSubs.data || []).map((s: any) => s.user_id))

      const CORE_EVENTS_FALLBACK: Record<string, Set<string>> = {
        budget: new Set(['budget.saved', 'budget.expense_added']),
        debt_free: new Set(['debt.payment_made', 'debt.added']),
        fast: new Set(['fast.day_logged', 'fast.started'])
      }

      const toolMap = new Map<string, {
        users: Set<string>
        sessions: Set<string>
        days: Set<string>
        events_total: number
        visits: number
        core_actions: number
        lastActivity: Date | null
      }>()

      allEvents?.forEach((event: any) => {
        if (!event?.user_id) return
        if (!activeUserIds.has(event.user_id)) return

        let tool: string | null = null
        if (event.event_type?.startsWith('budget.') || event.payload?.tool === 'budget') {
          tool = 'budget'
        } else if (event.event_type?.startsWith('debt.') || event.payload?.tool === 'debt_free') {
          tool = 'debt_free'
        } else if (event.event_type?.startsWith('fast.') || event.payload?.tool === 'fast') {
          tool = 'fast'
        } else if (event.event_type === 'tool.opened' || event.event_type === 'tool.used') {
          tool = event.payload?.tool || null
        }

        if (!tool) return

        if (!toolMap.has(tool)) {
          toolMap.set(tool, {
            users: new Set(),
            sessions: new Set(),
            days: new Set(),
            events_total: 0,
            visits: 0,
            core_actions: 0,
            lastActivity: null
          })
        }

        const stats = toolMap.get(tool)!
        stats.users.add(event.user_id)
        if (event.session_id) stats.sessions.add(event.session_id)

        const eventDate = new Date(event.created_at)
        const eventDay = eventDate.toISOString().split('T')[0]
        stats.days.add(eventDay)

        stats.events_total++
        if (event.event_type === 'tool.opened') {
          stats.visits++
        }
        const coreSet = CORE_EVENTS_FALLBACK[tool]
        if (coreSet?.has(event.event_type)) {
          stats.core_actions++
        }

        if (!stats.lastActivity || eventDate > stats.lastActivity) {
          stats.lastActivity = eventDate
        }
      })

      toolUsageData = Array.from(toolMap.entries()).map(([tool, stats]) => ({
        tool,
        paid_users_used: stats.users.size,
        sessions: stats.sessions.size,
        active_days: stats.days.size,
        visits: stats.visits,
        core_actions: stats.core_actions,
        events_total: stats.events_total,
        last_activity: stats.lastActivity?.toISOString() || null
      }))

      // Total actifs
      const { count } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.active,status.eq.trialing')
      totalActive = count || 0

      // Funnel panier
      const cartEvents = allEvents?.filter((e: any) => 
        ['shop.cart_opened', 'shop.checkout_started', 'shop.purchase_completed'].includes(e.event_type)
      ) || []

      const cartSessions = new Map<string, { opened: boolean, checkoutStarted: boolean, completed: boolean }>()
      cartEvents.forEach((event: any) => {
        const sessionKey = event.session_id || event.user_id || `anon_${event.id}`
        if (!cartSessions.has(sessionKey)) {
          cartSessions.set(sessionKey, { opened: false, checkoutStarted: false, completed: false })
        }
        const session = cartSessions.get(sessionKey)!
        if (event.event_type === 'shop.cart_opened') session.opened = true
        if (event.event_type === 'shop.checkout_started') session.checkoutStarted = true
        if (event.event_type === 'shop.purchase_completed') session.completed = true
      })

      cartFunnel = {
        carts_opened: Array.from(cartSessions.values()).filter(s => s.opened).length,
        checkouts_started: Array.from(cartSessions.values()).filter(s => s.checkoutStarted).length,
        purchases_completed: Array.from(cartSessions.values()).filter(s => s.completed).length,
        abandoned: Array.from(cartSessions.values()).filter(s => s.opened && !s.completed).length
      }
    }

    // Formater les résultats
    const tools = {
      budget: { 
        paidUsersUsed: 0, 
        totalActive: totalActive, 
        sessions: 0, 
        activeDays: 0,
        visits: 0,
        coreActions: 0, 
        eventsTotal: 0,
        lastActivity: null 
      },
      debt_free: { 
        paidUsersUsed: 0, 
        totalActive: totalActive, 
        sessions: 0, 
        activeDays: 0,
        visits: 0,
        coreActions: 0, 
        eventsTotal: 0,
        lastActivity: null 
      },
      fast: { 
        paidUsersUsed: 0, 
        totalActive: totalActive, 
        sessions: 0, 
        activeDays: 0,
        visits: 0,
        coreActions: 0, 
        eventsTotal: 0,
        lastActivity: null 
      }
    }

    toolUsageData.forEach((row: any) => {
      const tool = row.tool
      const toolData = {
        paidUsersUsed: row.paid_users_used || 0,
        totalActive: totalActive,
        sessions: row.sessions || 0,
        activeDays: row.active_days || 0,
        visits: row.visits || 0,
        coreActions: row.core_actions || 0,
        eventsTotal: row.events_total || 0,
        lastActivity: row.last_activity
      }

      if (tool === 'budget') {
        tools.budget = toolData
      } else if (tool === 'debt_free') {
        tools.debt_free = toolData
      } else if (tool === 'fast') {
        tools.fast = toolData
      }
    })

    const conversionRate = cartFunnel.carts_opened > 0
      ? ((cartFunnel.purchases_completed / cartFunnel.carts_opened) * 100).toFixed(1)
      : '0.0'

    return NextResponse.json({
      success: true,
      tools,
      cart: {
        cartsOpened: cartFunnel.carts_opened || 0,
        checkoutsStarted: cartFunnel.checkouts_started || 0,
        purchasesCompleted: cartFunnel.purchases_completed || 0,
        abandoned: cartFunnel.abandoned || 0,
        conversionRate: parseFloat(conversionRate)
      },
      range,
      computedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[METRICS PAID USAGE] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des métriques', details: error.message },
      { status: 500 }
    )
  }
}
