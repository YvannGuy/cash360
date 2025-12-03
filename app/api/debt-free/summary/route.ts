import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { hasActiveSubscription } from '@/lib/subscriptionAccess'

type DebtSummary = {
  totalDebtMonthlyPayments: number
  estimatedTotalDebtAmount?: number
  availableMarginMonthly: number
  fastSavingsMonthly: number
  estimatedMonthsToFreedom: number
  estimatedMonthsToFreedomWithFast: number
}

// Catégories identifiées comme des dettes
const DEBT_CATEGORY_KEYWORDS = [
  'dette',
  'dettes',
  'debt',
  'crédit',
  'credit',
  'crédits',
  'remboursement',
  'repayment',
  'prêt',
  'loan',
  'prêts',
  'mensualité',
  'monthly payment',
  'paiement',
  'payment'
]

function isDebtCategory(category: string): boolean {
  const normalized = category.toLowerCase().trim()
  return DEBT_CATEGORY_KEYWORDS.some(keyword => normalized.includes(keyword))
}

async function userHasPremiumAccess(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('status, grace_until')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[DEBT-FREE] subscription lookup error', error)
  }

  return hasActiveSubscription(data)
}

async function getCurrentMonthSlug(): Promise<string> {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function toMonthDateString(monthSlug: string): string {
  return `${monthSlug}-01`
}

async function getUserDebtSummary(supabase: any, userId: string): Promise<DebtSummary> {
  const monthSlug = await getCurrentMonthSlug()
  const monthDate = toMonthDateString(monthSlug)

  // 1. Récupérer le budget du mois courant
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('id, monthly_income, budget_expenses(id, category, amount)')
    .eq('user_id', userId)
    .eq('month', monthDate)
    .maybeSingle()

  if (budgetError && budgetError.code !== 'PGRST116') {
    throw budgetError
  }

  const monthlyIncome = Number(budget?.monthly_income ?? 0)
  const expenses = (budget?.budget_expenses || []) as Array<{ category: string; amount: number }>

  // 2. Identifier les paiements de dettes
  const debtExpenses = expenses.filter(exp => isDebtCategory(exp.category))
  const totalDebtMonthlyPayments = debtExpenses.reduce((sum, exp) => sum + Number(exp.amount ?? 0), 0)

  // 3. Calculer toutes les dépenses (y compris dettes)
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount ?? 0), 0)

  // 4. Calculer la marge disponible (revenu - toutes dépenses)
  const availableMarginMonthly = Math.max(0, monthlyIncome - totalExpenses)

  // 5. Récupérer le jeûne financier actif et calculer les économies
  const { data: fast, error: fastError } = await supabase
    .from('financial_fasts')
    .select('id, estimated_monthly_spend, start_date, end_date, financial_fast_days(respected)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let fastSavingsMonthly = 0

  if (!fastError && fast) {
    const estimatedMonthlySpend = Number(fast.estimated_monthly_spend ?? 0)
    const days = (fast.financial_fast_days || []) as Array<{ respected: boolean }>
    const respectedDays = days.filter(d => d.respected === true).length

    // Calculer les économies mensuelles basées sur les jours respectés
    // Si 30 jours respectés = économies mensuelles complètes
    // Sinon = proportionnelle
    if (respectedDays > 0 && estimatedMonthlySpend > 0) {
      // Économies mensuelles = (estimated_monthly_spend / 30) * jours_respectés
      // Mais on veut une projection mensuelle, donc on multiplie par (30 / jours_écoulés)
      const today = new Date()
      const startDate = new Date(fast.start_date)
      const daysElapsed = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      
      if (daysElapsed > 0) {
        const savingsPerDay = (estimatedMonthlySpend / 30) * respectedDays
        fastSavingsMonthly = Math.min(estimatedMonthlySpend, savingsPerDay * (30 / daysElapsed))
      }
    }
  }

  // 6. Projection simple du temps de remboursement
  // Pour une projection basique, on estime que le montant total de dettes
  // est égal à 12 mois de paiements (approximation)
  // Si l'utilisateur n'a pas saisi de montant total, on utilise cette estimation
  const estimatedTotalDebtAmount = totalDebtMonthlyPayments * 12 // Estimation simple

  // Temps estimé sans économies du jeûne
  const totalAvailableForDebt = totalDebtMonthlyPayments + availableMarginMonthly
  const estimatedMonthsToFreedom = totalAvailableForDebt > 0
    ? Math.ceil(estimatedTotalDebtAmount / totalAvailableForDebt)
    : 999 // Si pas de marge, projection très longue

  // Temps estimé avec économies du jeûne
  const totalAvailableWithFast = totalAvailableForDebt + fastSavingsMonthly
  const estimatedMonthsToFreedomWithFast = totalAvailableWithFast > 0
    ? Math.ceil(estimatedTotalDebtAmount / totalAvailableWithFast)
    : 999

  return {
    totalDebtMonthlyPayments,
    estimatedTotalDebtAmount,
    availableMarginMonthly,
    fastSavingsMonthly,
    estimatedMonthsToFreedom,
    estimatedMonthsToFreedomWithFast
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

    const summary = await getUserDebtSummary(supabase, user.id)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('[GET /api/debt-free/summary] error', error)
    return NextResponse.json({ error: 'Impossible de calculer le résumé des dettes' }, { status: 500 })
  }
}

