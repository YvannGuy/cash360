import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/metrics/simple?range=7d|30d
 * 
 * Route simple et fiable pour récupérer les métriques d'usage
 * Utilise directement les requêtes Supabase avec fallback SQL si PostgREST échoue
 */
async function fetchTrackingEventsDirect(eventType: string | null, startDate: string): Promise<any[]> {
  if (!supabaseAdmin) return []

  // Méthode 1: Essayer avec .from() (PostgREST)
  try {
    let query = supabaseAdmin
      .from('tracking_events')
      .select('*')
      .gte('created_at', startDate)
      .limit(10000)

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data, error } = await query

    // Si PostgREST fonctionne, retourner les données
    if (!error && data) {
      console.log(`[METRICS SIMPLE] ✅ Récupéré ${data.length} événements via PostgREST pour ${eventType || 'tous'}`)
      return data
    }

    // Si erreur PostgREST, essayer méthode 2
    if (error && (error.code === 'PGRST205' || error.code === 'PGRST202')) {
      console.warn(`[METRICS SIMPLE] ⚠️ PostgREST ne voit pas la table (${error.code}), utilisation fonction SQL...`)
    }
  } catch (err: any) {
    console.warn('[METRICS SIMPLE] Exception avec .from():', err.message)
  }

  // Méthode 2: Utiliser la fonction SQL qui contourne PostgREST
  try {
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_tracking_events_bypass', {
      p_event_type: eventType || null,
      p_start_date: startDate
    })

    if (!rpcError && rpcData) {
      const events = Array.isArray(rpcData) ? rpcData : [rpcData]
      console.log(`[METRICS SIMPLE] ✅ Récupéré ${events.length} événements via fonction SQL pour ${eventType || 'tous'}`)
      return events
    }

    if (rpcError) {
      console.error(`[METRICS SIMPLE] ❌ Erreur fonction SQL:`, rpcError.code, rpcError.message)
    }
  } catch (err: any) {
    console.warn('[METRICS SIMPLE] Exception avec fonction SQL:', err.message)
  }

  // Si tout échoue, retourner tableau vide
  console.warn(`[METRICS SIMPLE] ⚠️ Toutes les méthodes ont échoué pour ${eventType || 'tous'}`)
  return []
}

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
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateISO = startDate.toISOString()
    
    // Log pour vérification des dates calculées
    console.log('[METRICS SIMPLE] Calcul des dates:', {
      range,
      days,
      startDate: startDateISO,
      startDateLocal: startDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      now: new Date().toISOString(),
      nowLocal: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
    })

    // Récupérer les événements outils
    const toolEvents = await fetchTrackingEventsDirect('tool.used', startDateISO)

    // Récupérer les événements panier (tous les événements shop)
    const shopEventTypes = ['shop.cart_opened', 'shop.add_to_cart', 'shop.checkout_started', 'shop.purchase_completed']
    const allCartEvents: any[] = []
    
    for (const eventType of shopEventTypes) {
      const events = await fetchTrackingEventsDirect(eventType, startDateISO)
      allCartEvents.push(...events)
    }
    
    const cartEvents = allCartEvents

    // Analyser les outils utilisés
    const toolStats = {
      budgetTracker: { users: new Set<string>(), sessions: new Set<string>() },
      debtFree: { users: new Set<string>(), sessions: new Set<string>() },
      jeuneFinancier: { users: new Set<string>(), sessions: new Set<string>() }
    }

    toolEvents?.forEach((event: any) => {
      const toolKey = event.payload?.toolKey || event.payload?.tool_key
      const userId = event.user_id
      const sessionId = event.session_id

      if (toolKey === 'budget_tracker' && userId) {
        toolStats.budgetTracker.users.add(userId)
        if (sessionId) toolStats.budgetTracker.sessions.add(sessionId)
      } else if (toolKey === 'debt_free' && userId) {
        toolStats.debtFree.users.add(userId)
        if (sessionId) toolStats.debtFree.sessions.add(sessionId)
      } else if ((toolKey === 'financial_fast' || toolKey === 'jeune_financier') && userId) {
        toolStats.jeuneFinancier.users.add(userId)
        if (sessionId) toolStats.jeuneFinancier.sessions.add(sessionId)
      }
    })

    // Analyser les événements panier
    const cartStats = {
      cartOpened: 0,
      checkoutStarted: 0,
      checkoutCompleted: 0,
      abandoned: 0
    }

    const cartSessions = new Map<string, { opened: boolean, checkoutStarted: boolean, completed: boolean }>()

    cartEvents.forEach((event: any) => {
      const eventType = event.event_type
      const userId = event.user_id
      const sessionId = event.session_id || `session_${userId || 'anon'}_${event.created_at}`

      if (!cartSessions.has(sessionId)) {
        cartSessions.set(sessionId, { opened: false, checkoutStarted: false, completed: false })
      }

      const session = cartSessions.get(sessionId)!

      if (eventType === 'shop.cart_opened') {
        session.opened = true
        cartStats.cartOpened++
      } else if (eventType === 'shop.checkout_started') {
        session.checkoutStarted = true
        cartStats.checkoutStarted++
      } else if (eventType === 'shop.purchase_completed') {
        session.completed = true
        cartStats.checkoutCompleted++
      } else if (eventType === 'shop.add_to_cart') {
        // Un ajout au panier compte comme ouverture de panier
        session.opened = true
      }
    })

    // Calculer les abandons (panier ouvert mais pas de checkout complété)
    cartSessions.forEach((session) => {
      if (session.opened && !session.completed) {
        cartStats.abandoned++
      }
    })

    return NextResponse.json({
      success: true,
      tools: {
        budgetTracker: {
          users: toolStats.budgetTracker.users.size,
          sessions: toolStats.budgetTracker.sessions.size
        },
        debtFree: {
          users: toolStats.debtFree.users.size,
          sessions: toolStats.debtFree.sessions.size
        },
        jeuneFinancier: {
          users: toolStats.jeuneFinancier.users.size,
          sessions: toolStats.jeuneFinancier.sessions.size
        }
      },
      cart: cartStats,
      range,
      computedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[METRICS SIMPLE] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des métriques' },
      { status: 500 }
    )
  }
}
