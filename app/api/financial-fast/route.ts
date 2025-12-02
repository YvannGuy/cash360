import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { hasActiveSubscription } from '@/lib/subscriptionAccess'

type FastRow = {
  id: string
  title: string
  categories: string[]
  intention: string | null
  additional_notes?: string | null
  habit_name?: string | null
  habit_reminder?: string | null
  meta_categories?: Record<string, any> | null
  estimated_monthly_spend: number
  start_date: string
  end_date: string
  is_active: boolean
}

type FastDayRow = {
  id: string
  day_index: number
  date: string
  respected: boolean
  reflection?: string | null
}

const FAST_TITLE = 'Jeûne financier 30 jours'
const DAYS_COUNT = 30
const MS_IN_DAY = 1000 * 60 * 60 * 24

const formatDate = (value: Date) => value.toISOString().split('T')[0]

async function getActiveFast(supabase: any, userId: string) {
  const { data: fast, error } = await supabase
    .from('financial_fasts')
    .select('id, title, categories, intention, additional_notes, habit_name, habit_reminder, meta_categories, estimated_monthly_spend, start_date, end_date, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (!fast) {
    return { fast: null, days: [] }
  }

  const { data: days, error: daysError } = await supabase
    .from('financial_fast_days')
    .select('id, day_index, date, respected, reflection')
    .eq('fast_id', fast.id)
    .order('day_index', { ascending: true })

  if (daysError) {
    throw daysError
  }

  return { fast, days: days ?? [] }
}

const mapFastRow = (row: FastRow) => ({
  id: row.id,
  title: row.title,
  categories: row.categories ?? [],
  intention: row.intention ?? '',
  additionalNotes: row.additional_notes ?? '',
  habitName: row.habit_name ?? '',
  habitReminder: row.habit_reminder ?? '',
  categoryBudgets: row.meta_categories ?? {},
  estimatedMonthlySpend: Number(row.estimated_monthly_spend ?? 0),
  startDate: row.start_date,
  endDate: row.end_date,
  isActive: Boolean(row.is_active)
})

const mapDayRow = (row: FastDayRow) => ({
  id: row.id,
  dayIndex: row.day_index,
  date: row.date,
  respected: Boolean(row.respected),
  reflection: row.reflection || ''
})

async function userHasPremiumAccess(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('status, grace_until')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[FAST] subscription lookup error', error)
  }

  return hasActiveSubscription(data)
}

export async function GET() {
  try {
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

    const { fast, days } = await getActiveFast(supabase, user.id)

    if (!fast) {
      return NextResponse.json({ fast: null, days: [] })
    }

    return NextResponse.json({
      fast: mapFastRow(fast),
      days: days.map(mapDayRow)
    })
  } catch (error) {
    console.error('[GET /api/financial-fast] error', error)
    return NextResponse.json({ error: 'Impossible de charger le jeûne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const categories = Array.isArray(body.categories)
      ? body.categories.map((value: string) => value).filter(Boolean)
      : []
    const intention = typeof body.intention === 'string' ? body.intention.trim() : ''
    const additionalNotes = typeof body.additionalNotes === 'string' ? body.additionalNotes.trim() : ''
    const habitName = typeof body.habitName === 'string' ? body.habitName.trim() : ''
    const habitReminder = typeof body.habitReminder === 'string' ? body.habitReminder.trim() : ''
    const categoryBudgets =
      typeof body.categoryBudgets === 'object' && body.categoryBudgets !== null ? body.categoryBudgets : {}
    const estimatedMonthlySpend = Number(body.estimatedMonthlySpend ?? 0)

    if (categories.length === 0) {
      return NextResponse.json({ error: 'categories_required' }, { status: 400 })
    }

    if (!Number.isFinite(estimatedMonthlySpend) || estimatedMonthlySpend <= 0) {
      return NextResponse.json({ error: 'amount_invalid' }, { status: 400 })
    }

    const { data: existingFast } = await supabase
      .from('financial_fasts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (existingFast) {
      return NextResponse.json({ error: 'fast_exists' }, { status: 400 })
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const endDate = new Date(now.getTime() + (DAYS_COUNT - 1) * MS_IN_DAY)

    const sanitizedCategoryBudgets = Object.keys(categoryBudgets).reduce((acc, key) => {
      const value = Number(
        typeof categoryBudgets[key] === 'object' && categoryBudgets[key] !== null
          ? categoryBudgets[key].target
          : categoryBudgets[key]
      )
      if (Number.isFinite(value) && value >= 0) {
        acc[key] = { target: Number(value.toFixed(2)) }
      }
      return acc
    }, {} as Record<string, { target: number }>)

    const { data: fast, error: insertError } = await supabase
      .from('financial_fasts')
      .insert({
        user_id: user.id,
        title: FAST_TITLE,
        categories,
        intention,
        estimated_monthly_spend: estimatedMonthlySpend,
        additional_notes: additionalNotes,
        habit_name: habitName,
        habit_reminder: habitReminder,
        meta_categories: sanitizedCategoryBudgets,
        start_date: formatDate(now),
        end_date: formatDate(endDate),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(
        'id, title, categories, intention, additional_notes, habit_name, habit_reminder, meta_categories, estimated_monthly_spend, start_date, end_date, is_active'
      )
      .single()

    if (insertError || !fast) {
      console.error('[POST /api/financial-fast] insert fast error', insertError)
      return NextResponse.json({ error: 'create_failed' }, { status: 500 })
    }

    const dayRows = Array.from({ length: DAYS_COUNT }).map((_, index) => {
      const dayDate = new Date(now.getTime() + index * MS_IN_DAY)
      return {
        fast_id: fast.id,
        day_index: index + 1,
        date: formatDate(dayDate),
        respected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    const { error: daysError } = await supabase.from('financial_fast_days').insert(dayRows)

    if (daysError) {
      console.error('[POST /api/financial-fast] days insert error', daysError)
      return NextResponse.json({ error: 'create_failed' }, { status: 500 })
    }

    const { fast: latestFast, days: latestDays } = await getActiveFast(supabase, user.id)

    return NextResponse.json({
      fast: latestFast ? mapFastRow(latestFast) : null,
      days: latestDays.map(mapDayRow)
    })
  } catch (error) {
    console.error('[POST /api/financial-fast] error', error)
    return NextResponse.json({ error: 'Impossible de créer le jeûne' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    if (body?.action !== 'close' || typeof body.fastId !== 'string') {
      return NextResponse.json({ error: 'Action non supportée' }, { status: 400 })
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

    const { data: fast, error: fetchError } = await supabase
      .from('financial_fasts')
      .select('id')
      .eq('id', body.fastId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('[PATCH /api/financial-fast] fetch error', fetchError)
      return NextResponse.json({ error: 'fast_not_found' }, { status: 404 })
    }

    if (!fast) {
      return NextResponse.json({ error: 'fast_not_found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('financial_fasts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', body.fastId)

    if (updateError) {
      console.error('[PATCH /api/financial-fast] update error', updateError)
      return NextResponse.json({ error: 'close_failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/financial-fast] error', error)
    return NextResponse.json({ error: 'Action impossible' }, { status: 500 })
  }
}

