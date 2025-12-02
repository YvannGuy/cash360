import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { hasActiveSubscription } from '@/lib/subscriptionAccess'

async function userHasPremiumAccess(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('status, grace_until')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[FAST DAY] subscription lookup error', error)
  }

  return hasActiveSubscription(data)
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const fastId = typeof body.fastId === 'string' ? body.fastId : ''
    const dayIndex = Number(body.dayIndex)
    const respected = typeof body.respected === 'boolean' ? body.respected : null
    const reflection =
      typeof body.reflection === 'string'
        ? body.reflection.trim()
        : body.reflection === null
          ? null
          : undefined

    if (!fastId || !Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > 30 || respected === null) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }

    const supabase = await createClientServer()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const premiumAccess = await userHasPremiumAccess(supabase, user.id)
    if (!premiumAccess) {
      return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
    }

    const { data: fast, error: fastError } = await supabase
      .from('financial_fasts')
      .select('id')
      .eq('id', fastId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fastError) {
      console.error('[PATCH /api/financial-fast/day] fast error', fastError)
      return NextResponse.json({ error: 'fast_not_found' }, { status: 404 })
    }

    if (!fast) {
      return NextResponse.json({ error: 'fast_not_found' }, { status: 404 })
    }

    const updatePayload: Record<string, any> = {
      respected,
      updated_at: new Date().toISOString()
    }
    if (reflection !== undefined) {
      updatePayload.reflection = reflection
    }

    const { data: day, error: updateError } = await supabase
      .from('financial_fast_days')
      .update(updatePayload)
      .eq('fast_id', fastId)
      .eq('day_index', dayIndex)
      .select('id, day_index, date, respected, reflection')
      .single()

    if (updateError || !day) {
      console.error('[PATCH /api/financial-fast/day] update error', updateError)
      return NextResponse.json({ error: 'update_failed' }, { status: 500 })
    }

    return NextResponse.json({
      day: {
        id: day.id,
        dayIndex: day.day_index,
        date: day.date,
        respected: Boolean(day.respected),
        reflection: day.reflection || ''
      }
    })
  } catch (error) {
    console.error('[PATCH /api/financial-fast/day] error', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

