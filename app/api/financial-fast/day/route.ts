import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const fastId = typeof body.fastId === 'string' ? body.fastId : ''
    const dayIndex = Number(body.dayIndex)
    const respected = typeof body.respected === 'boolean' ? body.respected : null

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

    const { data: day, error: updateError } = await supabase
      .from('financial_fast_days')
      .update({ respected, updated_at: new Date().toISOString() })
      .eq('fast_id', fastId)
      .eq('day_index', dayIndex)
      .select('id, day_index, date, respected')
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
        respected: Boolean(day.respected)
      }
    })
  } catch (error) {
    console.error('[PATCH /api/financial-fast/day] error', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

