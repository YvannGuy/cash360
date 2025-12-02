'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'
import { useCurrency } from '@/lib/CurrencyContext'

type CategoryBudget = {
  target: number
}

type Fast = {
  id: string
  title: string
  categories: string[]
  intention: string
  additionalNotes: string
  habitName: string
  habitReminder: string
  categoryBudgets?: Record<string, CategoryBudget>
  estimatedMonthlySpend: number
  startDate: string
  endDate: string
  isActive: boolean
}

type FastDay = {
  id: string
  dayIndex: number
  date: string
  respected: boolean
  reflection?: string
}

type FastResponse = {
  fast: Fast | null
  days: FastDay[]
}

type FinancialFastProps = {
  variant?: 'page' | 'embedded'
  onStatusChange?: () => void
}

const DAYS_COUNT = 30
const MS_IN_DAY = 1000 * 60 * 60 * 24

const localeMap: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-PT'
}

const fallbackCategories = [
  { value: 'food', label: 'Restauration & livraisons', description: 'Repas sur le pouce, plats préparés, Uber Eats…' },
  { value: 'shopping', label: 'Shopping & vêtements', description: 'Vêtements, accessoires, achats impulsifs en magasin.' },
  { value: 'entertainment', label: 'Divertissement & sorties', description: 'Sorties, cinéma, restaurants entre amis.' },
  { value: 'subscriptions', label: 'Abonnements utiles/oubliés', description: 'Plateformes, newsletters, applis sous utilisées.' },
  { value: 'impulse', label: 'Achats impulsifs en ligne', description: 'Amazon, ventes flash, scroll tardif.' },
  { value: 'other', label: 'Autres dépenses non essentielles', description: 'Toute autre dépense que tu veux mettre en pause.' }
]

const DAILY_TIPS: string[] = [
  'Respire 30 secondes avant tout achat impulsif.',
  'Réévalue chaque dépense : est-elle alignée avec ton intention ?',
  'Prépare un panier « attente 24h » pour calmer les envies.',
  'Transforme une sortie payante en moment gratuit (appel, marche).',
  'Vérifie tes abonnements : en utilises-tu vraiment plus de 2 ?',
  'Remplace une livraison par un repas maison simple.',
  'Note ce qui déclenche tes achats impulsifs aujourd’hui.',
  'Associe chaque euro économisé à un objectif concret.',
  'Renforce ton intention avec un verset ou une phrase motivante.',
  'Partage ton défi avec un proche pour rester responsable.',
  'Prépare une activité « gratitude » avant de faire les courses.',
  'Crée une liste de boutiques/apps à éviter cette semaine.',
  'Planifie une mini-récompense gratuite (bain chaud, nature).',
  'Revois tes paniers en attente et supprime 50% des articles.',
  'Automatise ton épargne : ce que tu ne vois pas ne tente pas.',
  'Rappelle-toi pourquoi tu as lancé ce jeûne aujourd’hui.',
  'Rédige la sensation ressentie quand tu dis « non » à une dépense.',
  'Remplace une envie d’achat par 10 pompes ou 20 squats.',
  'Observe la différence entre besoin, envie, peur.',
  'Transforme ta liste d’envies en liste d’objectifs financiers.',
  'Définis un budget plaisir mini et respecte-le comme une règle.',
  'Utilise du cash ou une carte prépayée pour limiter les clics.',
  'Analyse la notification marketing qui t’a fait hésiter.',
  'Offre-toi un moment créatif gratuit (écriture, dessin).',
  'Demande-toi : est-ce que cet achat me rapproche de ma mission ?',
  'Planifie déjà comment utiliser l’économie de ce jeûne.',
  'Fais un audit express de ton frigo/placard avant d’acheter.',
  'Choisis une phrase d’encouragement quand tu résistes avec succès.',
  'Identifie un mentor inspirant sur la discipline financière.',
  'Visualise la paix que tu ressentiras une fois le défi bouclé.'
]

const getToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export default function FinancialFast({ variant = 'page', onStatusChange }: FinancialFastProps) {
  const { t, language } = useLanguage()
  const { format: formatCurrency, symbol: currencySymbol } = useCurrency()
  const copy = t.dashboard?.fast ?? {}
  const [loading, setLoading] = useState(true)
  const [fast, setFast] = useState<Fast | null>(null)
  const [days, setDays] = useState<FastDay[]>([])
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [intention, setIntention] = useState('')
  const [habitName, setHabitName] = useState('')
  const [habitReminder, setHabitReminder] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [monthlySpend, setMonthlySpend] = useState('')
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [updatingDay, setUpdatingDay] = useState(false)
  const [closeLoading, setCloseLoading] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<'yes' | 'no' | null>(null)
  const [requiresSubscription, setRequiresSubscription] = useState(false)
  const [dailyReflection, setDailyReflection] = useState('')

  const locale = localeMap[language as keyof typeof localeMap] ?? 'fr-FR'
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long'
      }),
    [locale]
  )
  const formatMoney = useCallback((value: number) => formatCurrency(value), [formatCurrency])

  const categories =
    (Array.isArray(copy.categories) && copy.categories.length > 0 ? copy.categories : fallbackCategories) as {
      value: string
      label: string
      description?: string
    }[]
  const getCategoryLabel = useCallback(
    (value: string) => {
      const match = categories.find((item) => item.value === value)
      if (match) return match.label
      const fallbackMatch = fallbackCategories.find((item) => item.value === value)
      return fallbackMatch?.label || value
    },
    [categories]
  )

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(value)) {
        setCategoryBudgets((budgets) => {
          const draft = { ...budgets }
          delete draft[value]
          return draft
        })
        return prev.filter((item) => item !== value)
      }
      return [...prev, value]
    })
  }

  const handleCategoryBudgetChange = (category: string, value: string) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [category]: value
    }))
  }

  const fetchFast = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/financial-fast', { cache: 'no-store' })
      if (response.status === 402) {
        setRequiresSubscription(true)
        setFast(null)
        setDays([])
        return
      }
      if (!response.ok) {
        throw new Error('fetch_failed')
      }
      setRequiresSubscription(false)
      const data: FastResponse = await response.json()
      setFast(data.fast)
      setDays(data.days || [])
    } catch (err: any) {
      console.error('fetchFast error', err)
      setError(copy.errors?.general || 'Impossible de charger le jeûne.')
    } finally {
      setLoading(false)
    }
  }, [copy.errors])

  useEffect(() => {
    fetchFast()
  }, [fetchFast])

  const handleCreateFast = async () => {
    setFormError(null)
    setSubmitting(true)
    try {
      if (selectedCategories.length === 0) {
        setFormError(copy.errors?.categories || 'Sélectionne au moins une catégorie.')
        setSubmitting(false)
        return
      }

      const amount = Number(monthlySpend)
      if (!Number.isFinite(amount) || amount <= 0) {
        setFormError(copy.errors?.spend || 'Indique un montant mensuel valide.')
        setSubmitting(false)
        return
      }

      const preparedCategoryBudgets = selectedCategories.reduce<Record<string, { target: number }>>((acc, category) => {
        const amount = Number(categoryBudgets[category])
        if (Number.isFinite(amount) && amount > 0) {
          acc[category] = { target: Number(amount.toFixed(2)) }
        }
        return acc
      }, {})

      const response = await fetch('/api/financial-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          intention,
          habitName,
          habitReminder,
          additionalNotes,
          categoryBudgets: preparedCategoryBudgets,
          estimatedMonthlySpend: amount
        })
      })

      if (response.status === 402) {
        setRequiresSubscription(true)
        setFormError(copy.subscriptionLockedDescription || 'Abonnement requis pour accéder au jeûne financier.')
        setSubmitting(false)
        return
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const errorKey = payload?.error
        if (errorKey === 'fast_exists') {
          setFormError('Un jeûne est déjà en cours.')
        } else if (errorKey === 'categories_required') {
          setFormError(copy.errors?.categories || 'Sélectionne au moins une catégorie.')
        } else if (errorKey === 'amount_invalid') {
          setFormError(copy.errors?.spend || 'Indique un montant mensuel valide.')
        } else {
          setFormError(copy.errors?.general || 'Impossible de créer le jeûne.')
        }
        setSubmitting(false)
        return
      }

      const data: FastResponse = await response.json()
      setFast(data.fast)
      setDays(data.days || [])
      setSelectedCategories([])
      setIntention('')
      setHabitName('')
      setHabitReminder('')
      setAdditionalNotes('')
      setMonthlySpend('')
      setCategoryBudgets({})
      setLastAnswer(null)
      setDailyReflection('')
      onStatusChange?.()
    } catch (err) {
      console.error('create fast error', err)
      setFormError(copy.errors?.general || 'Impossible de créer le jeûne.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDayUpdate = async (answer: boolean) => {
    if (!fast) return
    const todayDayIndex = currentDayNumber ?? 1
    const day = days.find((d) => d.dayIndex === todayDayIndex)
    if (!day) return

    setUpdatingDay(true)
    setError(null)
    try {
      const response = await fetch('/api/financial-fast/day', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fastId: fast.id,
          dayIndex: day.dayIndex,
          respected: answer,
          reflection: dailyReflection
        })
      })

      if (response.status === 402) {
        setRequiresSubscription(true)
        throw new Error(copy.subscriptionLockedDescription || 'Abonnement requis.')
      }

      if (!response.ok) {
        throw new Error('update_failed')
      }

      const payload = await response.json()
      const updatedDay = payload.day as FastDay
      setDays((prev) =>
        prev.map((item) =>
          item.dayIndex === updatedDay.dayIndex ? { ...item, respected: updatedDay.respected, reflection: updatedDay.reflection } : item
        )
      )
      setLastAnswer(answer ? 'yes' : 'no')
      setDailyReflection(updatedDay.reflection || '')
      onStatusChange?.()
    } catch (err) {
      console.error('day update error', err)
      setError(copy.errors?.day || 'Impossible de mettre à jour la journée.')
    } finally {
      setUpdatingDay(false)
    }
  }

  const handleCloseFast = async () => {
    if (!fast) return
    setCloseLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/financial-fast', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', fastId: fast.id })
      })

      if (response.status === 402) {
        setRequiresSubscription(true)
        throw new Error('subscription_required')
      }

      if (!response.ok) {
        throw new Error('close_failed')
      }

      setFast(null)
      setDays([])
      setSelectedCategories([])
      setIntention('')
      setHabitName('')
      setHabitReminder('')
      setAdditionalNotes('')
      setMonthlySpend('')
      setCategoryBudgets({})
      setLastAnswer(null)
      setDailyReflection('')
      await fetchFast()
      onStatusChange?.()
    } catch (err) {
      console.error('close fast error', err)
      setError('Impossible de clore le jeûne pour le moment.')
    } finally {
      setCloseLoading(false)
    }
  }

  const respectedDays = useMemo(() => days.filter((day) => day.respected).length, [days])
  const dailyEstimate = fast ? fast.estimatedMonthlySpend / DAYS_COUNT : 0
  const estimatedSavings = dailyEstimate * respectedDays

  const currentDayNumber = useMemo(() => {
    if (!fast) return null
    const start = new Date(`${fast.startDate}T00:00:00`)
    const today = getToday()
    const diff = Math.floor((today.getTime() - start.getTime()) / MS_IN_DAY) + 1
    return Math.min(Math.max(diff, 1), DAYS_COUNT)
  }, [fast])

  const currentDay = currentDayNumber ? days.find((day) => day.dayIndex === currentDayNumber) : undefined

  useEffect(() => {
    setDailyReflection(currentDay?.reflection || '')
  }, [currentDay?.id, currentDay?.reflection])

  const today = getToday()
  const endDate = fast ? new Date(`${fast.endDate}T00:00:00`) : null
  const isFinished =
    fast && (!fast.isActive ? true : endDate ? today > endDate : false || days.every((day) => day.respected))

  const streakInfo = useMemo(() => {
    let current = 0
    let best = 0
    days
      .sort((a, b) => a.dayIndex - b.dayIndex)
      .forEach((day) => {
        if (day.respected) {
          current += 1
          best = Math.max(best, current)
        } else if (!currentDayNumber || day.dayIndex <= currentDayNumber) {
          current = 0
        }
      })

    return { currentStreak: current, bestStreak: best }
  }, [days, currentDayNumber])

  const renderTimeline = () => (
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
      {Array.from({ length: DAYS_COUNT }).map((_, index) => {
        const dayIndex = index + 1
        const day = days.find((d) => d.dayIndex === dayIndex)
        const isPast = currentDayNumber ? dayIndex < currentDayNumber : false
        const isActive = currentDayNumber === dayIndex
        const status = day?.respected ? 'done' : isPast ? 'missed' : 'pending'

        const colors =
          status === 'done'
            ? 'bg-emerald-500 text-white border-emerald-400'
            : status === 'missed'
              ? 'bg-rose-100 text-rose-600 border-rose-200'
              : 'bg-white text-gray-500 border-gray-200'

        return (
          <div
            key={dayIndex}
            className={`rounded-xl border p-2 text-center text-xs font-semibold ${colors} ${
              isActive ? 'ring-2 ring-offset-2 ring-[#00A1C6]' : ''
            }`}
          >
            {dayIndex}
          </div>
        )
      })}
    </div>
  )

  const tipIndex = currentDayNumber ? Math.max(currentDayNumber - 1, 0) : 0
  const todayTip = DAILY_TIPS[tipIndex % DAILY_TIPS.length]
  const midPointReached = (currentDayNumber ?? 0) >= 15
  const completionRate = Math.round(((currentDayNumber ?? 1) / DAYS_COUNT) * 100)

  const statsCards = [
    {
      label: copy.respectedDaysLabel || 'Jours respectés',
      value: `${respectedDays} / ${DAYS_COUNT}`
    },
    {
      label: copy.estimatedSavingsLabel || 'Économie potentielle',
      value: formatMoney(estimatedSavings)
    },
    {
      label: copy.streakLabel || 'Streak actuel',
      value: `${streakInfo.currentStreak} ${copy.bestStreakLabel ? `(${copy.bestStreakLabel}: ${streakInfo.bestStreak})` : ''}`
    }
  ]

  const recentReflections = useMemo(() => {
    return [...days]
      .filter((day) => Boolean(day.reflection && day.reflection.trim().length > 0))
      .slice(-5)
      .reverse()
  }, [days])

  const subscriptionLock = (
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
          'Souscrivez à l’abonnement Sagesse de Salomon pour débloquer le Jeûne financier – 30 jours.'}
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
  )

  const renderEmptyState = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-[#E7EDF5] p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.35em] text-[#00A1C6] uppercase mb-3">{copy.title}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#012F4E] mb-4">{copy.emptyTitle}</h1>
        <p className="text-gray-600">{copy.emptyDescription}</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-[#012F4E] mb-2">{copy.categoriesLabel}</h2>
          <p className="text-sm text-gray-500">{copy.categoriesHint}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((category) => {
              const isActive = selectedCategories.includes(category.value)
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => toggleCategory(category.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    isActive ? 'bg-[#012F4E] text-white border-[#012F4E]' : 'border-gray-200 text-gray-700 hover:border-[#012F4E]/40'
                  }`}
                >
                  <p className="text-sm font-semibold">{category.label}</p>
                  {category.description && (
                    <p className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{category.description}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {selectedCategories.length > 0 && (
          <div className="rounded-2xl border border-[#E7EDF5] bg-[#F7FBFF] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#012F4E]">
                  {copy.categoryBudgetTitle || 'Budget cible par catégorie'}
                </h3>
                <p className="text-sm text-gray-500">
                  {copy.categoryBudgetDescription || 'Indique le montant mensuel que tu souhaites mettre en pause.'}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#00A1C6]">
                {copy.planLabel || 'plan'}
              </span>
            </div>
            <div className="space-y-3">
              {selectedCategories.map((category) => {
                const details = categories.find((item) => item.value === category)
                return (
                  <div key={category} className="bg-white rounded-2xl border border-[#E7EDF5] p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#012F4E]">{details?.label || category}</p>
                        {details?.description && <p className="text-xs text-gray-500">{details.description}</p>}
                      </div>
                      <span className="text-xs font-medium text-gray-500">{copy.monthLabel || 'Mois en cours'}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={categoryBudgets[category] || ''}
                        onChange={(event) => handleCategoryBudgetChange(category, event.target.value)}
                        placeholder={copy.categoryBudgetPlaceholder || 'Ex : 120'}
                        className="w-full rounded-2xl border border-gray-200 pl-4 pr-12 py-3 text-sm font-semibold text-[#012F4E] focus:ring-2 focus:ring-[#00A1C6]/40"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">{copy.intentionLabel}</label>
            <textarea
              rows={3}
              value={intention}
              onChange={(event) => setIntention(event.target.value)}
              placeholder={copy.intentionPlaceholder}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{copy.monthlySpendLabel}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthlySpend}
              onChange={(event) => setMonthlySpend(event.target.value)}
              placeholder={copy.monthlySpendPlaceholder}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">{copy.habitNameLabel || 'Nom du défi'}</label>
            <input
              type="text"
              value={habitName}
              onChange={(event) => setHabitName(event.target.value)}
              placeholder={copy.habitNamePlaceholder || 'Ex : Discipline Uber Eats'}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
            />
            <p className="text-xs text-gray-500 mt-1">
              {copy.habitNameHelper || 'Donne un nom inspirant pour rester engagé.'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{copy.habitReminderLabel || 'Rappel quotidien'}</label>
            <input
              type="text"
              value={habitReminder}
              onChange={(event) => setHabitReminder(event.target.value)}
              placeholder={copy.habitReminderPlaceholder || 'Ex : « Pourquoi je fais ce jeûne ? »'}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">{copy.additionalNotesLabel || 'Notes et défis'}</label>
          <textarea
            rows={3}
            value={additionalNotes}
            onChange={(event) => setAdditionalNotes(event.target.value)}
            placeholder={copy.additionalNotesPlaceholder || 'Décris les déclencheurs, les situations à surveiller, etc.'}
            className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
          />
        </div>

        {formError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{formError}</div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={handleCreateFast}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#FEBE02] to-[#F99500] px-6 py-3 text-base font-semibold text-[#012F4E] shadow-lg transition focus:outline-none disabled:opacity-60"
          >
            {submitting ? 'Création en cours...' : copy.submitButton || 'Commencer mon jeûne'}
          </button>
          <p className="text-sm text-gray-500">{copy.submitHelper}</p>
        </div>
      </div>
    </div>
  )

  const renderActiveFast = () => {
    if (!fast) return null

    const start = dateFormatter.format(new Date(`${fast.startDate}T00:00:00`))
    const end = dateFormatter.format(new Date(`${fast.endDate}T00:00:00`))
    const dayLabel = copy.dayProgressLabel
      ? copy.dayProgressLabel.replace('{current}', String(currentDayNumber ?? 1))
      : `Jour ${currentDayNumber ?? 1} / ${DAYS_COUNT}`
    const categoryBudgetEntries = Object.entries(fast.categoryBudgets || {})
    const totalBudgetTarget = categoryBudgetEntries.reduce((sum, [, value]) => sum + Number(value?.target ?? 0), 0)
    const insightTitle = midPointReached
      ? copy.midPointTitle || 'Point d’étape'
      : copy.earlyPointTitle || 'Cap sur la discipline'
    const insightDescription = midPointReached
      ? (copy.midPointDescription ||
          'Tu as déjà parcouru plus de la moitié du défi. Analyse ce qui fonctionne et prépare l’atterrissage.')
      : (copy.earlyPointDescription || 'Les 10 premiers jours installent la nouvelle habitude. Continue de noter tes déclencheurs.')

    return (
      <div className="space-y-8">
        <div className="bg-white rounded-3xl border border-[#E7EDF5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.35em] text-[#00A1C6] uppercase">{copy.title}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#012F4E]">{fast.title}</h1>
            <p className="text-sm font-semibold text-[#00A1C6]">{dayLabel}</p>
            <p className="text-gray-600">{copy.intro}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-semibold text-[#012F4E] mt-2">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#E7EDF5] p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.3em] text-[#00A1C6] uppercase">
              {copy.habitCardTitle || 'Focus du jeûne'}
            </p>
            <h4 className="text-lg font-semibold text-[#012F4E] mt-2">{fast.habitName || 'Rituel disciplinaire'}</h4>
            <p className="text-sm text-gray-600 mt-2">
              {fast.habitReminder || copy.habitReminderEmpty || 'Définis un rappel quotidien pour rester connecté à ton intention.'}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E7EDF5] p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.3em] text-[#00A1C6] uppercase">
              {copy.additionalNotesLabel || 'Notes et défis'}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              {fast.additionalNotes || copy.additionalNotesEmpty || 'Identifie les déclencheurs, lieux ou moments où tes envies sont fortes.'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#012F4E] to-[#014C7D] text-white rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#F5C542]">{insightTitle}</p>
            <p className="text-3xl font-extrabold mt-3 text-[#FFE38A]">{completionRate}%</p>
            <p className="text-sm text-blue-100 mt-2">{insightDescription}</p>
            <p className="text-xs text-blue-100/80 mt-3">
              {midPointReached ? copy.midPointHelper || 'Consolide tes nouveaux réflexes.' : copy.earlyPointHelper || 'Chaque décision compte déjà.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-[#012F4E]">{copy.question}</h2>
            <div className="rounded-2xl border border-[#E7EDF5] bg-[#F7FBFF] p-4">
              <p className="text-xs font-semibold tracking-[0.3em] text-[#00A1C6] uppercase">
                {copy.dailyTipTitle || 'Tip du jour'}
              </p>
              <p className="text-sm text-[#012F4E] mt-2">{todayTip}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={updatingDay || !currentDay}
                onClick={() => handleDayUpdate(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-white font-semibold shadow hover:bg-emerald-700 disabled:opacity-60"
              >
                {copy.yes || 'Oui'}
              </button>
              <button
                type="button"
                disabled={updatingDay || !currentDay}
                onClick={() => handleDayUpdate(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-5 py-3 text-rose-600 font-semibold hover:bg-rose-50 disabled:opacity-60"
              >
                {copy.no || 'Non'}
              </button>
            </div>
            {lastAnswer && (
              <p className={`text-sm font-medium ${lastAnswer === 'yes' ? 'text-emerald-700' : 'text-rose-600'}`}>
                {lastAnswer === 'yes'
                  ? copy.encouragementPositive || 'Bravo, tu construis une nouvelle habitude.'
                  : copy.encouragementNeutral || "Ce n'est pas grave, continue demain."}
              </p>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">{copy.reflectionLabel || 'Journal du jour'}</label>
              <textarea
                rows={3}
                value={dailyReflection}
                onChange={(event) => setDailyReflection(event.target.value)}
                placeholder={copy.reflectionPlaceholder || 'Ce que tu ressens, ce qui t’a aidé ou freiné aujourd’hui...'}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1C6]/40"
              />
              <p className="text-xs text-gray-500 mt-1">
                {copy.reflectionHelper || 'Écrire quelques mots ancre la progression et les déclics.'}
              </p>
            </div>
            {renderTimeline()}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">{copy.datesLabel || 'Période du jeûne'}</p>
              <p className="text-lg font-semibold text-[#012F4E] mt-1">
                {start} → {end}
              </p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">{copy.categoriesSelectedLabel || 'Catégories engagées'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {fast.categories.map((category) => (
                  <span key={category} className="rounded-full bg-[#F5FAFF] px-3 py-1 text-xs font-semibold text-[#012F4E]">
                    {getCategoryLabel(category)}
                  </span>
                ))}
              </div>
            </div>
            {categoryBudgetEntries.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">{copy.categoryBudgetTitle || 'Budget cible par catégorie'}</p>
                  <span className="text-xs font-semibold text-[#00A1C6]">{copy.planLabel || 'plan'}</span>
                </div>
                <div className="space-y-3">
                    {categoryBudgetEntries.map(([categoryKey, payload]) => (
                      <div key={categoryKey} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{getCategoryLabel(categoryKey)}</span>
                        <span className="font-semibold text-[#012F4E]">
                          {formatMoney(Number(payload?.target ?? 0))}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="mt-4 border-t border-dashed border-gray-200 pt-3 flex items-center justify-between text-sm font-semibold text-[#012F4E]">
                  <span>{copy.categoryBudgetTotal || 'Total visé'}</span>
                  <span>{formatMoney(totalBudgetTarget)}</span>
                </div>
              </div>
            )}
            {fast.intention && (
              <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">{copy.intentionDisplayLabel || 'Intention'}</p>
                <p className="text-gray-800 mt-2">{fast.intention}</p>
              </div>
            )}
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">{copy.impactTitle || 'Impact estimé'}</p>
              <p className="text-2xl font-semibold text-[#012F4E] mt-2">{formatMoney(estimatedSavings)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {copy.savingsHint
                  ? copy.savingsHint.replace('{amount}', formatMoney(dailyEstimate))
                  : `Estimation basée sur ${formatMoney(dailyEstimate)} / jour`}
              </p>
            </div>
            {recentReflections.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">{copy.journalHistoryTitle || 'Pensées récentes'}</p>
                <div className="mt-3 space-y-3">
                  {recentReflections.map((entry) => {
                    const entryDate = dateFormatter.format(new Date(`${entry.date}T00:00:00`))
                    return (
                      <div key={entry.id} className="border border-gray-100 rounded-2xl p-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>
                            {copy.dayProgressLabel
                              ? copy.dayProgressLabel.replace('{current}', String(entry.dayIndex))
                              : `Jour ${entry.dayIndex}`}
                            {' · '}
                            {entryDate}
                          </span>
                          <span className={entry.respected ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                            {entry.respected ? '✅' : '…'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{entry.reflection}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {isFinished && (
          <div className="bg-gradient-to-r from-[#012F4E] to-[#014c7d] text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
            <h3 className="text-2xl font-bold">{copy.finishedTitle || 'Bilan de ton jeûne'}</h3>
            <p className="text-sm text-blue-100">{copy.finishedDescription}</p>
            <p className="text-lg font-semibold">{formatMoney(estimatedSavings)}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCloseFast}
                disabled={closeLoading}
                className="rounded-2xl bg-white text-[#012F4E] px-5 py-3 font-semibold shadow hover:bg-slate-50 disabled:opacity-60"
              >
                {closeLoading ? 'Fermeture...' : copy.closeButton || 'Clore le jeûne'}
              </button>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-white/40 px-5 py-3 font-semibold hover:bg-white/10 transition-colors"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  const body = loading ? (
    <div className="space-y-4">
      <div className="h-40 bg-white rounded-3xl shadow-sm border border-gray-100 animate-pulse" />
      <div className="h-32 bg-white rounded-3xl shadow-sm border border-gray-100 animate-pulse" />
      <div className="h-80 bg-white rounded-3xl shadow-sm border border-gray-100 animate-pulse" />
    </div>
  ) : requiresSubscription ? (
    subscriptionLock
  ) : fast ? (
    renderActiveFast()
  ) : (
    renderEmptyState()
  )

  const errorBanner =
    error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>

  if (variant === 'page') {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-[#012F4E]">
              ← {t.dashboard.tabs.overview || 'Tableau de bord'}
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">{copy.title}</span>
          </div>
          {errorBanner}
          {body}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {errorBanner}
      {body}
    </div>
  )
}

