'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { useCurrency } from '@/lib/CurrencyContext'
import Link from 'next/link'
import { tracking } from '@/lib/tracking'

type DebtSummary = {
  totalDebtMonthlyPayments: number
  estimatedTotalDebtAmount?: number
  availableMarginMonthly: number
  fastSavingsMonthly: number
  estimatedMonthsToFreedom: number
  estimatedMonthsToFreedomWithFast: number
}

type DebtFreeProps = {
  variant?: 'page' | 'embedded'
}

const localeMap: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-PT'
}

export default function DebtFree({ variant = 'page' }: DebtFreeProps) {
  const isEmbedded = variant === 'embedded'
  const { t, language } = useLanguage()
  const { format: formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DebtSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [requiresSubscription, setRequiresSubscription] = useState(false)

  const locale = localeMap[language as keyof typeof localeMap] ?? 'fr-FR'
  const formatMoney = useCallback((value: number) => formatCurrency(value), [formatCurrency])

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/debt-free/summary', { cache: 'no-store' })

        if (response.status === 402) {
          setRequiresSubscription(true)
          return
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Impossible de charger le résumé des dettes')
        }

        const data = await response.json()
        setSummary(data)
      } catch (err: any) {
        console.error('[DebtFree] fetch error', err)
        setError(err?.message || 'Erreur lors du chargement')
        // error variable is used in the component render
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  // Tracking: outil ouvert
  useEffect(() => {
    if (!loading && !requiresSubscription) {
      tracking.toolOpened('debt_free', '/dashboard/debt-free', {
        hasDebts: !!summary && summary.totalDebtMonthlyPayments > 0
      }).catch(() => {
        // Ignorer les erreurs de tracking silencieusement
      })
    }
  }, [loading, requiresSubscription, summary])

  const hasDebts = summary && summary.totalDebtMonthlyPayments > 0
  const hasFast = summary && summary.fastSavingsMonthly > 0
  const monthsSaved = summary
    ? summary.estimatedMonthsToFreedom - summary.estimatedMonthsToFreedomWithFast
    : 0

  const copy = t.dashboard?.debtFree ?? {}

  const subscriptionLock = (
    <div className={`${isEmbedded ? '' : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
      <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-8 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0-8v2m-6 5V6a2 2 0 012-2h6.5a2 2 0 011.6.8l3.5 4.2a2 2 0 01.4 1.2V17a2 2 0 01-2 2H8a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#012F4E] mb-2">{copy.subscriptionLockedTitle || 'Abonnement requis'}</h2>
        <p className="text-gray-600 mb-6">
          {copy.subscriptionLockedDescription || 'Souscrivez à l\'abonnement Sagesse de Salomon pour accéder au plan de remboursement de dettes.'}
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/dashboard?tab=boutique#subscription'
          }}
          className="inline-flex items-center justify-center rounded-2xl bg-[#012F4E] px-6 py-3 text-white font-semibold shadow-lg hover:bg-[#023d68]"
        >
          {copy.subscriptionLockedCta || 'Découvrir l\'abonnement'}
        </button>
      </div>
    </div>
  )

  if (requiresSubscription) {
    return subscriptionLock
  }

  if (loading) {
    return (
      <div className={`${isEmbedded ? '' : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${isEmbedded ? '' : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        <div className="bg-white rounded-3xl shadow-sm border border-red-200 p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#012F4E] hover:underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!hasDebts) {
    return (
      <div className={`${isEmbedded ? '' : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        <div className="space-y-6">
          {/* En-tête avec titre et description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#012F4E]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#012F4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[#012F4E] mb-1.5">{copy.title || 'DebtFree'}</h1>
                <p className="text-sm font-medium text-gray-700 mb-2">{copy.subtitle || 'Votre plan de remboursement de dettes intelligent'}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{copy.description || 'DebtFree analyse automatiquement vos dettes à partir de votre budget et de vos économies du jeûne financier. Visualisez votre date estimée de libération et découvrez comment accélérer votre remboursement grâce à vos efforts de discipline financière.'}</p>
              </div>
            </div>
          </div>

          {/* Message aucune dette */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#012F4E] mb-2">{copy.noDebtTitle || 'Aucune dette détectée'}</h2>
            <p className="text-gray-600 mb-6">
              {copy.noDebtDescription || 'Aucun paiement de dette n\'a été détecté dans votre budget actuel. Si vous avez des dettes, ajoutez-les dans la section Budget & Suivi avec une catégorie contenant "dette", "crédit" ou "prêt".'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard?tab=budget"
                className="inline-flex items-center justify-center rounded-2xl bg-[#012F4E] px-6 py-3 text-white font-semibold shadow-lg hover:bg-[#023d68]"
              >
                {copy.adjustBudget || 'Ajuster mon budget'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isEmbedded ? '' : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
      <div className="space-y-6">
        {/* En-tête avec titre et description */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#012F4E]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#012F4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#012F4E] mb-1.5">{copy.title || 'DebtFree'}</h1>
              <p className="text-sm font-medium text-gray-700 mb-2">{copy.subtitle || 'Votre plan de remboursement de dettes intelligent'}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{copy.description || 'DebtFree analyse automatiquement vos dettes à partir de votre budget et de vos économies du jeûne financier. Visualisez votre date estimée de libération et découvrez comment accélérer votre remboursement grâce à vos efforts de discipline financière.'}</p>
            </div>
          </div>
        </div>

        {/* Résumé des dettes */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E7EDF5] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#012F4E] mb-4">{copy.summaryTitle || 'Résumé de vos dettes'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-4">
              <p className="text-sm text-[#7CA7C0] mb-1">{copy.totalDebtPayments || 'Paiements mensuels de dettes'}</p>
              <p className="text-2xl font-bold text-[#012F4E]">
                {formatMoney(summary!.totalDebtMonthlyPayments)}
              </p>
            </div>
            <div className="bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-4">
              <p className="text-sm text-[#7CA7C0] mb-1">{copy.availableMargin || 'Marge disponible mensuelle'}</p>
              <p className="text-2xl font-bold text-[#012F4E]">
                {formatMoney(summary!.availableMarginMonthly)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {copy.availableMarginHelp || 'Argent disponible pour rembourser chaque mois'}
              </p>
            </div>
            {hasFast && (
              <div className="bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-4 sm:col-span-2">
                <p className="text-sm text-[#7CA7C0] mb-1">{copy.fastSavings || 'Économies mensuelles du jeûne'}</p>
                <p className="text-2xl font-bold text-[#012F4E]">
                  {formatMoney(summary!.fastSavingsMonthly)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Projection */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E7EDF5] p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6 text-[#012F4E]">{copy.projectionTitle || 'Projection de remboursement'}</h2>
          
          {/* Timeline visuelle */}
          {summary!.estimatedMonthsToFreedom !== 999 && (() => {
            const today = new Date()
            const targetDate = new Date(today)
            targetDate.setMonth(targetDate.getMonth() + summary!.estimatedMonthsToFreedom)
            const progressPercent = Math.min(5, 100) // Toujours au début pour un MVP simple
            
            return (
              <div className="mb-6 bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-[#7CA7C0] font-medium">{copy.timelineStart || 'Aujourd\'hui'}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(today)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#7CA7C0] font-medium">{copy.timelineEnd || 'Libre de dettes'}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(targetDate)}</p>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00A1C6] to-[#012F4E] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center" style={{ left: `${progressPercent}%` }}>
                    <div className="h-3 w-3 rounded-full bg-[#00A1C6] border-2 border-white shadow-lg -ml-1.5" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{(copy.timelineProgress || '{months} mois restants').replace('{months}', String(summary!.estimatedMonthsToFreedom))}</span>
                  <span>{copy.timelineHelper || 'Vous êtes au début de votre parcours'}</span>
                </div>
              </div>
            )
          })()}

          <div className="space-y-6">
            <div className="bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-5">
              <p className="text-sm text-[#7CA7C0] mb-3 font-medium">{copy.currentPace || 'Au rythme actuel'}</p>
              <p className="text-4xl font-bold text-[#012F4E] mb-1">
                {summary!.estimatedMonthsToFreedom === 999
                  ? (copy.moreThan20Years || 'Plus de 20 ans')
                  : `${summary!.estimatedMonthsToFreedom} ${copy.months || 'mois'}`}
              </p>
              {summary!.estimatedMonthsToFreedom !== 999 && (
                <>
                  <p className="text-sm text-gray-500 mt-1">
                    ({copy.yearsAndMonths?.replace('{years}', String(Math.floor(summary!.estimatedMonthsToFreedom / 12)))?.replace('{months}', String(summary!.estimatedMonthsToFreedom % 12)) || `${Math.floor(summary!.estimatedMonthsToFreedom / 12)} ans et ${summary!.estimatedMonthsToFreedom % 12} mois`})
                  </p>
                  {(() => {
                    const today = new Date()
                    const targetDate = new Date(today)
                    targetDate.setMonth(targetDate.getMonth() + summary!.estimatedMonthsToFreedom)
                    const dateFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
                    return (
                      <p className="text-sm text-[#012F4E] mt-2 font-medium">
                        {copy.freedomDateLabel || 'Libre de dettes en'} {dateFormatter.format(targetDate)}
                      </p>
                    )
                  })()}
                </>
              )}
            </div>
            {hasFast && monthsSaved > 0 && (
              <div className="bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-5">
                <p className="text-sm text-[#7CA7C0] mb-3 font-medium">{copy.withFastSavings || 'Avec les économies du jeûne'}</p>
                <p className="text-4xl font-bold text-[#012F4E] mb-1">
                  {summary!.estimatedMonthsToFreedomWithFast === 999
                    ? (copy.moreThan20Years || 'Plus de 20 ans')
                    : `${summary!.estimatedMonthsToFreedomWithFast} ${copy.months || 'mois'}`}
                </p>
                {summary!.estimatedMonthsToFreedomWithFast !== 999 && (
                  <>
                    <p className="text-sm text-gray-500 mt-1">
                      ({copy.yearsAndMonths?.replace('{years}', String(Math.floor(summary!.estimatedMonthsToFreedomWithFast / 12)))?.replace('{months}', String(summary!.estimatedMonthsToFreedomWithFast % 12)) || `${Math.floor(summary!.estimatedMonthsToFreedomWithFast / 12)} ans et ${summary!.estimatedMonthsToFreedomWithFast % 12} mois`})
                    </p>
                    {(() => {
                      const today = new Date()
                      const targetDate = new Date(today)
                      targetDate.setMonth(targetDate.getMonth() + summary!.estimatedMonthsToFreedomWithFast)
                      const dateFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
                      return (
                        <p className="text-sm text-[#012F4E] mt-2 font-medium">
                          {copy.freedomDateLabel || 'Libre de dettes en'} {dateFormatter.format(targetDate)}
                        </p>
                      )
                    })()}
                  </>
                )}
                <div className="mt-4 bg-white border border-[#E0ECF5] rounded-xl p-3">
                  <p className="text-sm font-semibold text-[#012F4E]">
                    ⚡ {copy.monthsSaved?.replace('{months}', String(monthsSaved)) || `Vous économisez ${monthsSaved} mois grâce au jeûne financier !`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E7EDF5] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#012F4E] mb-4">{copy.accelerateTitle || 'Accélérer votre remboursement'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard?tab=budget"
              className="flex flex-col items-center justify-center rounded-2xl bg-[#F8FBFF] border border-[#E0ECF5] px-6 py-4 hover:border-[#00A1C6] transition-colors"
            >
              <span className="text-base font-semibold text-[#012F4E]">{copy.adjustBudget || 'Modifier mon budget'}</span>
              <span className="text-xs font-normal text-[#7CA7C0] mt-1">
                {copy.adjustBudgetHelp || 'Pour augmenter votre marge disponible'}
              </span>
            </Link>
            <Link
              href="/dashboard?tab=fast"
              className="flex items-center justify-center rounded-2xl bg-[#F8FBFF] border border-[#E0ECF5] px-6 py-4 hover:border-[#00A1C6] transition-colors"
            >
              <span className="font-semibold text-[#012F4E]">
                {hasFast ? (copy.extendFast || 'Prolonger mon jeûne') : (copy.launchFast || 'Lancer un jeûne financier')}
              </span>
            </Link>
          </div>
        </div>

        {/* Note informative */}
        <div className="bg-[#F8FBFF] rounded-2xl p-4 border border-[#E0ECF5]">
          <p className="text-sm text-[#012F4E]">
            <strong>{copy.noteTitle || 'Note'} :</strong> {copy.noteText || 'Cette projection est une estimation basée sur vos données actuelles. Le montant total des dettes est estimé à partir de vos paiements mensuels. Pour une projection plus précise, ajoutez le montant total de vos dettes dans votre budget.'}
          </p>
        </div>
      </div>
    </div>
  )
}

