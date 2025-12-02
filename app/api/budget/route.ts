import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { hasActiveSubscription } from '@/lib/subscriptionAccess'

interface BudgetExpensePayload {
  id?: string
  category: string
  amount: number
}

interface BudgetResponse {
  month: string
  monthlyIncome: number
  expenses: BudgetExpensePayload[]
}

const MONTH_PATTERN = /^\d{4}-\d{2}$/

const getCurrentMonthSlug = (): string => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

const resolveMonth = (month?: string | null): string => {
  if (month && MONTH_PATTERN.test(month)) {
    return month
  }
  return getCurrentMonthSlug()
}

const toMonthDateString = (monthSlug: string): string => `${monthSlug}-01`

const extractMonthSlug = (value: string | null | undefined, fallback: string): string => {
  if (typeof value === 'string') {
    const [year, month] = value.split('-')
    if (year && month) {
      return `${year}-${month.padStart(2, '0')}`
    }
  }
  return fallback
}

async function userHasPremiumAccess(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('status, grace_until')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[BUDGET] subscription lookup error', error)
  }

  return hasActiveSubscription(data)
}

async function fetchBudgetForMonth(supabase: any, userId: string, monthSlug: string): Promise<BudgetResponse> {
  const monthDate = toMonthDateString(monthSlug)
  const { data, error } = await supabase
    .from('budgets')
    .select('id, month, monthly_income, budget_expenses(id, category, amount)')
    .eq('user_id', userId)
    .eq('month', monthDate)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (!data) {
    return {
      month: monthSlug,
      monthlyIncome: 0,
      expenses: []
    }
  }

  const responseMonth = extractMonthSlug(data.month, monthSlug)

  return {
    month: responseMonth,
    monthlyIncome: Number(data.monthly_income ?? 0),
    expenses: (data.budget_expenses || []).map((expense: any) => ({
      id: expense.id,
      category: expense.category,
      amount: Number(expense.amount ?? 0)
    }))
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const monthSlug = resolveMonth(searchParams.get('month'))

    const payload = await fetchBudgetForMonth(supabase, user.id, monthSlug)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[GET /api/budget] erreur', error)
    return NextResponse.json({ error: 'Impossible de charger le budget' }, { status: 500 })
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
    const monthSlug = resolveMonth(body.month)
    const monthDate = toMonthDateString(monthSlug)
    const monthlyIncome = Number(body.monthlyIncome ?? 0)

    if (Number.isNaN(monthlyIncome) || monthlyIncome < 0) {
      return NextResponse.json({ error: 'Le revenu doit être positif.' }, { status: 400 })
    }

    const expensesPayload: BudgetExpensePayload[] = Array.isArray(body.expenses)
      ? body.expenses
      : []

    const sanitizedExpenses = expensesPayload
      .map((expense) => ({
        category: typeof expense.category === 'string' ? expense.category.trim() : '',
        amount: Number(expense.amount ?? 0)
      }))
      .filter((expense) => expense.category.length > 0 && !Number.isNaN(expense.amount) && expense.amount >= 0)

    const { data: upsertedBudget, error: upsertError } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: user.id,
          month: monthDate,
          monthly_income: monthlyIncome,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,month' }
      )
      .select('id')
      .single()

    if (upsertError || !upsertedBudget) {
      console.error('[POST /api/budget] upsert error', upsertError)
      return NextResponse.json({ error: 'Impossible de sauvegarder le budget' }, { status: 500 })
    }

    const budgetId = upsertedBudget.id

    const { error: deleteError } = await supabase.from('budget_expenses').delete().eq('budget_id', budgetId)
    if (deleteError) {
      console.error('[POST /api/budget] delete expenses error', deleteError)
      return NextResponse.json({ error: 'Impossible de synchroniser les dépenses' }, { status: 500 })
    }

    if (sanitizedExpenses.length > 0) {
      const { error: insertError } = await supabase
        .from('budget_expenses')
        .insert(
          sanitizedExpenses.map((expense) => ({
            budget_id: budgetId,
            category: expense.category,
            amount: expense.amount
          }))
        )

      if (insertError) {
        console.error('[POST /api/budget] insert expenses error', insertError)
        return NextResponse.json({ error: 'Impossible de sauvegarder les dépenses' }, { status: 500 })
      }
    }

    const payload = await fetchBudgetForMonth(supabase, user.id, monthSlug)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[POST /api/budget] erreur', error)
    return NextResponse.json({ error: 'Impossible de sauvegarder le budget' }, { status: 500 })
  }
}
