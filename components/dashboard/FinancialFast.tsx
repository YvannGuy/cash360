'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

type Fast = {
  id: string
  title: string
  categories: string[]
  intention: string
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
  { value: 'food', label: 'Restauration & livraisons' },
  { value: 'shopping', label: 'Shopping & vêtements' },
  { value: 'entertainment', label: 'Divertissement & sorties' },
  { value: 'impulse', label: 'Achats impulsifs en ligne' },
  { value: 'other', label: 'Autres dépenses non essentielles' }
]

const getToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export default function FinancialFast({ variant = 'page', onStatusChange }: FinancialFastProps) {
  const { t, language } = useLanguage()
  const copy = t.dashboard?.fast ?? {}
  const [loading, setLoading] = useState(true)
  const [fast, setFast] = useState<Fast | null>(null)
  const [days, setDays] = useState<FastDay[]>([])
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [intention, setIntention] = useState('')
  const [monthlySpend, setMonthlySpend] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [updatingDay, setUpdatingDay] = useState(false)
  const [closeLoading, setCloseLoading] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<'yes' | 'no' | null>(null)

  const locale = localeMap[language as keyof typeof localeMap] ?? 'fr-FR'
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR'
      }),
    [locale]
  )
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long'
      }),
    [locale]
  )

  const categories =
    (Array.isArray(copy.categories) && copy.categories.length > 0 ? copy.categories : fallbackCategories) as {
      value: string
      label: string
    }[]
  const navLinks = useMemo(
    () => [
      { id: 'overview', label: t.dashboard.tabs.overview || 'Tableau de bord', href: '/dashboard?tab=overview' },
      { id: 'budget', label: t.dashboard.tabs.budget || 'Budget & suivi', href: '/dashboard?tab=budget' },
      { id: 'financialFast', label: t.dashboard.tabs.financialFast || 'Jeûne financier', href: '/dashboard/jeune-financier', active: true },
      { id: 'boutique', label: t.dashboard.tabs.boutique, href: '/dashboard?tab=boutique' },
      { id: 'formations', label: t.dashboard.tabs.myPurchases, href: '/dashboard?tab=formations' },
      { id: 'profil', label: t.dashboard.tabs.profile || 'Profil', href: '/dashboard?tab=profil' }
    ],
    [t.dashboard.tabs]
  )

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      }
      return [...prev, value]
    })
  }

  const fetchFast = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/financial-fast', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('fetch_failed')
      }
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

      const response = await fetch('/api/financial-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          intention,
          estimatedMonthlySpend: amount
        })
      })

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
      setMonthlySpend('')
      setLastAnswer(null)
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
          respected: answer
        })
      })

      if (!response.ok) {
        throw new Error('update_failed')
      }

      const payload = await response.json()
      const updatedDay = payload.day as FastDay
      setDays((prev) =>
        prev.map((item) => (item.dayIndex === updatedDay.dayIndex ? { ...item, respected: updatedDay.respected } : item))
      )
      setLastAnswer(answer ? 'yes' : 'no')
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

      if (!response.ok) {
        throw new Error('close_failed')
      }

      setFast(null)
      setDays([])
      setSelectedCategories([])
      setIntention('')
      setMonthlySpend('')
      setLastAnswer(null)
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

  const statsCards = [
    {
      label: copy.respectedDaysLabel || 'Jours respectés',
      value: `${respectedDays} / ${DAYS_COUNT}`
    },
    {
      label: copy.estimatedSavingsLabel || 'Économie potentielle',
      value: currencyFormatter.format(estimatedSavings)
    },
    {
      label: copy.streakLabel || 'Streak actuel',
      value: `${streakInfo.currentStreak} ${copy.bestStreakLabel ? `(${copy.bestStreakLabel}: ${streakInfo.bestStreak})` : ''}`
    }
  ]

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
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => toggleCategory(category.value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                  selectedCategories.includes(category.value)
                    ? 'bg-[#012F4E] text-white border-[#012F4E]'
                    : 'border-gray-200 text-gray-700 hover:border-[#012F4E]/40'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

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

        {formError && <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{formError}</div>}

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

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-[#012F4E]">{copy.question}</h2>
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
                {fast.categories.map((category) => {
                  const label =
                    categories.find((item) => item.value === category)?.label || fallbackCategories.find((item) => item.value === category)?.label || category
                  return (
                    <span key={category} className="rounded-full bg-[#F5FAFF] px-3 py-1 text-xs font-semibold text-[#012F4E]">
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
            {fast.intention && (
              <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">{copy.intentionDisplayLabel || 'Intention'}</p>
                <p className="text-gray-800 mt-2">{fast.intention}</p>
              </div>
            )}
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500">{copy.impactTitle || 'Impact estimé'}</p>
              <p className="text-2xl font-semibold text-[#012F4E] mt-2">{currencyFormatter.format(estimatedSavings)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {copy.savingsHint
                  ? copy.savingsHint.replace('{amount}', currencyFormatter.format(dailyEstimate))
                  : `Estimation basée sur ${currencyFormatter.format(dailyEstimate)} / jour`}
              </p>
            </div>
          </div>
        </div>

        {isFinished && (
          <div className="bg-gradient-to-r from-[#012F4E] to-[#014c7d] text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
            <h3 className="text-2xl font-bold">{copy.finishedTitle || 'Bilan de ton jeûne'}</h3>
            <p className="text-sm text-blue-100">{copy.finishedDescription}</p>
            <p className="text-lg font-semibold">{currencyFormatter.format(estimatedSavings)}</p>
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
          <div className="border-b border-gray-200 pb-2">
            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {navLinks.map((link) =>
                link.active ? (
                  <span
                    key={link.id}
                    className="snap-start px-5 sm:px-6 py-3 font-medium rounded-t-lg bg-blue-600 text-white shadow-md whitespace-nowrap"
                  >
                    {link.label}
                  </span>
                ) : (
                  <Link
                    key={link.id}
                    href={link.href}
                    className="snap-start px-5 sm:px-6 py-3 font-medium rounded-t-lg bg-white text-gray-600 hover:text-gray-900 whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
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

