import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/metrics/usage?range=7d|30d
 * 
 * Retourne les métriques d'usage (capsules, outils)
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
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateISO = startDate.toISOString()

    // Top capsules consultées
    const { data: capsuleViews } = await supabaseAdmin
      .from('tracking_events')
      .select('payload')
      .eq('event_type', 'content.capsule_viewed')
      .gte('created_at', startDateISO)

    const capsuleStats = new Map<string, number>()
    capsuleViews?.forEach((event: any) => {
      const capsuleId = event.payload?.capsuleId || event.payload?.capsule_id
      if (capsuleId) {
        capsuleStats.set(capsuleId, (capsuleStats.get(capsuleId) || 0) + 1)
      }
    })

    const topCapsules = Array.from(capsuleStats.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top outils utilisés
    const { data: toolUses } = await supabaseAdmin
      .from('tracking_events')
      .select('payload')
      .eq('event_type', 'tool.used')
      .gte('created_at', startDateISO)

    const toolStats = new Map<string, number>()
    toolUses?.forEach((event: any) => {
      const toolKey = event.payload?.toolKey || event.payload?.tool_key
      if (toolKey) {
        toolStats.set(toolKey, (toolStats.get(toolKey) || 0) + 1)
      }
    })

    // Normaliser les noms d'outils pour un affichage cohérent
    const toolNameMap: Record<string, string> = {
      'budget_tracker': 'Budget & Suivi',
      'financial_fast': 'Jeûne Financier',
      'debt_free': 'Debt Free',
      'jeune_financier': 'Jeûne Financier' // Alias
    }

    const topTools = Array.from(toolStats.entries())
      .map(([key, count]) => ({ 
        key, 
        count,
        displayName: toolNameMap[key] || key
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Taux d'usage des abonnés
    const { data: activeSubscribers, error: subscribersError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .in('status', ['active', 'trialing'])

    if (subscribersError) {
      console.error('[METRICS USAGE] Error fetching subscribers:', subscribersError)
    }

    const subscriberIds = (subscribersError ? [] : activeSubscribers?.map((s: any) => s.user_id).filter((id: string) => id)) || []
    
    // Compter les abonnés uniques ayant utilisé au moins un outil
    let uniqueSubscribersUsingTools = 0
    if (subscriberIds.length > 0) {
      const { data: toolEvents, error: toolEventsError } = await supabaseAdmin
        .from('tracking_events')
        .select('user_id')
        .eq('event_type', 'tool.used')
        .in('user_id', subscriberIds)
        .gte('created_at', startDateISO)
      
      if (toolEventsError) {
        console.error('[METRICS USAGE] Error fetching tool events:', toolEventsError)
      } else {
        // Extraire les user_id uniques
        const uniqueUserIds = new Set(
          toolEvents?.map((e: any) => e.user_id).filter((id: string) => id) || []
        )
        uniqueSubscribersUsingTools = uniqueUserIds.size
      }
    }

    const usageRate = subscriberIds.length > 0 
      ? (uniqueSubscribersUsingTools / subscriberIds.length) * 100 
      : 0

    // Funnel capsule (vue → progression 50% → fin)
    const { data: capsuleProgress } = await supabaseAdmin
      .from('tracking_events')
      .select('payload')
      .eq('event_type', 'content.capsule_progress')
      .gte('created_at', startDateISO)

    const funnelData = {
      viewed: capsuleViews?.length || 0,
      progress50: capsuleProgress?.filter((e: any) => (e.payload?.percent || 0) >= 50).length || 0,
      progress100: capsuleProgress?.filter((e: any) => (e.payload?.percent || 0) >= 100).length || 0
    }

    return NextResponse.json({
      success: true,
      usage: {
        topCapsules,
        topTools,
        subscriberUsageRate: usageRate,
        funnel: funnelData
      },
      range,
      computedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[METRICS USAGE] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des métriques d\'usage' },
      { status: 500 }
    )
  }
}
