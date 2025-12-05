'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { useCurrency } from '@/lib/CurrencyContext'

type BudgetExpenseForm = {
  clientId: string
  id?: string
  category: string
  amount: string
}

export type BudgetSnapshot = {
  month: string
  monthlyIncome: number
  totalExpenses: number
  remaining: number
}

type BudgetTrackerProps = {
  variant?: 'page' | 'embedded'
  onBudgetChange?: (snapshot: BudgetSnapshot) => void
}

const EXPENSES_PER_PAGE = 5

const CATEGORY_SUGGESTIONS = [
  'Logement',
  'Transport',
  'Nourriture',
  'Église (dîme/offrandes)',
  'Loisirs',
  'Santé',
  'Éducation',
  'Autres'
]

const localeMap: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-PT'
}

const getCurrentMonthSlug = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

const generateClientId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

const normalizeAmount = (value: string): number => {
  if (!value) return 0
  const normalized = value.replace(',', '.').replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 999)

const computeSnapshot = (payload: any, fallbackMonth: string): BudgetSnapshot => {
  const incomeValue = Number(payload?.monthlyIncome ?? 0)
  const expensesArray = Array.isArray(payload?.expenses) ? payload.expenses : []
  const totalExpenses = expensesArray.reduce((sum: number, expense: any) => sum + Number(expense?.amount ?? 0), 0)

  return {
    month: payload?.month || fallbackMonth,
    monthlyIncome: incomeValue,
    totalExpenses,
    remaining: incomeValue - totalExpenses
  }
}

export default function BudgetTracker({ variant = 'page', onBudgetChange }: BudgetTrackerProps) {
  const isEmbedded = variant === 'embedded'
  const { t, language } = useLanguage()
  const { format: formatCurrency, symbol: currencySymbol } = useCurrency()
  const copy = t.dashboard?.budget ?? {}
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [expenses, setExpenses] = useState<BudgetExpenseForm[]>([])
  const [expensesPage, setExpensesPage] = useState(1)
  const [expenseSearch, setExpenseSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentMonth] = useState(getCurrentMonthSlug)
  const [requiresSubscription, setRequiresSubscription] = useState(false)

  const locale = localeMap[language as keyof typeof localeMap] ?? 'fr-FR'
  const timelineDateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }), [locale])
  const formatMoney = useCallback(
    (value: number) => formatCurrency(value),
    [formatCurrency]
  )

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + normalizeAmount(expense.amount), 0)
  }, [expenses])
  const hasExpenses = expenses.length > 0
  const normalizedSearch = expenseSearch.trim().toLowerCase()
  const filteredExpenses = useMemo(() => {
    if (!normalizedSearch) return expenses
    return expenses.filter((expense) => {
      const category = (expense.category || '').toLowerCase()
      const amountText = (expense.amount || '').toLowerCase()
      if (!category && !amountText) {
        return true
      }
      return category.includes(normalizedSearch) || amountText.includes(normalizedSearch)
    })
  }, [expenses, normalizedSearch])
  const hasFilteredExpenses = filteredExpenses.length > 0
  const subscriptionLock = (
    <div className={`${isEmbedded ? '' : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
      <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-8 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8v2m-6 5V6a2 2 0 012-2h6.5a2 2 0 011.6.8l3.5 4.2a2 2 0 01.4 1.2V17a2 2 0 01-2 2H8a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#012F4E] mb-2">
          {copy.subscriptionLockedTitle || 'Abonnement requis'}
        </h2>
        <p className="text-gray-600 mb-6">
          {copy.subscriptionLockedDescription ||
            'Souscrivez à l’abonnement Sagesse de Salomon pour débloquer le suivi budgétaire complet.'}
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/dashboard?tab=boutique#subscription'
          }}
          className="inline-flex items-center justify-center rounded-2xl bg-[#012F4E] px-6 py-3 text-white font-semibold shadow-lg hover:bg-[#023d68]"
        >
          {copy.subscriptionLockedCta || 'Découvrir l’abonnement'}
        </button>
      </div>
    </div>
  )
  const isSearchActive = normalizedSearch.length > 0

  const totalExpensePages = Math.max(1, Math.ceil(filteredExpenses.length / EXPENSES_PER_PAGE))
  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * EXPENSES_PER_PAGE
    return filteredExpenses.slice(start, start + EXPENSES_PER_PAGE)
  }, [filteredExpenses, expensesPage])

  const incomeValue = normalizeAmount(monthlyIncome)
  const remaining = incomeValue - totalExpenses
  const budgetUsage = incomeValue > 0 ? totalExpenses / incomeValue : 0
  const usagePercent = clampPercent(budgetUsage * 100)
  useEffect(() => {
    setExpensesPage((prev) => Math.min(prev, totalExpensePages))
  }, [totalExpensePages])
  useEffect(() => {
    setExpensesPage(1)
  }, [normalizedSearch])

  const usageStatus = useMemo(() => {
    if (budgetUsage <= 0.75) {
      return {
        barColor: 'bg-emerald-400',
        textColor: 'text-emerald-700',
        message: copy.usageHealthy || 'Vos dépenses sont maîtrisées, continuez ainsi.'
      }
    }
    if (budgetUsage <= 1) {
      return {
        barColor: 'bg-amber-400',
        textColor: 'text-amber-700',
        message: copy.usageWarning || 'Vous approchez de votre limite mensuelle, restez attentif.'
      }
    }
    return {
      barColor: 'bg-red-500',
      textColor: 'text-red-600',
      message: copy.usageCritical || 'Vous dépassez vos revenus : ajustez vos dépenses rapidement.'
    }
  }, [budgetUsage, copy.usageHealthy, copy.usageWarning, copy.usageCritical])

  const enrichExpenses = useCallback(() => {
    return expenses
      .map((expense) => ({
        ...expense,
        amountValue: normalizeAmount(expense.amount)
      }))
      .filter((expense) => expense.category && expense.amountValue > 0)
  }, [expenses])

  const sortedExpenses = useMemo(() => {
    return enrichExpenses().sort((a, b) => b.amountValue - a.amountValue)
  }, [enrichExpenses])

  const topExpenses = useMemo(() => sortedExpenses.slice(0, 4), [sortedExpenses])
  const otherExpensesAmount = Math.max(totalExpenses - topExpenses.reduce((sum, expense) => sum + expense.amountValue, 0), 0)
  const latestExpense = sortedExpenses[0]

  const intlToday = timelineDateFormatter.format(new Date())
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(`${currentMonth}-01T00:00:00`)),
    [currentMonth, locale]
  )
  const paginationInfoText = useMemo(() => {
    const template = copy.paginationInfo || 'Page {current} sur {total}'
    return template.replace('{current}', String(expensesPage)).replace('{total}', String(totalExpensePages))
  }, [copy.paginationInfo, expensesPage, totalExpensePages])

  const goToPreviousPage = useCallback(() => {
    setExpensesPage((prev) => Math.max(1, prev - 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setExpensesPage((prev) => Math.min(totalExpensePages, prev + 1))
  }, [totalExpensePages])

  const timelineEntries = useMemo(() => {
    const remainingLabelLower = copy.remainingLabel ? copy.remainingLabel.toLowerCase() : 'restant'
    return [
      {
        title: copy.activityBudgetUpdated || 'Budget mis à jour',
        detail: `${formatMoney(Math.max(totalExpenses, 0))}`,
        date: intlToday
      },
      latestExpense
        ? {
            title: copy.activityExpenseAdded || 'Dernière dépense enregistrée',
            detail: `${latestExpense.category} · ${formatMoney(latestExpense.amountValue)}`,
            date: intlToday
          }
        : {
            title: copy.activityExpenseAdded || 'Dernière dépense enregistrée',
            detail: copy.emptyExpenses || 'Ajoutez votre première dépense.',
            date: '—'
          },
      {
        title: copy.activityGoal || "Objectif d'épargne",
        detail:
          remaining > 0
            ? `${formatMoney(remaining)} ${remainingLabelLower}`
            : copy.negativeMessage || 'Rééquilibrez vos dépenses',
        date: intlToday
      }
    ]
  }, [copy.activityBudgetUpdated, copy.activityExpenseAdded, copy.activityGoal, copy.emptyExpenses, copy.negativeMessage, copy.remainingLabel, formatMoney, intlToday, latestExpense, remaining, totalExpenses])

  const statsCards = useMemo(() => {
    const safeIncome = Math.max(incomeValue, 0)
    const safeExpenses = Math.max(totalExpenses, 0)
    const safeRemaining = remaining
    const usageLabelLower = copy.usageLabel ? copy.usageLabel.toLowerCase() : ''

    return [
      {
        label: copy.monthlyIncomeLabel || 'Revenu mensuel net',
        value: formatMoney(safeIncome),
        hint: monthLabel
      },
      {
        label: copy.totalExpensesLabel || 'Total des dépenses',
        value: formatMoney(safeExpenses),
        hint: usageLabelLower ? `${usagePercent.toFixed(0)}% ${usageLabelLower}` : `${usagePercent.toFixed(0)}%`
      },
      {
        label: copy.remainingLabel || 'Solde restant',
        value: formatMoney(safeRemaining),
        hint:
          safeRemaining > 0
            ? copy.positiveMessage || 'Vos dépenses sont inférieures à vos revenus.'
            : copy.negativeMessage || 'Vos dépenses dépassent vos revenus.',
        isRemaining: true,
        remainingValue: safeRemaining
      },
      {
        label: copy.burnRateLabel || 'Burn rate',
        value: `${usagePercent.toFixed(0)}%`,
        hint: copy.burnRateHelper || 'Part du revenu déjà dépensée'
      }
    ]
  }, [
    copy.burnRateHelper,
    copy.burnRateLabel,
    copy.monthlyIncomeLabel,
    copy.negativeMessage,
    copy.positiveMessage,
    copy.remainingLabel,
    copy.totalExpensesLabel,
    copy.usageLabel,
    formatMoney,
    incomeValue,
    monthLabel,
    remaining,
    totalExpenses,
    usagePercent
  ])

  const notifySnapshotChange = useCallback(
    (payload: any) => {
      if (!onBudgetChange) return
      const snapshot = computeSnapshot(payload, currentMonth)
      onBudgetChange(snapshot)
    },
    [currentMonth, onBudgetChange]
  )

  const fetchBudget = useCallback(
    async (withFullLoader = true) => {
      if (withFullLoader) {
        setLoading(true)
      }
      try {
        const response = await fetch(`/api/budget?month=${currentMonth}`, { cache: 'no-store' })
        if (response.status === 401) {
          // Utilisateur non authentifié - ne pas afficher d'erreur, juste arrêter le chargement
          setLoading(false)
          setRequiresSubscription(false)
          return
        }
        if (response.status === 402) {
          setRequiresSubscription(true)
          setMonthlyIncome('')
          setExpenses([])
          setStatus({
            type: 'error',
            text: copy.subscriptionRequired || 'Un abonnement actif est nécessaire pour accéder au budget.'
          })
          return
        }
        if (!response.ok) {
          throw new Error(copy.fetchError || 'Impossible de charger vos données budgétaires.')
        }
        setRequiresSubscription(false)
        const data = await response.json()
        setMonthlyIncome(
          typeof data.monthlyIncome === 'number' ? String(data.monthlyIncome) : data.monthlyIncome ?? ''
        )
        setExpenses(
          Array.isArray(data.expenses)
            ? data.expenses.map((expense: any) => ({
                clientId: expense.id || generateClientId(),
                id: expense.id,
                category: expense.category || '',
                amount: expense.amount !== undefined ? String(expense.amount) : ''
              }))
            : []
        )
        setExpensesPage(1)
        notifySnapshotChange(data)
        setStatus(null)
      } catch (error: any) {
        setStatus({ type: 'error', text: error?.message || copy.fetchError || 'Erreur lors du chargement.' })
        setExpenses([])
      } finally {
        if (withFullLoader) {
          setLoading(false)
        }
      }
    },
    [copy.fetchError, copy.subscriptionRequired, currentMonth, notifySnapshotChange]
  )

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  const handleAddExpense = () => {
    setExpenses((prev) => {
      const updated = [
      ...prev,
      {
        clientId: generateClientId(),
        category: '',
        amount: ''
      }
      ]
      const nextPage = isSearchActive ? 1 : Math.ceil(updated.length / EXPENSES_PER_PAGE) || 1
      setExpensesPage(nextPage)
      return updated
    })
  }

  const handleExpenseChange = (clientId: string, field: 'category' | 'amount', value: string) => {
    setExpenses((prev) => prev.map((expense) => (expense.clientId === clientId ? { ...expense, [field]: value } : expense)))
  }

  const handleRemoveExpense = (clientId: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.clientId !== clientId))
  }

  const handleSave = async () => {
    setStatus(null)
    if (requiresSubscription) {
      setStatus({
        type: 'error',
        text: copy.subscriptionRequired || 'Un abonnement actif est nécessaire pour accéder au budget.'
      })
      return
    }
    if (incomeValue < 0) {
      setStatus({ type: 'error', text: copy.saveError || 'Le revenu doit être positif.' })
      return
    }

    const sanitizedExpenses = expenses
      .map((expense) => ({
        id: expense.id,
        category: expense.category.trim(),
        amount: Number(normalizeAmount(expense.amount).toFixed(2))
      }))
      .filter((expense) => expense.category && expense.amount >= 0)

    setSaving(true)
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          monthlyIncome: Number(incomeValue.toFixed(2)),
          expenses: sanitizedExpenses
        })
      })

      if (response.status === 402) {
        setRequiresSubscription(true)
        throw new Error(copy.subscriptionRequired || 'Abonnement requis pour enregistrer votre budget.')
      }

      if (!response.ok) {
        throw new Error(copy.saveError || 'Impossible de sauvegarder vos données.')
      }

      await fetchBudget(false)
      setStatus({ type: 'success', text: copy.toastSuccess || 'Budget enregistré avec succès !' })
    } catch (error: any) {
      setStatus({ type: 'error', text: error?.message || copy.saveError || 'Impossible de sauvegarder vos données.' })
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <div className={`${isEmbedded ? 'space-y-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8'}`}>
      {/* Carte d'introduction */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#012F4E]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#012F4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#012F4E] mb-1">{copy.introTitle || copy.title || 'Budget & suivi'}</h1>
            <p className="text-sm font-medium text-gray-700 mb-2">{copy.introSubtitle || 'Votre outil de gestion budgétaire mensuel'}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{copy.introDescription || 'Gérez vos finances mois par mois. Enregistrez vos revenus du mois, ajoutez vos dépenses par catégorie (alimentation, transport, loisirs...), et suivez votre budget en temps réel. Visualisez vos principales catégories de dépenses et votre taux d\'utilisation pour reprendre le contrôle de vos finances.'}</p>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const isRemainingNegative = card.isRemaining && card.remainingValue !== undefined && card.remainingValue < 0
          const isRemainingPositive = card.isRemaining && card.remainingValue !== undefined && card.remainingValue > 0
          const remainingColor = isRemainingNegative ? 'text-red-600' : isRemainingPositive ? 'text-emerald-600' : ''
          
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-[#E7EDF5] p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-2xl font-bold mt-2 ${
                card.isRemaining && remainingColor
                  ? remainingColor
                  : 'text-[#012F4E]'
              }`}>{card.value}</p>
              {card.hint && <p className="text-xs text-gray-500 mt-1">{card.hint}</p>}
            </div>
          )
        })}
      </section>

        {status && (
          <div
            role="status"
            className={`rounded-2xl border p-4 text-sm ${
              status.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {status.text}
          </div>
        )}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
            <section className="bg-white rounded-3xl shadow-sm border border-[#E7EDF5] p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full lg:w-1/2">
                <h2 className="text-xl font-semibold text-[#012F4E] mb-2">
                {copy.monthlyIncomeLabel || 'Revenu mensuel net'}
              </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {copy.subtitle || 'Visualisez vos revenus et vos dépenses pour reprendre le contrôle de votre mois.'}
                </p>
                {incomeValue === 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>{copy.incomeGuidanceTitle || 'Première étape'} :</strong> {copy.incomeGuidanceText || 'Entrez votre revenu mensuel net ci-dessus pour commencer à suivre votre budget.'}
                    </p>
                  </div>
                )}
                  <label htmlFor="monthly-income" className="text-sm font-medium text-gray-700">
                    {copy.monthlyIncomeLabel || 'Revenu mensuel net'}
                  </label>
                  <div className="mt-2 relative">
                    <input
                      id="monthly-income"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={monthlyIncome}
                      onChange={(event) => setMonthlyIncome(event.target.value)}
                      placeholder={copy.monthlyIncomePlaceholder || 'Ex : 1500'}
                      className={`w-full rounded-2xl border px-4 py-3 text-lg font-semibold text-[#012F4E] focus:outline-none focus:ring-2 ${
                        incomeValue === 0 
                          ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-400' 
                          : 'border-gray-200 focus:ring-[#00A1C6]/40'
                      }`}
                    />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span>
                  </div>
                  {incomeValue === 0 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>💡 Astuce :</strong> {copy.incomeHelpText || 'Cliquez dans le champ ci-dessus pour entrer votre revenu mensuel net (après impôts), puis cliquez sur "Enregistrer mon budget" pour valider.'}
                      </p>
                    </div>
                  )}
                  {incomeValue > 0 && totalExpenses === 0 && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800">
                        <strong>✓ Revenu enregistré :</strong> {copy.incomeCompleteText || 'N\'oubliez pas de cliquer sur "Enregistrer mon budget" pour sauvegarder. Ajoutez maintenant vos dépenses ci-dessous pour suivre votre budget.'}
                      </p>
                    </div>
                  )}
                  {incomeValue > 0 && totalExpenses > 0 && remaining > 0 && usagePercent >= 90 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <strong>⚠️ {copy.budgetWarningTitle || 'Budget proche de la limite'} :</strong> {copy.budgetWarningHelp || 'Vous avez utilisé plus de 90% de votre budget. Restez vigilant sur vos dépenses restantes.'}
                      </p>
                    </div>
                  )}
                  {incomeValue > 0 && totalExpenses > 0 && remaining > 0 && usagePercent < 90 && usagePercent >= 70 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>👍 {copy.budgetGoodTitle || 'Budget bien géré'} :</strong> {copy.budgetGoodHelp || 'Vous respectez votre budget. Continuez ainsi !'}
                      </p>
                    </div>
                  )}
                  {incomeValue > 0 && totalExpenses > 0 && remaining > 0 && usagePercent < 70 && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800">
                        <strong>🎉 {copy.budgetExcellentTitle || 'Excellent'} :</strong> {(copy.budgetExcellentHelp || 'Vous avez {amount} d\'épargne ce mois. Excellent travail !').replace('{amount}', formatMoney(remaining))}
                      </p>
                    </div>
                  )}
                  {incomeValue > 0 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full inline-flex items-center justify-center rounded-2xl bg-[#012F4E] px-6 py-3 text-white font-semibold shadow-lg hover:bg-[#023d68] disabled:opacity-60 transition-colors"
                      >
                        {saving ? (copy.saving || 'Enregistrement...') : (copy.saveIncomeButton || 'Enregistrer mes revenus')}
                      </button>
                    </div>
                  )}
                </div>
              <div className="w-full lg:w-1/2 bg-[#F5FAFF] border border-[#E0ECF5] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#00A1C6] uppercase">
                      {copy.usageLabel || "Taux d'utilisation"}
                    </p>
                    <p className="text-2xl font-bold text-[#012F4E] mt-1">{usagePercent.toFixed(0)}%</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {copy.burnRateHelper || 'Part du revenu déjà dépensée'}
                  </div>
                </div>
                <div className="mt-4 h-3 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full ${usageStatus.barColor}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  ></div>
                </div>
                <p className={`text-sm mt-3 ${usageStatus.textColor}`}>{usageStatus.message}</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-[#E7EDF5] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#012F4E]">
                    {copy.expensesTitle || 'Mes dépenses'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {copy.emptyExpenses || 'Ajoutez vos catégories de dépenses pour suivre vos sorties.'}
                  </p>
                </div>
              <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center lg:w-auto">
                <div className="relative flex-1 min-w-[220px]">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={expenseSearch}
                    onChange={(event) => setExpenseSearch(event.target.value)}
                    placeholder={copy.searchPlaceholder || 'Rechercher une dépense'}
                    aria-label={copy.searchPlaceholder || 'Rechercher une dépense'}
                    className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:from-yellow-300"
                >
                  + {copy.addExpense || 'Ajouter une dépense'}
                </button>
              </div>
              </div>

              <div className="space-y-4">
              {!hasExpenses && incomeValue > 0 && (
                  <div className="rounded-2xl border border-dashed border-yellow-200 bg-yellow-50 p-6 text-center">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      {copy.expensesGuidanceTitle || 'Ajoutez vos premières dépenses'}
                    </p>
                    <p className="text-sm text-yellow-800">
                      {copy.expensesGuidanceText || 'Cliquez sur "Ajouter une dépense" ci-dessus pour commencer à suivre vos sorties d\'argent.'}
                    </p>
                  </div>
                )}
              {!hasExpenses && incomeValue === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    {copy.emptyExpenses || 'Ajoutez votre première dépense.'}
                  </div>
                )}

              {hasExpenses && !hasFilteredExpenses && (
                <div className="rounded-2xl border border-dashed border-yellow-200 bg-yellow-50/60 p-6 text-center text-sm text-gray-700">
                  {copy.searchNoResult || 'Aucune dépense ne correspond à votre recherche.'}
                </div>
              )}

              {hasFilteredExpenses &&
                paginatedExpenses.map((expense) => (
                  <div
                    key={expense.clientId}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-4 items-end rounded-2xl border border-gray-100 p-4 shadow-sm"
                  >
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {copy.categoryLabel || 'Catégorie'}
                      </label>
                      <input
                        type="text"
                        list="budget-categories"
                        value={expense.category}
                        onChange={(event) => handleExpenseChange(expense.clientId, 'category', event.target.value)}
                        placeholder={copy.categoryPlaceholder || 'Ex : Logement'}
                        className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {copy.amountLabel || 'Montant'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={expense.amount}
                        onChange={(event) => handleExpenseChange(expense.clientId, 'amount', event.target.value)}
                        placeholder={copy.amountPlaceholder || '0,00'}
                        className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(expense.clientId)}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        {copy.removeExpense || 'Supprimer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <datalist id="budget-categories">
                {CATEGORY_SUGGESTIONS.map((category) => (
                  <option value={category} key={category} />
                ))}
              </datalist>

            {hasFilteredExpenses && (
              <div className="mt-6 flex flex-col gap-3 border-t border-dashed border-gray-200 pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                <p>{paginationInfoText}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={expensesPage === 1}
                    className="rounded-2xl px-4 py-2 border border-gray-200 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
                  >
                    {copy.paginationPrev || 'Précédent'}
                  </button>
                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={expensesPage === totalExpensePages}
                    className="rounded-2xl px-4 py-2 border border-gray-200 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
                  >
                    {copy.paginationNext || 'Suivant'}
                  </button>
                </div>
              </div>
            )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#012F4E] px-6 py-3 text-white font-semibold shadow-lg hover:bg-[#023d68] disabled:opacity-60"
                >
                  {saving ? copy.saving || 'Enregistrement...' : copy.saveButton || 'Enregistrer mon budget'}
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-3xl border border-[#E7EDF5] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.35em] text-[#00A1C6] uppercase">
                    {copy.summaryTitle || 'Résumé du mois'}
                  </p>
                  <h3 className="text-2xl font-bold text-[#012F4E] mt-1">
                    {copy.totalExpensesLabel || 'Total des dépenses'}
                  </h3>
                </div>
                <span className="text-lg font-semibold text-[#012F4E]">
                {formatMoney(Math.max(totalExpenses, 0))}
                </span>
              </div>
              <div className="mt-6 rounded-2xl bg-[#F5FAFF] border border-[#E0ECF5] p-4">
                <p className="text-sm text-[#7CA7C0]">{copy.remainingLabel || 'Solde restant'}</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    remaining >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {formatMoney(remaining)}
                </p>
              </div>
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">{usageStatus.message}</p>
            </section>

          <section className="bg-white rounded-3xl border border-[#E7EDF5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#012F4E]">
                {copy.topCategoriesTitle || 'Catégories principales'}
              </h3>
              <span className="text-sm text-gray-500">{topExpenses.length || '--'} / {sortedExpenses.length}</span>
            </div>
            <div className="space-y-4">
              {topExpenses.length === 0 && (
                <p className="text-sm text-gray-500">
                  {copy.emptyExpenses || 'Ajoutez votre première dépense.'}
                </p>
              )}
              {topExpenses.map((expense) => {
                const percent = incomeValue > 0 ? (expense.amountValue / incomeValue) * 100 : 0
                return (
                  <div key={expense.clientId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[#012F4E]">{expense.category}</p>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#012F4E]">
                          {formatMoney(expense.amountValue)}
                        </p>
                        <p className="text-xs text-gray-500">{percent.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00A1C6] to-[#7dd3fc]"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
              {otherExpensesAmount > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Autres</span>
                  <span>{formatMoney(otherExpensesAmount)}</span>
                </div>
              )}
            </div>
            </section>

          <section className="bg-white rounded-3xl border border-[#E7EDF5] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#012F4E] mb-4">
              {copy.activityTitle || 'Activité budgétaire'}
            </h3>
            <div className="space-y-5">
              {timelineEntries.map((entry, index) => (
                <div key={entry.title + index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-[#00A1C6] mt-1"></div>
                    {index < timelineEntries.length - 1 && <div className="w-px h-8 bg-[#E0ECF5]"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">{entry.title}</h4>
                      <span className="text-xs text-gray-500">{entry.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{entry.detail}</p>
                  </div>
                </div>
              ))}
          </div>
          </section>
        </div>
      </div>
    </div>
  )

  if (loading) {
    const skeleton = (
      <div className={`${isEmbedded ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6'} animate-pulse`}>
        <div className="h-10 w-48 bg-white/70 rounded-full" />
        <div className="h-64 bg-white rounded-3xl shadow-sm" />
        <div className="h-96 bg-white rounded-3xl shadow-sm" />
      </div>
    )

    return isEmbedded ? skeleton : <div className="min-h-screen bg-slate-50 py-10">{skeleton}</div>
  }

  if (requiresSubscription) {
    return isEmbedded ? subscriptionLock : <div className="min-h-screen bg-slate-50 py-10">{subscriptionLock}</div>
  }

  return isEmbedded ? content : <div className="min-h-screen bg-slate-50 py-10">{content}</div>
}
