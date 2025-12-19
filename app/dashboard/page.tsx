'use client'

// Page Tableau de bord Cash360 (V1 statique, à connecter aux données utilisateur plus tard)
// NAV NOTE: La navigation principale (onglets Tableau de bord, Boutique, Mes achats, Profil) et les sections associées sont toutes gérées dans ce fichier. Les sous-routes comme /dashboard/settings restent indépendantes.

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase'
import { analysisService, type AnalysisRecord, capsulesService } from '@/lib/database'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'
import { useCart, type CartItem } from '@/lib/CartContext'
import { useCurrency } from '@/lib/CurrencyContext'
import { tracking } from '@/lib/tracking'
import LanguageSwitch from '@/components/LanguageSwitch'
import CurrencySelector from '@/components/CurrencySelector'
import AnalysisCard from '@/components/AnalysisCard'
import DashboardOnboarding from '@/components/DashboardOnboarding'
import PostSubscriptionOnboarding from '@/components/PostSubscriptionOnboarding'
import BudgetTracker, { type BudgetSnapshot } from '@/components/dashboard/BudgetTracker'
import FinancialFast from '@/components/dashboard/FinancialFast'
import DebtFree from '@/components/dashboard/DebtFree'
import HelpBanner from '@/components/dashboard/HelpBanner'
import ModalOMWave from '@/components/ModalOMWave'
import CarouselPopup from '@/components/CarouselPopup'
import { hasActiveSubscription } from '@/lib/subscriptionAccess'
import { EUR_TO_FCFA_RATE } from '@/config/omWave'

type DashboardTab = 'overview' | 'boutique' | 'formations' | 'profil' | 'budget' | 'fast' | 'debtfree'
type SubscriptionAction = 'cancel_period_end' | 'resume' | 'terminate_immediately'
const FAST_TOTAL_DAYS = 30
const DAY_MS = 1000 * 60 * 60 * 24

function DashboardPageContent() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cartItems, addToCart, removeFromCart, getSubtotal } = useCart()
  const { format: formatPrice, currency: currentCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userAnalyses, setUserAnalyses] = useState<AnalysisRecord[]>([])
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [fastSummary, setFastSummary] = useState<{ status: 'none' | 'active' | 'completed'; day?: number }>({
    status: 'none'
  })
  const [subscription, setSubscription] = useState<any | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [subscriptionCheckoutProduct, setSubscriptionCheckoutProduct] = useState<string | null>(null)
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState<SubscriptionAction | null>(null)
  const [subscriptionActionMessage, setSubscriptionActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [subscriptionConfirm, setSubscriptionConfirm] = useState<{ action: SubscriptionAction; dateLabel?: string } | null>(null)
  const [subscriptionMobileModalOpen, setSubscriptionMobileModalOpen] = useState(false)
  const [subscriptionMobileOrderId, setSubscriptionMobileOrderId] = useState<string | null>(null)
  const [subscriptionMobileCartItems, setSubscriptionMobileCartItems] = useState<CartItem[]>([])
  const [subscriptionMobileProductName, setSubscriptionMobileProductName] = useState('')
  const [subscriptionMobileAmountEUR, setSubscriptionMobileAmountEUR] = useState(0)
  const generateSubscriptionOrderId = useCallback(
    () => `SUB${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    []
  )
  const subscriptionMobileAmountFCFA = useMemo(
    () => Math.round(subscriptionMobileAmountEUR * EUR_TO_FCFA_RATE),
    [subscriptionMobileAmountEUR]
  )
  const handleSubscriptionMobileMoney = useCallback(
    (product: any) => {
      setSubscriptionMobileCartItems([
        {
          id: product.id,
          title: product.title,
          img: product.img,
          price: product.price,
          quantity: 1,
          category: 'abonnement'
        }
      ])
      setSubscriptionMobileProductName(product.title)
      setSubscriptionMobileAmountEUR(product.price)
      setSubscriptionMobileOrderId(generateSubscriptionOrderId())
      setSubscriptionMobileModalOpen(true)
    },
    [generateSubscriptionOrderId]
  )
  const handleCloseSubscriptionMobileModal = useCallback(() => {
    setSubscriptionMobileModalOpen(false)
    setSubscriptionMobileOrderId(null)
  }, [])
  
  // Capsules prédéfinies - utiliser les traductions
  const availableCapsules = useMemo(() => [
    {
      id: 'capsule1',
      title: t.dashboard.capsules.capsule1.title,
      img: '/images/logo/capsule1.jpg',
      blurb: t.dashboard.capsules.capsule1.blurb
    },
    {
      id: 'capsule2',
      title: t.dashboard.capsules.capsule2.title,
      img: '/images/logo/capsule2.jpg',
      blurb: t.dashboard.capsules.capsule2.blurb
    },
    {
      id: 'capsule3',
      title: t.dashboard.capsules.capsule3.title,
      img: '/images/logo/capsule3.jpg',
      blurb: t.dashboard.capsules.capsule3.blurb
    },
    {
      id: 'capsule4',
      title: t.dashboard.capsules.capsule4.title,
      img: '/images/logo/capsule4.jpg',
      blurb: t.dashboard.capsules.capsule4.blurb
    },
    {
      id: 'capsule5',
      title: t.dashboard.capsules.capsule5.title,
      img: '/images/logo/capsule5.jpg',
      blurb: t.dashboard.capsules.capsule5.blurb
    }
  ], [t])

  // Fonction helper pour obtenir le nom traduit d'un produit
  const getProductName = useCallback((product: any): string => {
    if (!product) return ''
    // Si c'est une capsule prédéfinie, utiliser les traductions depuis availableCapsules
    const predefinedCapsule = availableCapsules.find((c: any) => c.id === product.id)
    if (predefinedCapsule) return predefinedCapsule.title
    
    // Sinon, utiliser les traductions multilingues selon la langue
    switch (language) {
      case 'en':
        return product.name_en || product.name_fr || product.name || ''
      case 'es':
        return product.name_es || product.name_fr || product.name || ''
      case 'pt':
        return product.name_pt || product.name_fr || product.name || ''
      default:
        return product.name_fr || product.name || ''
    }
  }, [availableCapsules, language])

  // Fonction helper pour obtenir la description traduite d'un produit
  const getProductDescription = useCallback((product: any): string => {
    if (!product) return ''
    // Si c'est une capsule prédéfinie, utiliser les traductions depuis availableCapsules
    const predefinedCapsule = availableCapsules.find((c: any) => c.id === product.id)
    if (predefinedCapsule) return predefinedCapsule.blurb
    
    // Sinon, utiliser les traductions multilingues selon la langue
    switch (language) {
      case 'en':
        return product.description_en || product.description_fr || product.description || ''
      case 'es':
        return product.description_es || product.description_fr || product.description || ''
      case 'pt':
        return product.description_pt || product.description_fr || product.description || ''
      default:
        return product.description_fr || product.description || ''
    }
  }, [availableCapsules, language])
  
  const [boutiqueCapsules, setBoutiqueCapsules] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([]) // Tous les produits (y compris non disponibles) pour les formations
  const [userCapsules, setUserCapsules] = useState<string[]>([])
  const [userOrders, setUserOrders] = useState<any[]>([]) // Stocker les commandes pour vérifier le statut
  const [formationsData, setFormationsData] = useState<any[]>([])
  const [searchBoutique, setSearchBoutique] = useState('')
  const [searchFormations, setSearchFormations] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('capsules') // Catégorie sélectionnée dans la boutique
  const [selectedCategoryAchats, setSelectedCategoryAchats] = useState<string>('capsules') // Catégorie sélectionnée dans Mes achats
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showCartDropdown, setShowCartDropdown] = useState(false)
  const [profileFirstName, setProfileFirstName] = useState('')
  const [profileLastName, setProfileLastName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileCountry, setProfileCountry] = useState('France')
  const [profileCity, setProfileCity] = useState('')
  const [profileProfession, setProfileProfession] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  const [dailyVerse, setDailyVerse] = useState<{ reference: string; text: string; summary?: string } | null>(null)
  const [budgetSnapshot, setBudgetSnapshot] = useState<BudgetSnapshot | null>(null)
  const [previousMonthSnapshot, setPreviousMonthSnapshot] = useState<BudgetSnapshot | null>(null)
  const [debtSummary, setDebtSummary] = useState<{ totalDebtMonthlyPayments: number; availableMarginMonthly: number } | null>(null)
  const [carouselItems, setCarouselItems] = useState<any[]>([])
  const [showCarousel, setShowCarousel] = useState(false)
  const hasPremiumAccess = useMemo(() => {
    const access = hasActiveSubscription(subscription)
    console.log('[DASHBOARD] 🎯 hasPremiumAccess calculé:', {
      access,
      subscriptionStatus: subscription?.status,
      subscription: subscription ? {
        status: subscription.status,
        grace_until: subscription.grace_until,
        current_period_end: subscription.current_period_end
      } : null
    })
    return access
  }, [subscription])
  const previousHasPremiumRef = useRef(hasPremiumAccess)
  const navItems: Array<{ id: DashboardTab; label: string }> = useMemo(() => {
    const baseTabs: Array<{ id: DashboardTab; label: string }> = [
      { id: 'boutique', label: t.dashboard.tabs.boutique },
      { id: 'formations', label: t.dashboard.tabs.myPurchases },
      { id: 'profil', label: t.dashboard.tabs.profile || 'Profil' }
    ]

    if (hasPremiumAccess) {
      return [
        { id: 'overview', label: t.dashboard.tabs.overview || 'Tableau de bord' },
        { id: 'budget', label: t.dashboard.tabs.budget || 'Budget & suivi' },
        { id: 'fast', label: t.dashboard.tabs.financialFast || 'Jeûne financier' },
        { id: 'debtfree', label: t.dashboard.tabs.debtFree || 'DebtFree' },
        ...baseTabs
      ]
    }

    return baseTabs
  }, [hasPremiumAccess, t.dashboard.tabs])
  const allowedTabs = useMemo(() => navItems.map((item) => item.id), [navItems])
  const computeBudgetSnapshot = useCallback((payload: any): BudgetSnapshot => {
    const monthlyIncomeValue = Number(payload?.monthlyIncome ?? 0)
    const expensesArray = Array.isArray(payload?.expenses) ? payload.expenses : []
    const totalExpensesValue = expensesArray.reduce(
      (sum: number, expense: any) => sum + Number(expense?.amount ?? 0),
      0
    )

    return {
      month: payload?.month || '',
      monthlyIncome: monthlyIncomeValue,
      totalExpenses: totalExpensesValue,
      remaining: monthlyIncomeValue - totalExpensesValue
    }
  }, [])

  const getPreviousMonthSlug = useCallback(() => {
    const today = new Date()
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    return `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const refreshBudgetSnapshot = useCallback(async () => {
    try {
      const response = await fetch('/api/budget', { cache: 'no-store' })
      if (response.status === 402) {
        setBudgetSnapshot(null)
        setPreviousMonthSnapshot(null)
        return
      }
      if (!response.ok) return
      const data = await response.json()
      setBudgetSnapshot(computeBudgetSnapshot(data))

      // Récupérer le mois précédent
      const previousMonthSlug = getPreviousMonthSlug()
      const prevResponse = await fetch(`/api/budget?month=${previousMonthSlug}`, { cache: 'no-store' })
      if (prevResponse.ok) {
        const prevData = await prevResponse.json()
        setPreviousMonthSnapshot(computeBudgetSnapshot(prevData))
      } else {
        setPreviousMonthSnapshot(null)
      }
    } catch (error) {
      console.error('Failed to load budget snapshot', error)
    }
  }, [computeBudgetSnapshot, getPreviousMonthSlug])

const refreshFastSummary = useCallback(async () => {
  try {
    const response = await fetch('/api/financial-fast', { cache: 'no-store' })
    if (response.status === 402) {
      setFastSummary({ status: 'none' })
      return
    }
    if (!response.ok) {
      throw new Error('fetch_failed')
    }
    const data = await response.json()
    const record = data.fast
    if (!record) {
      setFastSummary({ status: 'none' })
      return
    }
    const start = new Date(`${record.startDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.floor((today.getTime() - start.getTime()) / DAY_MS) + 1
    const dayIndex = Math.min(Math.max(diff, 1), FAST_TOTAL_DAYS)
    setFastSummary({
      status: record.isActive ? 'active' : 'completed',
      day: dayIndex
    })
  } catch (error) {
    console.error('refreshFastSummary error', error)
    setFastSummary((prev) => prev ?? { status: 'none' })
  }
}, [])

  const refreshDebtSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/debt-free/summary', { cache: 'no-store' })
      if (response.status === 402) {
        setDebtSummary(null)
        return
      }
      if (!response.ok) {
        return
      }
      const data = await response.json()
      setDebtSummary(data)
    } catch (error) {
      console.error('Failed to load debt summary', error)
    }
  }, [])

  useEffect(() => {
    if (!hasPremiumAccess) {
      // Nettoyer toutes les données premium quand l'accès est perdu
      setBudgetSnapshot(null)
      setPreviousMonthSnapshot(null)
      setFastSummary({ status: 'none' })
      setDebtSummary(null)
      return
    }
    // Charger toutes les données premium quand l'accès est obtenu
    refreshBudgetSnapshot()
    refreshFastSummary()
    refreshDebtSummary()
  }, [hasPremiumAccess, refreshBudgetSnapshot, refreshFastSummary, refreshDebtSummary])

  useEffect(() => {
    if (!hasPremiumAccess) return
    if (activeTab === 'overview') {
      refreshBudgetSnapshot()
    }
  }, [activeTab, hasPremiumAccess, refreshBudgetSnapshot])

  const handleBudgetChange = useCallback((snapshot: BudgetSnapshot) => {
    setBudgetSnapshot(snapshot)
  }, [])

  const refreshSubscription = useCallback(
    async (withLoader = true) => {
      if (withLoader) {
        setSubscriptionLoading(true)
      }
      setSubscriptionError(null)
      try {
        const response = await fetch('/api/subscription', { cache: 'no-store' })
        if (!response.ok) {
          if (response.status === 401) {
            setSubscription(null)
          } else {
            const payload = await response.json().catch(() => ({}))
            throw new Error(payload?.error || 'Impossible de récupérer votre abonnement.')
          }
        } else {
          const data = await response.json()
          console.log('[DASHBOARD] 📦 Abonnement récupéré:', {
            hasSubscription: !!data.subscription,
            status: data.subscription?.status,
            hasAccess: data.hasAccess,
            subscription: data.subscription
          })
          setSubscription(data.subscription ?? null)
          
          // Log pour vérifier si hasPremiumAccess devrait être true
          const computedAccess = hasActiveSubscription(data.subscription)
          console.log('[DASHBOARD] 🔐 Accès premium calculé:', {
            computedAccess,
            hasAccessFromAPI: data.hasAccess,
            status: data.subscription?.status,
            grace_until: data.subscription?.grace_until
          })
        }
      } catch (error: any) {
        console.error('[DASHBOARD] refreshSubscription error', error)
        setSubscription(null)
        setSubscriptionError(error?.message || 'Impossible de récupérer votre abonnement.')
      } finally {
        if (withLoader) {
          setSubscriptionLoading(false)
        }
      }
    },
    []
  )

  const handleSubscriptionCheckout = useCallback(
    async (productId: string) => {
      setSubscriptionError(null)
      setSubscriptionCheckoutProduct(productId)
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('stripe_checkout_source', 'subscription')
          sessionStorage.removeItem('stripe_checkout_items')
        }

        const response = await fetch('/api/subscription/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error || 'Impossible de lancer l’abonnement.')
        }

        const data = await response.json()
        if (data?.url) {
          window.location.href = data.url
          return
        }

        throw new Error('URL de paiement introuvable.')
      } catch (error: any) {
        console.error('[DASHBOARD] handleSubscriptionCheckout error', error)
        setSubscriptionCheckoutProduct(null)
        setSubscriptionError(error?.message || 'Impossible de lancer l’abonnement.')
      }
    },
    []
  )

  const handleSubscriptionAction = useCallback(
    async (action: SubscriptionAction) => {
      setSubscriptionActionMessage(null)
      setSubscriptionActionLoading(action)
      try {
        const response = await fetch('/api/subscription/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error || t.dashboard.subscription?.manageError || 'Impossible de mettre à jour votre abonnement.')
        }

        const successMessage = action === 'terminate_immediately'
          ? (t.dashboard.subscription?.terminateImmediatelySuccess || 'Abonnement terminé immédiatement. L\'accès aux fonctionnalités premium a été retiré.')
          : (t.dashboard.subscription?.manageSuccess || 'Abonnement mis à jour.')
        
        setSubscriptionActionMessage({
          type: 'success',
          text: successMessage
        })
        await refreshSubscription(false)
      } catch (error: any) {
        setSubscriptionActionMessage({
          type: 'error',
          text: error?.message || t.dashboard.subscription?.manageError || 'Impossible de mettre à jour votre abonnement.'
        })
      } finally {
        setSubscriptionActionLoading(null)
      }
    },
    [refreshSubscription, t.dashboard.subscription]
  )

  const financialHealthStatus = useMemo(() => {
    if (!budgetSnapshot || budgetSnapshot.monthlyIncome === 0) {
      return {
        status: 'setup',
        label: t.dashboard.overview?.healthStatusSetup || 'Configuration requise',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    }

    const usagePercent = budgetSnapshot.monthlyIncome > 0 
      ? (budgetSnapshot.totalExpenses / budgetSnapshot.monthlyIncome) * 100 
      : 0

    if (budgetSnapshot.remaining < 0) {
      return {
        status: 'critical',
        label: t.dashboard.overview?.healthStatusCritical || 'Action requise',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }

    if (usagePercent >= 90) {
      return {
        status: 'warning',
        label: t.dashboard.overview?.healthStatusWarning || 'Attention',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
    }

    if (usagePercent >= 70) {
      return {
        status: 'good',
        label: t.dashboard.overview?.healthStatusGood || 'Situation bonne',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      }
    }

    return {
      status: 'excellent',
      label: t.dashboard.overview?.healthStatusExcellent || 'Situation saine',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    }
  }, [budgetSnapshot, t.dashboard.overview])

  const summaryCards = useMemo(() => {
    if (!budgetSnapshot) {
      return [
        {
          label: t.dashboard.overview?.incomeLabel || 'Revenu du mois',
          value: '—',
          isEmpty: true,
          isSavings: false,
          comparison: null
        },
        {
          label: t.dashboard.overview?.expensesLabel || 'Dépenses',
          value: '—',
          isEmpty: true,
          isSavings: false,
          comparison: null
        },
        {
          label: t.dashboard.overview?.savingsLabel || 'Épargne',
          value: '—',
          isEmpty: true,
          isSavings: true,
          savingsValue: 0,
          comparison: null
        }
      ]
    }

    const incomeValue = budgetSnapshot.monthlyIncome
    const expensesValue = budgetSnapshot.totalExpenses
    const savingsValue = budgetSnapshot.remaining

    const prevIncome = previousMonthSnapshot?.monthlyIncome ?? 0
    const prevExpenses = previousMonthSnapshot?.totalExpenses ?? 0
    const prevSavings = previousMonthSnapshot?.remaining ?? 0

    const getComparison = (current: number, previous: number, isExpense = false) => {
      if (previous === 0 && current === 0) return null
      if (previous === 0) {
        return {
          label: t.dashboard.overview?.firstMonth || 'Premier mois',
          isPositive: true
        }
      }
      const diff = current - previous
      const isPositive = isExpense ? diff < 0 : diff > 0
      return {
        label: `${isPositive ? '+' : ''}${formatPrice(diff)} ${t.dashboard.overview?.vsLastMonth || 'vs mois dernier'}`,
        isPositive
      }
    }

    return [
      {
        label: t.dashboard.overview?.incomeLabel || 'Revenu du mois',
        value: formatPrice(incomeValue),
        isEmpty: false,
        isSavings: false,
        comparison: getComparison(incomeValue, prevIncome)
      },
      {
        label: t.dashboard.overview?.expensesLabel || 'Dépenses',
        value: formatPrice(expensesValue),
        isEmpty: false,
        isSavings: false,
        comparison: getComparison(expensesValue, prevExpenses, true)
      },
      {
        label: t.dashboard.overview?.savingsLabel || 'Épargne',
        value: formatPrice(savingsValue),
        isEmpty: false,
        isSavings: true,
        savingsValue: savingsValue,
        comparison: getComparison(savingsValue, prevSavings)
      }
    ]
  }, [budgetSnapshot, previousMonthSnapshot, formatPrice, t.dashboard.overview])

  const overviewInsights = useMemo(() => {
    const items: Array<{ key: string; title: string; description: string; status: string; accent: string }> = []
    const remaining = budgetSnapshot?.remaining

    if (typeof remaining === 'number') {
      const description =
        remaining > 0
          ? t.dashboard.overview?.budgetInsightPositive || 'Vos dépenses restent sous contrôle.'
          : remaining < 0
            ? t.dashboard.overview?.budgetInsightNegative || 'Vos dépenses dépassent vos revenus.'
            : t.dashboard.overview?.budgetInsightNeutral || 'Budget équilibré, gardez une marge de sécurité.'

      items.push({
        key: 'budget',
        title: t.dashboard.overview?.budgetInsightTitle || 'Budget',
        description,
        status: formatPrice(remaining),
        accent: remaining >= 0 ? 'text-emerald-600' : 'text-red-500'
      })
    } else {
      items.push({
        key: 'budget',
        title: t.dashboard.overview?.budgetInsightTitle || 'Budget',
        description: t.dashboard.overview?.budgetInsightMissing || 'Complétez votre budget pour suivre votre mois.',
        status: '—',
        accent: 'text-gray-400'
      })
    }

    const fastTitle = t.dashboard.overview?.fastInsightTitle || 'Jeûne financier'
    if (fastSummary.status === 'active') {
      const dayValue = fastSummary.day ?? 1
      const description =
        (t.dashboard.overview?.fastInsightActive || 'Jour {day}/30 – Continue, tu avances.').replace(
          '{day}',
          String(dayValue)
        )
      items.push({
        key: 'fast',
        title: fastTitle,
        description,
        status: `${dayValue}/${FAST_TOTAL_DAYS}`,
        accent: 'text-sky-600'
      })
    } else if (fastSummary.status === 'completed') {
      items.push({
        key: 'fast',
        title: fastTitle,
        description: t.dashboard.overview?.fastInsightCompleted || 'Jeûne terminé : passe à l’action avec ton épargne.',
        status: t.dashboard.overview?.fastInsightStatusCompleted || 'Terminé',
        accent: 'text-emerald-600'
      })
    } else {
      items.push({
        key: 'fast',
        title: fastTitle,
        description: t.dashboard.overview?.fastInsightMissing || 'Active ton premier jeûne pour renforcer ta discipline.',
        status: t.dashboard.overview?.fastInsightStatusNone || '—',
        accent: 'text-gray-400'
      })
    }

    const capsulesCount = userCapsules?.length ?? 0
    if (capsulesCount > 0) {
      items.push({
        key: 'capsules',
        title: t.dashboard.overview?.capsulesInsightTitle || 'Capsules actives',
        description: t.dashboard.overview?.capsulesInsightOwned || 'Accédez à vos formations en un clic.',
        status: `${capsulesCount}`,
        accent: 'text-amber-600'
      })
    } else {
      items.push({
        key: 'capsules',
        title: t.dashboard.overview?.capsulesInsightTitle || 'Capsules actives',
        description: t.dashboard.overview?.capsulesInsightEmpty || 'Aucune capsule disponible pour l’instant.',
        status: '0',
        accent: 'text-gray-400'
      })
    }

    return items
  }, [budgetSnapshot, fastSummary, formatPrice, t, userCapsules])

  const formatDateFromISO = useCallback(
    (value?: string | null) => {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const localeMap: Record<string, string> = {
        fr: 'fr-FR',
        en: 'en-US',
        es: 'es-ES',
        pt: 'pt-PT'
      }
      const locale = localeMap[language as keyof typeof localeMap] ?? 'fr-FR'
      return date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
    },
    [language]
  )

  const computePeriodEndFromStart = useCallback((start?: string | null) => {
    if (!start) return null
    const startDate = new Date(start)
    if (Number.isNaN(startDate.getTime())) return null
    const derived = new Date(startDate)
    derived.setMonth(derived.getMonth() + 1)
    return derived.toISOString()
  }, [])

  const subscriptionEndISO = useMemo(() => {
    if (!subscription) return null
    return (
      subscription.grace_until ||
      subscription.current_period_end ||
      computePeriodEndFromStart(subscription.current_period_start) ||
      computePeriodEndFromStart(subscription.created_at) ||
      computePeriodEndFromStart(subscription.updated_at)
    )
  }, [subscription, computePeriodEndFromStart])

  const subscriptionEndLabel = useMemo(() => {
    const formatted = formatDateFromISO(subscriptionEndISO)
    return formatted || t.dashboard.subscription?.confirmFallback || 'fin de période'
  }, [subscriptionEndISO, formatDateFromISO, t.dashboard.subscription?.confirmFallback])

  const hasSubscriptionEndEstimate = Boolean(subscriptionEndISO)
  
  // Pagination
  const [currentPageBoutique, setCurrentPageBoutique] = useState(1)
  const [currentPageFormations, setCurrentPageFormations] = useState(1)
  const itemsPerPage = 6
  const formationsPerPage = 3
  
  const [supabase, setSupabase] = useState<any>(null)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    if (!tabParam) return
    if (['overview', 'boutique', 'formations', 'profil', 'budget', 'fast'].includes(tabParam)) {
      setActiveTab(tabParam as DashboardTab)
    }
  }, [searchParams])

  useEffect(() => {
    // Vérifier si on vient d'une réussite de paiement
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      setShowPaymentSuccess(true)
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/dashboard')
      // Cacher le message après 5 secondes
      setTimeout(() => setShowPaymentSuccess(false), 5000)
    }
  }, [])

  // Fonction pour extraire les initiales de l'email
  const getInitials = (email: string | undefined): string => {
    if (!email) return ''
    const localPart = email.split('@')[0] // Partie avant @
    const parts = localPart.split('.') // Séparer par les points
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return localPart.substring(0, 2).toUpperCase()
  }

  // Fonction pour obtenir le nom d'affichage de l'utilisateur
  const getUserDisplayName = (user: any): string => {
    if (!user) return ''
    
    // Utiliser le prénom et nom depuis user_metadata
    const firstName = user.user_metadata?.first_name || ''
    const lastName = user.user_metadata?.last_name || ''
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    } else if (firstName) {
      return firstName
    } else if (lastName) {
      return lastName
    }
    
    // Fallback sur l'email si pas de nom/prénom
    const email = user.email || ''
    if (!email) return 'bienvenue'
    const localPart = email.split('@')[0] // Partie avant @
    const parts = localPart.split('.') // Séparer par les points
    // Prendre le premier mot (avant le point) comme prénom
    if (parts.length >= 1 && parts[0].length > 0) {
      const firstName = parts[0]
      // Capitaliser la première lettre
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    }
    return localPart.substring(0, 1).toUpperCase() + localPart.substring(1, 2)
  }


  // Filtrage des produits de la boutique par catégorie et recherche
  // Vérifier si les catégories ebook et abonnement ont des produits
  const hasEbookProducts = useMemo(() => {
    return boutiqueCapsules.some(product => {
      const productCategory = (product as any).category || 'capsules'
      return productCategory === 'ebook'
    })
  }, [boutiqueCapsules])

  const hasAbonnementProducts = useMemo(() => {
    return boutiqueCapsules.some(product => {
      const productCategory = (product as any).category || 'capsules'
      return productCategory === 'abonnement'
    })
  }, [boutiqueCapsules])

  const filteredBoutiqueCapsules = useMemo(() => {
    let filtered = boutiqueCapsules
    
    // Filtrage par catégorie
    filtered = filtered.filter(capsule => {
      const capsuleCategory = (capsule as any).category || 'capsules'
      return capsuleCategory === selectedCategory
    })
    
    // Filtrage par recherche
    if (searchBoutique.trim()) {
      const searchLower = searchBoutique.toLowerCase().trim()
      filtered = filtered.filter(capsule => 
        capsule.title.toLowerCase().includes(searchLower) ||
        (capsule.blurb && capsule.blurb.toLowerCase().includes(searchLower))
      )
    }
    
    // Tri spécifique pour la catégorie coaching
    if (selectedCategory === 'coaching') {
      const coachingOrder = ['genèse', 'genese', 'matthieu', 'apocalypse', 'apocalyse']
      filtered = filtered.sort((a, b) => {
        const titleA = a.title.toLowerCase()
        const titleB = b.title.toLowerCase()
        
        // Trouver l'index dans l'ordre défini
        const indexA = coachingOrder.findIndex(keyword => titleA.includes(keyword))
        const indexB = coachingOrder.findIndex(keyword => titleB.includes(keyword))
        
        // Si les deux ont un index (trouvés dans l'ordre)
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }
        // Si seul A a un index, il vient en premier
        if (indexA !== -1) return -1
        // Si seul B a un index, il vient en premier
        if (indexB !== -1) return 1
        // Sinon, garder l'ordre original
        return 0
      })
    }
    
    return filtered
  }, [boutiqueCapsules, searchBoutique, selectedCategory])

  // Calculs de pagination pour Boutique
  const totalPagesBoutique = Math.ceil(filteredBoutiqueCapsules.length / itemsPerPage)
  const startIndexBoutique = (currentPageBoutique - 1) * itemsPerPage
  const endIndexBoutique = startIndexBoutique + itemsPerPage
  const currentBoutiqueCapsules = filteredBoutiqueCapsules.slice(startIndexBoutique, endIndexBoutique)

  // Calculs de pagination pour Formations
  // LOGIQUE SIMPLIFIÉE: userCapsules contient DÉJÀ uniquement les produits achetés avec appears_in_formations = true
  // Les APIs de paiement ont déjà filtré selon appears_in_formations et exclu "analyse-financiere"
  // On affiche donc directement ce qui est dans userCapsules
  const filteredFormations = useMemo(() => {
    const result: any[] = []
    
    // Fonction pour obtenir le statut d'une commande
    const getOrderStatus = (productId: string) => {
      const order = userOrders.find((o: any) => o.product_id === productId && o.status === 'pending_review')
      if (order) {
        return { status: 'pending_review', paymentMethod: order.payment_method }
      }
      return null
    }
    
    // D'abord, créer une carte pour chaque analyse financière
    // Chaque analyse a son propre ticket et statut
    let produitAnalyse = allProducts.find(p => p.id === 'analyse-financiere')
    
    if (!produitAnalyse) {
      console.warn('[FILTERED_FORMATIONS] ⚠️ Produit "analyse-financiere" non trouvé dans allProducts, utilisation des valeurs par défaut')
      // Valeurs par défaut pour le produit analyse-financiere
      produitAnalyse = {
        id: 'analyse-financiere',
        title: 'Analyse financière personnalisée',
        img: '/images/Firefly-2.jpg',
        blurb: 'Analyse complète de votre situation financière',
        category: 'analyse-financiere'
      }
    }
    
    // Vérifier si l'utilisateur a payé pour une analyse financière
    const hasAnalysisPayment = userCapsules?.includes('analyse-financiere') || 
                               userOrders.some((o: any) => o.product_id === 'analyse-financiere')
    
    // TOUJOURS afficher les analyses existantes, même si hasAnalysisPayment est false
    // (car une analyse peut exister sans être dans userCapsules ou userOrders)
    if (userAnalyses.length > 0) {
      // Créer une carte pour chaque analyse existante
      for (const analysis of userAnalyses) {
        // Si l'analyse existe déjà, c'est qu'elle a été validée (pas de commande en attente)
        // orderStatus reste null pour toutes les analyses existantes
        // (l'état "en attente" est géré par AnalysisCard en fonction de la présence de fichiers)
        const card = {
          id: `analyse-${analysis.id}`, // ID unique pour chaque analyse
          analysisId: analysis.id, // Garder une référence à l'ID de l'analyse
          ticket: analysis.ticket,
          title: produitAnalyse?.title || 'Analyse financière',
          img: produitAnalyse?.img || '/images/pack.png',
          blurb: produitAnalyse?.blurb || 'Analyse complète de votre situation financière',
          category: 'analyse-financiere',
          pdfUrl: null,
          orderStatus: null, // Analyse existante = déjà validée, pas d'attente
          analysis: analysis // Passer l'analyse complète pour AnalysisCard
        }
        result.push(card)
      }
    }
    
    // Ensuite, créer des cartes pour les paiements qui n'ont pas encore d'analyse
    if (hasAnalysisPayment) {
      
      // Créer une carte pour chaque commande Mobile Money en attente qui n'a pas encore d'analyse
      // (c'est-à-dire les commandes pending_review qui n'ont pas encore été validées par l'admin)
      const pendingMobileMoneyOrders = userOrders.filter((o: any) => 
        o.product_id === 'analyse-financiere' && 
        o.status === 'pending_review' &&
        o.payment_method === 'mobile_money'
      )
      
      // AUSSI vérifier les commandes Mobile Money validées (paid) qui n'ont pas encore d'analyse
      // (au cas où l'analyse n'a pas encore été créée ou récupérée)
      const paidMobileMoneyOrders = userOrders.filter((o: any) => 
        o.product_id === 'analyse-financiere' && 
        o.status === 'paid' &&
        o.payment_method === 'mobile_money'
      )
      
      // Compter combien d'analyses Mobile Money existent déjà
      const mobileMoneyAnalysesCount = userAnalyses.filter((a: any) => 
        a.mode_paiement === 'Mobile Money' || a.mode_paiement === 'mobile_money'
      ).length
      
      // Pour les commandes en attente (pending_review)
      if (pendingMobileMoneyOrders.length > 0) {
        // Créer une carte pour chaque commande en attente qui n'a pas encore d'analyse
        const pendingCount = pendingMobileMoneyOrders.length - mobileMoneyAnalysesCount
        
        if (pendingCount > 0) {
          for (let i = 0; i < pendingCount; i++) {
            const pendingOrder = pendingMobileMoneyOrders[i]
            result.push({
              id: `analyse-pending-${pendingOrder.id}`, // ID unique basé sur l'ID de la commande
              analysisId: null, // Pas encore d'analyse créée
              ticket: null,
              title: produitAnalyse?.title || 'Analyse financière',
              img: produitAnalyse?.img || '/images/pack.png',
              blurb: produitAnalyse?.blurb || 'Analyse complète de votre situation financière',
              category: 'analyse-financiere',
              pdfUrl: null,
              orderStatus: { 
                status: 'pending_review', 
                paymentMethod: 'mobile_money' 
              },
              analysis: null // Pas encore d'analyse créée
            })
          }
        }
      }
      
      // Pour les commandes validées (paid) qui n'ont pas encore d'analyse correspondante
      // (l'analyse devrait être créée mais peut-être pas encore récupérée, ou en cours de création)
      if (paidMobileMoneyOrders.length > mobileMoneyAnalysesCount) {
        const paidCount = paidMobileMoneyOrders.length - mobileMoneyAnalysesCount
        
        for (let i = 0; i < paidCount; i++) {
          const paidOrder = paidMobileMoneyOrders[i]
          result.push({
            id: `analyse-paid-${paidOrder.id}`, // ID unique basé sur l'ID de la commande
            analysisId: null, // Analyse en cours de création ou pas encore récupérée
            ticket: null,
            title: produitAnalyse?.title || 'Analyse financière',
            img: produitAnalyse?.img || '/images/pack.png',
            blurb: produitAnalyse?.blurb || 'Analyse complète de votre situation financière',
            category: 'analyse-financiere',
            pdfUrl: null,
            orderStatus: null, // Commande validée, pas d'attente de validation
            analysis: null // Analyse en cours de création ou pas encore récupérée
          })
        }
      }
      
      // Si paiement Stripe existe mais pas encore d'analyse créée (webhook en retard)
      // Créer une carte temporaire pour permettre l'upload
      const hasStripePayment = userOrders.some((o: any) => 
        o.product_id === 'analyse-financiere' && 
        (o.payment_method === 'stripe' || o.payment_method === 'Stripe')
      ) || userCapsules?.includes('analyse-financiere')
      
      if (hasStripePayment && userAnalyses.length === 0) {
        // Pas encore d'analyse créée pour Stripe
        result.push({
          id: 'analyse-financiere-stripe-pending',
          analysisId: null,
          ticket: null,
          title: produitAnalyse?.title || 'Analyse financière',
          img: produitAnalyse?.img || '/images/pack.png',
          blurb: produitAnalyse?.blurb || 'Analyse complète de votre situation financière',
          category: 'analyse-financiere',
          pdfUrl: null,
          orderStatus: null, // Stripe est déjà payé, pas d'attente
          analysis: null // Pas encore d'analyse créée
        })
      }
    }
    
    // Traiter l'abonnement s'il existe (une seule fois, éviter les doublons)
    // Vérifier dans orders (Mobile Money) OU dans user_subscriptions (Stripe + Mobile Money validé)
    const hasSubscriptionOrder = userOrders.some((o: any) => {
      const isAbonnement = o.product_id === 'abonnement' || 
                          o.product_id?.toLowerCase() === 'abonnement' ||
                          o.product_name?.toLowerCase()?.includes('abonnement') ||
                          o.product_name?.toLowerCase()?.includes('sagesse')
      return isAbonnement && (o.status === 'paid' || o.status === 'pending_review')
    })
    
    // Vérifier aussi si un abonnement existe dans user_subscriptions (pour Stripe)
    const hasActiveSubscription = subscription && (
      subscription.hasSubscription || 
      subscription.status === 'active' || 
      subscription.status === 'trialing' ||
      subscription.status === 'past_due'
    )
    
    // Vérifier si l'abonnement n'a pas déjà été ajouté dans result
    // Vérifier à la fois par ID et par titre normalisé pour éviter les doublons
    const subscriptionAlreadyAdded = result.some((item: any) => {
      const itemId = item.id?.toLowerCase().trim() || ''
      const itemTitle = item.title?.toLowerCase().trim() || ''
      return itemId === 'abonnement' || 
             itemId.includes('abonnement') ||
             itemTitle.includes('abonnement') ||
             itemTitle.includes('sagesse')
    })
    
    // Ajouter l'abonnement seulement s'il existe ET qu'il n'a pas déjà été ajouté
    if ((hasSubscriptionOrder || hasActiveSubscription) && !subscriptionAlreadyAdded) {
      const subscriptionOrder = userOrders.find((o: any) => {
        const isAbonnement = o.product_id === 'abonnement' || 
                            o.product_id?.toLowerCase() === 'abonnement' ||
                            o.product_name?.toLowerCase()?.includes('abonnement') ||
                            o.product_name?.toLowerCase()?.includes('sagesse')
        return isAbonnement && (o.status === 'paid' || o.status === 'pending_review')
      })
      
      const subscriptionOrderStatus = subscriptionOrder?.status === 'pending_review' 
        ? { status: 'pending_review', paymentMethod: subscriptionOrder.payment_method }
        : null
      
      // Chercher le produit abonnement dans allProducts
      let subscriptionProduct = allProducts.find(p => p.id === 'abonnement')
      
      if (!subscriptionProduct) {
        // Valeur par défaut si le produit n'existe pas dans la base
        subscriptionProduct = {
          id: 'abonnement',
          title: 'Abonnement Sagesse de Salomon',
          img: '/images/kingsalomon.png',
          blurb: 'Accès premium aux fonctionnalités avancées',
          category: 'abonnement'
        }
      }
      
      result.push({
        id: subscriptionProduct.id,
        title: subscriptionProduct.title,
        img: subscriptionProduct.img,
        blurb: subscriptionProduct.blurb || '',
        category: subscriptionProduct.category || 'abonnement',
        orderStatus: subscriptionOrderStatus,
        subscriptionInfo: hasActiveSubscription ? {
          status: subscription.status,
          endDate: subscription.subscription?.current_period_end
        } : null
      })
    }
    
    // Ensuite, traiter les autres produits (en excluant analyse-financiere et abonnement de userCapsules)
    const otherCapsules = (userCapsules || []).filter((id: string) => {
      // Exclure analyse-financiere et abonnement (avec toutes les variations possibles)
      const normalizedId = id?.toLowerCase().trim() || ''
      return normalizedId !== 'analyse-financiere' && 
             normalizedId !== 'abonnement' &&
             !normalizedId.includes('abonnement') &&
             !normalizedId.includes('sagesse')
    })
    
    if (otherCapsules.length > 0) {
      for (const capsuleId of otherCapsules) {
        // Double vérification pour éviter d'ajouter l'abonnement
        const normalizedId = capsuleId?.toLowerCase().trim() || ''
        if (normalizedId === 'abonnement' || normalizedId.includes('abonnement') || normalizedId.includes('sagesse')) {
          continue
        }
        
        const orderStatus = getOrderStatus(capsuleId)
      
      // 1. Chercher d'abord dans les capsules prédéfinies (capsule1-5)
      const capsulePredefinie = availableCapsules.find(c => c.id === capsuleId)
      if (capsulePredefinie) {
        result.push({
          ...capsulePredefinie,
          category: 'capsules', // Les capsules prédéfinies vont dans "Capsules"
          orderStatus: orderStatus
        })
        continue
      }
      
       // 2. Chercher dans tous les produits (y compris non disponibles) pour les nouveaux produits
       const produit = allProducts.find(p => p.id === capsuleId)
       if (produit) {
         // Vérifier que ce n'est pas l'abonnement avant d'ajouter
         const produitNormalizedId = produit.id?.toLowerCase().trim() || ''
         const produitNormalizedTitle = produit.title?.toLowerCase().trim() || ''
         if (produitNormalizedId === 'abonnement' || 
             produitNormalizedId.includes('abonnement') || 
             produitNormalizedTitle.includes('abonnement') ||
             produitNormalizedTitle.includes('sagesse')) {
           continue
         }
         
         result.push({
           id: produit.id,
           title: produit.title,
           img: produit.img,
           blurb: produit.blurb || '',
           category: produit.category || 'capsules', // Récupérer la catégorie du produit depuis la boutique
           pdfUrl: (produit as any).pdf_url || null, // URL du PDF pour ebook
           orderStatus: orderStatus
         })
         continue
       }
      
       // 3. Si pas trouvé dans les produits, chercher dans les formations pour récupérer les infos
       const formation = formationsData.find(f => f.capsule_id === capsuleId)
       if (formation) {
         // Vérifier que ce n'est pas l'abonnement avant d'ajouter
         const formationNormalizedTitle = formation.title?.toLowerCase().trim() || ''
         if (formationNormalizedTitle.includes('abonnement') || formationNormalizedTitle.includes('sagesse')) {
           continue
         }
         
         // Chercher à nouveau le produit pour récupérer sa catégorie et PDF
         const produitFromAll = allProducts.find(p => p.id === capsuleId)
         result.push({
           id: capsuleId,
           title: formation.title || capsuleId,
           img: '/images/pack.png',
           blurb: formation.description || '',
           category: produitFromAll?.category || 'capsules', // Récupérer la catégorie du produit depuis la boutique
           pdfUrl: (produitFromAll as any)?.pdf_url || null, // URL du PDF pour ebook
           orderStatus: orderStatus
         })
         continue
       }
      
      // 4. Dernière option: créer un objet minimal (ne devrait pas arriver si tout fonctionne)
      console.warn(`⚠️ Produit acheté ${capsuleId} non trouvé dans produits ni formations`)
      result.push({
        id: capsuleId,
        title: capsuleId,
        img: '/images/pack.png',
        blurb: '',
        category: 'capsules', // Par défaut
        orderStatus: orderStatus
      })
      }
    }
    
    // Déduplication finale pour éviter les doublons (notamment pour l'abonnement)
    // Utiliser à la fois l'ID et le titre normalisé pour détecter les doublons
    const seenIds = new Set<string>()
    const seenTitles = new Set<string>()
    const deduplicatedResult = result.filter((item: any) => {
      // Normaliser le titre pour la comparaison (enlever les accents, mettre en minuscules)
      const normalizedTitle = item.title?.toLowerCase().trim() || ''
      
      // Vérifier si l'ID existe déjà
      if (seenIds.has(item.id)) {
        return false
      }
      
      // Pour l'abonnement spécifiquement, vérifier aussi le titre normalisé
      // car il peut y avoir des variations (majuscules/minuscules, accents)
      if (item.id === 'abonnement' || normalizedTitle.includes('abonnement') || normalizedTitle.includes('sagesse')) {
        // Créer une clé de titre normalisée pour l'abonnement
        const subscriptionKey = normalizedTitle.replace(/[^a-z0-9]/g, '')
        if (subscriptionKey && seenTitles.has(subscriptionKey)) {
          return false
        }
        if (subscriptionKey) {
          seenTitles.add(subscriptionKey)
        }
      }
      
      seenIds.add(item.id)
      return true
    })
    
    return deduplicatedResult
  }, [userCapsules, allProducts, availableCapsules, formationsData, userOrders, userAnalyses, subscription])

  // Filtrage des achats par catégorie et recherche
  // Les produits gardent leur catégorie de la boutique
  const filteredFormationsByCategory = useMemo(() => {
    return filteredFormations.filter(item => {
      const itemCategory = (item as any).category || 'capsules'
      return itemCategory === selectedCategoryAchats
    })
  }, [filteredFormations, selectedCategoryAchats])

  const filteredFormationsBySearch = useMemo(() => {
    let filtered = filteredFormationsByCategory
    
    if (searchFormations.trim()) {
      const searchLower = searchFormations.toLowerCase().trim()
      filtered = filtered.filter(formation => 
        formation.title.toLowerCase().includes(searchLower) ||
        (formation.blurb && formation.blurb.toLowerCase().includes(searchLower))
      )
    }
    
    return filtered
  }, [filteredFormationsByCategory, searchFormations])
  
  const totalPagesFormations = Math.ceil(filteredFormationsBySearch.length / formationsPerPage)
  const startIndexFormations = (currentPageFormations - 1) * formationsPerPage
  const endIndexFormations = startIndexFormations + formationsPerPage
  const currentFormations = filteredFormationsBySearch.slice(startIndexFormations, endIndexFormations)

  useEffect(() => {
    setMounted(true)
    // Initialiser Supabase côté client uniquement
    setSupabase(createClientBrowser())
  }, [])

  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

  useEffect(() => {
    if (searchParams?.get('subscription') === 'success') {
      // Rafraîchir immédiatement
      refreshSubscription(false)
      
      // Essayer de synchroniser directement avec Stripe (au cas où le webhook n'a pas encore été traité)
      const syncWithStripe = async () => {
        try {
          const response = await fetch('/api/subscription/sync', {
            method: 'POST',
            cache: 'no-store'
          })
          if (response.ok) {
            const data = await response.json()
            console.log('[DASHBOARD] 🔍 Réponse synchronisation Stripe:', {
              success: data.success,
              subscription: data.subscription,
              message: data.message
            })
            if (data.success) {
              console.log('[DASHBOARD] ✅ Synchronisation Stripe réussie, rafraîchissement abonnement')
              refreshSubscription(false)
            } else {
              console.log('[DASHBOARD] ⚠️ Synchronisation Stripe: aucun abonnement trouvé')
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error('[DASHBOARD] ❌ Erreur synchronisation Stripe:', {
              status: response.status,
              error: errorData
            })
          }
        } catch (error) {
          console.error('[DASHBOARD] Erreur synchronisation Stripe:', error)
        }
      }
      
      // Synchroniser immédiatement puis après délais
      syncWithStripe()
      
      // Puis faire plusieurs tentatives avec délai pour s'assurer que le webhook a été traité
      // Augmenter les délais pour mieux couvrir le timing du webhook Stripe
      const attempts = [3000, 6000, 12000, 20000] // 3s, 6s, 12s, 20s
      attempts.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`[DASHBOARD] Tentative ${index + 1}/${attempts.length} de rafraîchissement abonnement après paiement (${delay/1000}s)`)
          syncWithStripe()
          refreshSubscription(false)
        }, delay)
      })
    }
  }, [refreshSubscription, searchParams])

  useEffect(() => {
    if (!subscriptionLoading && hasPremiumAccess && !previousHasPremiumRef.current) {
      setActiveTab('overview')
    }
    previousHasPremiumRef.current = hasPremiumAccess
  }, [hasPremiumAccess, subscriptionLoading])

  // Charger le carrousel pour les utilisateurs avec abonnement
  const loadCarouselItems = useCallback(async () => {
    if (!hasPremiumAccess) return

    try {
      const response = await fetch('/api/carousel')
      const data = await response.json()
      
      if (data.success && data.items && data.items.length > 0) {
        setCarouselItems(data.items)
        // Afficher le carrousel si :
        // 1. Il y a des items à afficher (l'API filtre déjà les items achetés)
        // 2. L'utilisateur ne l'a pas fermé dans cette session
        // 3. Le carrousel réapparaît à chaque nouvelle connexion (sessionStorage se vide à chaque nouvelle session)
        // 4. Si tous les items sont achetés, data.items.length sera 0 et le carrousel ne s'affichera pas
        const carouselClosed = sessionStorage.getItem('user_carousel_closed')
        if (!carouselClosed && data.items.length > 0) {
          // Afficher le carrousel (le délai est géré dans le useEffect parent)
          setShowCarousel(true)
        } else if (data.items.length === 0) {
          // Si aucun item à afficher (tous achetés), ne pas afficher le carrousel
          setShowCarousel(false)
        }
      } else {
        // Si aucun item ou erreur, ne pas afficher
        setCarouselItems([])
        setShowCarousel(false)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du carrousel:', error)
    }
  }, [hasPremiumAccess])

  useEffect(() => {
    // Charger le carrousel après que l'abonnement soit vérifié
    // et après un court délai pour laisser les onboarding s'afficher
    if (hasPremiumAccess && !subscriptionLoading) {
      // Délai pour laisser les onboarding s'afficher d'abord (surtout pour les nouveaux utilisateurs)
      const timer = setTimeout(() => {
        loadCarouselItems()
      }, 1500) // 1.5 secondes pour laisser les onboarding s'afficher
      
      return () => clearTimeout(timer)
    }
  }, [hasPremiumAccess, subscriptionLoading, loadCarouselItems])

  const handleCarouselClose = useCallback(() => {
    setShowCarousel(false)
    // Mémoriser la fermeture pour cette session uniquement
    sessionStorage.setItem('user_carousel_closed', 'true')
  }, [])

  useEffect(() => {
    if (subscriptionLoading) return
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] as DashboardTab)
    }
  }, [activeTab, allowedTabs, subscriptionLoading])

  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    if (!tabParam) return
    if (allowedTabs.includes(tabParam as DashboardTab)) {
      setActiveTab(tabParam as DashboardTab)
    } else if (!hasPremiumAccess) {
      setActiveTab('boutique')
    }
  }, [allowedTabs, hasPremiumAccess, searchParams])

  // Gérer le paramètre category pour sélectionner automatiquement la catégorie dans la boutique
  useEffect(() => {
    const categoryParam = searchParams?.get('category')
    if (categoryParam && activeTab === 'boutique') {
      const validCategories = ['capsules', 'ebook', 'abonnement', 'masterclass', 'coaching']
      if (validCategories.includes(categoryParam)) {
        setSelectedCategory(categoryParam)
      }
    }
  }, [searchParams, activeTab])

  useEffect(() => {
    const controller = new AbortController()
    const fetchVerse = async () => {
      try {
        const res = await fetch('/api/verses', { signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        setDailyVerse(data)
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          // TODO: gérer éventuellement le logging
        }
      }
    }
    fetchVerse()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!user) return
    const metadata = user.user_metadata || {}
    setProfileFirstName(metadata.first_name || '')
    setProfileLastName(metadata.last_name || '')
    setProfilePhone(metadata.phone || '')
    setProfileCountry(metadata.country || 'France')
    setProfileCity(metadata.city || '')
    setProfileProfession(metadata.profession || '')
  }, [user])
  
  // Recharger périodiquement les analyses et commandes pour détecter les nouveaux achats et validations
  useEffect(() => {
    if (!supabase || !user) return
    
    // Recharger les analyses et commandes toutes les 10 secondes (plus fréquent pour détecter plus vite)
    const interval = setInterval(async () => {
      try {
        // Recharger les analyses
        const analyses = await analysisService.getAnalysesByUser()
        
        setUserAnalyses(prevAnalyses => {
          // Ne mettre à jour que si le nombre a changé ou si les IDs sont différents
          const prevIds = new Set(prevAnalyses.map((a: any) => a.id))
          const hasNewAnalyses = analyses.some((a: any) => !prevIds.has(a.id))
          
          // Vérifier aussi si le mode_paiement a changé (nouvelle analyse Mobile Money)
          const prevMobileMoneyCount = prevAnalyses.filter((a: any) => 
            a.mode_paiement === 'Mobile Money' || a.mode_paiement === 'mobile_money'
          ).length
          const newMobileMoneyCount = analyses.filter((a: any) => 
            a.mode_paiement === 'Mobile Money' || a.mode_paiement === 'mobile_money'
          ).length
          
          if (hasNewAnalyses || analyses.length !== prevAnalyses.length || prevMobileMoneyCount !== newMobileMoneyCount) {
            return analyses
          }
          return prevAnalyses
        })
        
        // Recharger aussi les commandes pour détecter les changements de statut (pending_review → paid)
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, product_id, product_name, status, payment_method, created_at, validated_at')
          .eq('user_id', user.id)
          .in('status', ['pending_review', 'paid'])
        
        if (!ordersError && ordersData) {
          setUserOrders(prevOrders => {
            // Vérifier si le nombre ou les statuts ont changé
            const prevPendingCount = prevOrders.filter((o: any) => o.status === 'pending_review' && o.product_id === 'analyse-financiere').length
            const newPendingCount = ordersData.filter((o: any) => o.status === 'pending_review' && o.product_id === 'analyse-financiere').length
            
            if (prevPendingCount !== newPendingCount || ordersData.length !== prevOrders.length) {
              return ordersData
            }
            return prevOrders
          })

          // Détecter les commandes d'abonnement payées (plus robuste)
          const paidSubscriptionOrders = ordersData.filter((o: any) => {
            const isAbonnement = o.product_id === 'abonnement' || 
                                o.product_id?.toLowerCase() === 'abonnement' ||
                                o.product_name?.toLowerCase()?.includes('abonnement') ||
                                o.product_name?.toLowerCase()?.includes('sagesse')
            return isAbonnement && o.status === 'paid'
          })
          
          const hasPaidSubscriptionOrder = paidSubscriptionOrders.length > 0
          
          // Vérifier aussi si une commande d'abonnement vient d'être validée récemment
          const recentlyValidatedSubscription = paidSubscriptionOrders.some((o: any) => {
            // Vérifier si validated_at est récent (moins de 2 minutes)
            if (!o.validated_at) return false
            const validatedDate = new Date(o.validated_at)
            const now = new Date()
            const diffMinutes = (now.getTime() - validatedDate.getTime()) / (1000 * 60)
            return diffMinutes < 2
          })
          
          // Vérifier si le nombre de commandes d'abonnement payées a changé (détection suppression)
          const prevPaidSubscriptionCount = userOrders.filter((o: any) => {
            const isAbonnement = o.product_id === 'abonnement' || 
                                o.product_id?.toLowerCase() === 'abonnement' ||
                                o.product_name?.toLowerCase()?.includes('abonnement') ||
                                o.product_name?.toLowerCase()?.includes('sagesse')
            return isAbonnement && o.status === 'paid'
          }).length
          
          const subscriptionCountChanged = prevPaidSubscriptionCount !== paidSubscriptionOrders.length
          
          // IMPORTANT: Ne rafraîchir que si l'abonnement n'est pas déjà canceled
          // Cela évite de réactiver un abonnement qui vient d'être terminé par l'admin
          const currentSubscriptionStatus = subscription?.status
          const isSubscriptionCanceled = currentSubscriptionStatus === 'canceled'
          
          // Rafraîchir l'abonnement si :
          // 1. Il y a des commandes payées ET une validation récente
          // 2. Le nombre de commandes payées a changé (ajout ou suppression)
          // MAIS SEULEMENT si l'abonnement n'est pas déjà canceled
          if (!isSubscriptionCanceled && (hasPaidSubscriptionOrder && recentlyValidatedSubscription || subscriptionCountChanged)) {
            console.log('[DASHBOARD] 🔄 Détection changement abonnement (payée:', hasPaidSubscriptionOrder, ', récente:', recentlyValidatedSubscription, ', changement:', subscriptionCountChanged, '), rafraîchissement...')
            refreshSubscription(false)
          } else if (isSubscriptionCanceled) {
            console.log('[DASHBOARD] ⏸️ Abonnement canceled détecté, pas de rafraîchissement automatique')
          }
        }
      } catch (error) {
        console.error('Erreur rechargement périodique analyses/commandes:', error)
      }
    }, 10000) // Toutes les 10 secondes (au lieu de 30)
    
    return () => clearInterval(interval)
  }, [supabase, user, refreshSubscription, subscription, userOrders])

  // Réinitialiser les pages et la recherche lors du changement d'onglet
  useEffect(() => {
    setCurrentPageBoutique(1)
    setCurrentPageFormations(1)
    setSearchBoutique('')
    setSearchFormations('')
  }, [activeTab])

  // Réinitialiser la page boutique quand la catégorie change
  useEffect(() => {
    setCurrentPageBoutique(1)
  }, [selectedCategory])

  // Réinitialiser la page achats quand la catégorie change
  useEffect(() => {
    setCurrentPageFormations(1)
  }, [selectedCategoryAchats])

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPageBoutique(1)
  }, [searchBoutique])

  useEffect(() => {
    setCurrentPageFormations(1)
  }, [searchFormations])

  useEffect(() => {
    if (!supabase) return
    
    let cancelled = false
    
    const init = async () => {
      try {
        const [userResult, userAnalyses] = await Promise.all([
          supabase.auth.getUser(),
          analysisService.getAnalysesByUser().catch(() => [])
        ])

        const user = userResult?.data?.user
        if (!user) {
          router.push('/')
          return
        }
        setUser(user)
        if (Array.isArray(userAnalyses)) {
          setUserAnalyses(userAnalyses as AnalysisRecord[])
        }
        
        // Envoyer l'email de bienvenue lors de la première connexion au dashboard
        // Vérifier si l'email a déjà été envoyé (via localStorage pour éviter les appels multiples)
        const welcomeEmailSent = localStorage.getItem(`welcome_email_sent_${user.id}`)
        if (!welcomeEmailSent && user.id) {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
              const response = await fetch('/api/welcome-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                }
              })
              
              if (response.ok) {
                // Marquer comme envoyé dans localStorage pour éviter les appels multiples
                localStorage.setItem(`welcome_email_sent_${user.id}`, 'true')
              } else {
                const errorData = await response.json()
                console.error('[DASHBOARD] ❌ Erreur envoi email de bienvenue:', errorData)
              }
            }
          } catch (emailError) {
            console.error('[DASHBOARD] ❌ Erreur envoi email de bienvenue:', emailError)
            // Ne pas bloquer le chargement si l'email échoue
          }
        }
        // Charger TOUS les produits (y compris non disponibles) pour les formations
        const { data: allProductsData } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: true })
        
        if (allProductsData && allProductsData.length > 0) {
          // Pour la boutique: afficher seulement les produits disponibles
          const adaptedProducts = allProductsData
            .filter((p: any) => p.available !== false)
            .map((p: any) => {
              // Normaliser l'URL de l'image : convertir @public/images/... en /images/...
              let normalizedImageUrl = p.image_url || '/images/pack.png'
              if (normalizedImageUrl) {
                normalizedImageUrl = normalizedImageUrl.replace(/^@public\/images\//, '/images/')
                // S'assurer que ça commence par /images/ si c'est une image locale
                if (normalizedImageUrl.startsWith('images/') && !normalizedImageUrl.startsWith('/images/')) {
                  normalizedImageUrl = '/' + normalizedImageUrl
                }
              }
              
              // Utiliser les traductions multilingues
              return {
                id: p.id,
                title: getProductName(p),
                img: normalizedImageUrl,
                blurb: getProductDescription(p),
                price: parseFloat(p.price),
                originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
                isPack: p.is_pack,
                isOneTime: p.is_one_time !== false,
                category: p.category || 'capsules', // Ajouter la catégorie du produit
                _originalProduct: p // Garder une référence au produit original pour les traductions
              }
            })
          setBoutiqueCapsules(adaptedProducts)
          
          // Stocker TOUS les produits (y compris non disponibles) pour les achats
          const allProductsForFormations = allProductsData.map((p: any) => {
            // Normaliser l'URL de l'image : convertir @public/images/... en /images/...
            let normalizedImageUrl = p.image_url || '/images/pack.png'
            if (normalizedImageUrl) {
              normalizedImageUrl = normalizedImageUrl.replace(/^@public\/images\//, '/images/')
              // S'assurer que ça commence par /images/ si c'est une image locale
              if (normalizedImageUrl.startsWith('images/') && !normalizedImageUrl.startsWith('/images/')) {
                normalizedImageUrl = '/' + normalizedImageUrl
              }
            }
            
            // Utiliser les traductions multilingues
            return {
              id: p.id,
              title: getProductName(p),
              img: normalizedImageUrl,
              blurb: getProductDescription(p),
              category: p.category || 'capsules', // Ajouter la catégorie du produit depuis la boutique
              pdf_url: p.pdf_url || null, // URL du PDF pour ebook
              _originalProduct: p // Garder une référence au produit original pour les traductions
            }
          })
          setAllProducts(allProductsForFormations)
          
          // Vérifier si analyse-financiere est présent
          const analyseProduct = allProductsForFormations.find((p: any) => p.id === 'analyse-financiere')
          if (!analyseProduct) {
            console.warn('[DASHBOARD] ⚠️ Produit "analyse-financiere" NON trouvé dans allProducts')
          }
        } else {
          console.warn('[DASHBOARD] ⚠️ Aucun produit chargé depuis la base de données')
        }
        
        // Charger capsules utilisateur depuis user_capsules
        const myCaps = await capsulesService.getUserCapsules().catch(() => [])
        let capsuleIds = Array.isArray(myCaps) ? myCaps.map((c: any) => c.capsule_id) : []
        
        // Charger aussi les commandes depuis orders (pour inclure les commandes mobile money en attente)
        // Inclure les statuts pending_review (en attente de validation) et paid (payées)
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, product_id, status, payment_method, created_at, validated_at')
          .eq('user_id', user.id)
          .in('status', ['pending_review', 'paid'])
        
        if (ordersError) {
          console.error('Erreur chargement commandes:', ordersError)
        } else if (ordersData && ordersData.length > 0) {
          // Stocker les commandes complètes pour vérifier le statut plus tard
          setUserOrders(ordersData)
          
          // Ajouter les product_id des commandes qui ne sont pas déjà dans capsuleIds
          // Inclure maintenant l'abonnement dans les achats affichés
          const orderProductIds = ordersData
            .map((o: any) => o.product_id)
            .filter((productId: string) => productId) // Enlever le filtre d'exclusion de l'abonnement
          
          // Fusionner sans doublons
          const allProductIds = [...new Set([...capsuleIds, ...orderProductIds])]
          capsuleIds = allProductIds
        } else {
          setUserOrders([])
        }
        
        // Vérifier si l'utilisateur a payé pour une analyse financière
        // Rechercher les paiements pour analyse-financiere OU payment_type = 'analysis'
        // Utiliser une requête plus large pour être sûr de trouver les paiements
        const { data: paymentAnalysis, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'success')
          .or('product_id.eq.analyse-financiere,product_id.ilike.%analyse-financiere%,payment_type.eq.analysis')
        
        // Ajouter "analyse-financiere" aux capsules si l'utilisateur a payé
        if (paymentAnalysis && paymentAnalysis.length > 0 && !capsuleIds.includes('analyse-financiere')) {
          capsuleIds = [...capsuleIds, 'analyse-financiere']
        }
        
        // Vérifier aussi les paiements Stripe pour masterclass et coaching
        // (au cas où ils ne seraient pas dans orders mais dans payments)
        const { data: allPayments } = await supabase
          .from('payments')
          .select('product_id')
          .eq('user_id', user.id)
          .eq('status', 'success')
        
        if (allPayments && allPayments.length > 0) {
          // Récupérer les produits pour vérifier leur catégorie
          const { data: productsData } = await supabase
            .from('products')
            .select('id, category')
          
          const productCategories = new Map<string, string>()
          if (productsData) {
            productsData.forEach((p: any) => {
              productCategories.set(p.id, p.category || 'capsules')
            })
          }
          
          // Ajouter les produits masterclass et coaching payés qui ne sont pas déjà dans capsuleIds
          for (const payment of allPayments) {
            const productId = payment.product_id
            if (productId && !capsuleIds.includes(productId)) {
              const productCategory = productCategories.get(productId) || 'capsules'
              // Ajouter masterclass et coaching (mais pas analyse-financiere ni abonnement)
              if ((productCategory === 'masterclass' || productCategory === 'coaching') && 
                  productId !== 'analyse-financiere' && 
                  productId !== 'abonnement') {
                capsuleIds = [...capsuleIds, productId]
                console.log(`[INIT] ✅ Produit ${productId} (${productCategory}) ajouté depuis payments`)
              }
            }
          }
        }
        
        setUserCapsules(capsuleIds)
        
        // Charger formations pour ces capsules (capsules prédéfinies ET produits de la boutique)
        if (capsuleIds.length > 0) {
          const { data: formations } = await supabase
            .from('formations')
            .select('*')
            .in('capsule_id', capsuleIds)
            .order('date_scheduled', { ascending: true })
          setFormationsData(formations || [])
        } else {
          setFormationsData([])
        }
        
        if (paymentError) {
          console.error('Erreur vérification paiements analyse:', paymentError)
        }
        
        // Charger les analyses de l'utilisateur
        try {
          const analyses = await analysisService.getAnalysesByUser()
          setUserAnalyses(analyses)
        } catch (error) {
          console.error('Erreur chargement analyses:', error)
          setUserAnalyses([])
        }
      } catch (e) {
        console.error('Erreur init dashboard:', e)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    init()
    
    return () => {
      cancelled = true
    }
  }, [supabase, router, availableCapsules, getProductName, getProductDescription])

  // Fonction pour recharger les analyses après upload
  const [refreshingAnalyses, setRefreshingAnalyses] = useState(false)

  const reloadAnalyses = useCallback(async () => {
    setRefreshingAnalyses(true)
    if (supabase && user) {
      try {
        const analyses = await analysisService.getAnalysesByUser()
        setUserAnalyses(analyses)
      } catch (error) {
        console.error('Erreur rechargement analyses:', error)
      } finally {
        setRefreshingAnalyses(false)
      }
    } else {
      setRefreshingAnalyses(false)
    }
  }, [supabase, user])

  // Rafraîchir après un paiement réussi
  useEffect(() => {
    if (searchParams?.get('payment') === 'success' && supabase && user) {
      // Attendre un peu plus longtemps pour que l'API verify-payment ait créé l'analyse
      const refreshData = async () => {
        // Recharger les analyses avec polling régulier
        let attemptCount = 0
        const maxAttempts = 15 // Poller jusqu'à 15 fois (30 secondes au total)
        let previousCount = userAnalyses.length
        
        const loadAnalyses = async () => {
          try {
            const analyses = await analysisService.getAnalysesByUser()
            const currentCount = analyses.length
            setUserAnalyses(analyses)
            
            // Si une nouvelle analyse a été détectée, on peut arrêter le polling
            if (currentCount > previousCount) {
              previousCount = currentCount
              // On continue quand même quelques tentatives pour être sûr
            }
            
            // Continuer le polling jusqu'à maxAttempts
            attemptCount++
            if (attemptCount < maxAttempts) {
              setTimeout(() => loadAnalyses(), 2000)
            }
          } catch (error) {
            console.error('Erreur rechargement analyses:', error)
            attemptCount++
            if (attemptCount < maxAttempts) {
              setTimeout(() => loadAnalyses(), 2000)
            }
          }
        }
        
        // Démarrer le polling après 1 seconde pour laisser le temps à l'API verify-payment
        setTimeout(() => loadAnalyses(), 1000)
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
        
        // Recharger les capsules achetées depuis user_capsules
        const { data: capsulesData } = await supabase
          .from('user_capsules')
          .select('capsule_id')
          .eq('user_id', user.id)
        
        let userCapsulesIds = capsulesData?.map((c: any) => c.capsule_id) || []
        
        // Charger aussi les commandes depuis orders (pour inclure les commandes mobile money en attente)
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, product_id, status, payment_method, created_at, validated_at')
          .eq('user_id', user.id)
          .in('status', ['pending_review', 'paid'])
        
        if (ordersData && ordersData.length > 0) {
          // Stocker les commandes complètes pour vérifier le statut plus tard
          setUserOrders(ordersData)
          
          // Ajouter les product_id des commandes qui ne sont pas déjà dans userCapsulesIds
          const orderProductIds = ordersData
            .map((o: any) => o.product_id)
            .filter((productId: string) => productId && productId !== 'abonnement')
          
          // Fusionner sans doublons
          userCapsulesIds = [...new Set([...userCapsulesIds, ...orderProductIds])]
        } else {
          setUserOrders([])
        }
        
        // Rafraîchir aussi la vérification des paiements pour l'analyse financière
        // Utiliser une requête plus large pour être sûr de trouver les paiements
        const { data: paymentAnalysis } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'success')
          .or('product_id.eq.analyse-financiere,product_id.ilike.%analyse-financiere%,payment_type.eq.analysis')
        
        // Ajouter "analyse-financiere" aux capsules si l'utilisateur a payé
        if (paymentAnalysis && paymentAnalysis.length > 0 && !userCapsulesIds.includes('analyse-financiere')) {
          userCapsulesIds = [...userCapsulesIds, 'analyse-financiere']
        }
        
        // Vérifier aussi les paiements Stripe pour masterclass et coaching
        // (au cas où ils ne seraient pas dans orders mais dans payments)
        const { data: allPaymentsRefresh } = await supabase
          .from('payments')
          .select('product_id')
          .eq('user_id', user.id)
          .eq('status', 'success')
        
        if (allPaymentsRefresh && allPaymentsRefresh.length > 0) {
          // Récupérer les produits pour vérifier leur catégorie
          const { data: productsData } = await supabase
            .from('products')
            .select('id, category')
          
          const productCategories = new Map<string, string>()
          if (productsData) {
            productsData.forEach((p: any) => {
              productCategories.set(p.id, p.category || 'capsules')
            })
          }
          
          // Ajouter les produits masterclass et coaching payés qui ne sont pas déjà dans userCapsulesIds
          for (const payment of allPaymentsRefresh) {
            const productId = payment.product_id
            if (productId && !userCapsulesIds.includes(productId)) {
              const productCategory = productCategories.get(productId) || 'capsules'
              // Ajouter masterclass et coaching (mais pas analyse-financiere ni abonnement)
              if ((productCategory === 'masterclass' || productCategory === 'coaching') && 
                  productId !== 'analyse-financiere' && 
                  productId !== 'abonnement') {
                userCapsulesIds = [...userCapsulesIds, productId]
                console.log(`[RAFRAÎCHISSEMENT] ✅ Produit ${productId} (${productCategory}) ajouté depuis payments`)
              }
            }
          }
        }
        
        setUserCapsules(userCapsulesIds)
        console.log('[RAFRAÎCHISSEMENT] Capsules/Packs/Ebooks achetés après paiement:', userCapsulesIds)
        
        // Recharger aussi les produits pour mettre à jour filteredFormations
        const { data: allProductsData } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: true })
        
        if (allProductsData) {
          const allProductsForFormations = allProductsData.map((p: any) => {
            // Normaliser l'URL de l'image : convertir @public/images/... en /images/...
            let normalizedImageUrl = p.image_url || '/images/pack.png'
            if (normalizedImageUrl) {
              normalizedImageUrl = normalizedImageUrl.replace(/^@public\/images\//, '/images/')
              // S'assurer que ça commence par /images/ si c'est une image locale
              if (normalizedImageUrl.startsWith('images/') && !normalizedImageUrl.startsWith('/images/')) {
                normalizedImageUrl = '/' + normalizedImageUrl
              }
            }
            
            // Utiliser les traductions multilingues
            return {
              id: p.id,
              title: getProductName(p),
              img: normalizedImageUrl,
              blurb: getProductDescription(p),
              category: p.category || 'capsules',
              pdf_url: p.pdf_url || null,
              _originalProduct: p // Garder une référence au produit original pour les traductions
            }
          })
          setAllProducts(allProductsForFormations)
        }
        
        // Recharger les produits de la boutique pour mettre à jour filteredFormations
        // Cela va déclencher le recalcul de filteredFormations via useMemo
        const { data: boutiqueProductsData } = await supabase
          .from('products')
          .select('*')
          .eq('available', true)
          .order('created_at', { ascending: true })
        
        if (boutiqueProductsData) {
          const adaptedProducts = boutiqueProductsData.map((p: any) => {
            // Normaliser l'URL de l'image : convertir @public/images/... en /images/...
            let normalizedImageUrl = p.image_url || '/images/pack.png'
            if (normalizedImageUrl) {
              normalizedImageUrl = normalizedImageUrl.replace(/^@public\/images\//, '/images/')
              // S'assurer que ça commence par /images/ si c'est une image locale
              if (normalizedImageUrl.startsWith('images/') && !normalizedImageUrl.startsWith('/images/')) {
                normalizedImageUrl = '/' + normalizedImageUrl
              }
            }
            
            // Utiliser les traductions multilingues
            return {
              id: p.id,
              title: getProductName(p),
              img: normalizedImageUrl,
              blurb: getProductDescription(p),
              price: parseFloat(p.price),
              originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
              isPack: p.is_pack,
              isOneTime: p.is_one_time !== false,
              category: p.category || 'capsules',
              _originalProduct: p // Garder une référence au produit original pour les traductions
            }
          })
          setBoutiqueCapsules(adaptedProducts)
        }
      }
      
      // Appeler refreshData immédiatement
      refreshData()
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        router.replace('/dashboard')
      }, 3000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, supabase, user, router, availableCapsules, getProductName, getProductDescription])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false)
        }
      }
      
      if (showWhatsAppPopup) {
        const target = event.target as Element
        if (!target.closest('.whatsapp-container')) {
          setShowWhatsAppPopup(false)
        }
      }
      
      if (showCartDropdown) {
        const target = event.target as Element
        if (!target.closest('.cart-container')) {
          setShowCartDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu, showWhatsAppPopup, showCartDropdown])

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleProfileSave = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!supabase) return
    setProfileSaving(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profileFirstName,
          last_name: profileLastName,
          phone: profilePhone,
          country: profileCountry,
          city: profileCity,
          profession: profileProfession
        }
      })
      if (error) throw error
      setProfileSuccess(t.dashboard.profile?.successMessage || 'Profil mis à jour avec succès.')
      setUser((prev: any) => prev ? ({
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          first_name: profileFirstName,
          last_name: profileLastName,
          phone: profilePhone,
          country: profileCountry,
          city: profileCity,
          profession: profileProfession
        }
      }) : prev)
    } catch (err: any) {
      setProfileError(t.dashboard.profile?.errorMessage || err?.message || 'Erreur lors de la mise à jour du profil.')
    } finally {
      setProfileSaving(false)
    }
  }


  const handleWhatsAppClick = () => {
    setShowWhatsAppPopup(true)
  }

  const handleWhatsAppConfirm = () => {
    window.open('https://wa.me/33756848734', '_blank')
    setShowWhatsAppPopup(false)
  }

  const handleViewCart = () => {
    setShowCartDropdown(false)
    router.push('/cart')
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="h-8 w-32 sm:w-48 bg-gray-200 rounded animate-pulse" />
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        {/* Content skeleton */}
        <div className="py-4 sm:py-8 pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 sm:mb-8">
              <div className="h-7 w-64 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="mb-6 sm:mb-8">
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="space-y-4 sm:space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                      </div>
                      <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div className="bg-gray-300 h-2 sm:h-3 rounded-full w-2/3 animate-pulse" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {[...Array(4)].map((_, k) => (
                        <div key={k} className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 ml-2 sm:ml-16 mt-4">
              <button
                onClick={() => router.push('/')}
                className="cursor-pointer"
              >
                <Image
                  src="/images/logo/logofinal.png"
                  alt="Cash360"
                  width={540}
                  height={540}
                  className="h-16 sm:h-32 md:h-42 w-auto hover:opacity-80 transition-opacity duration-200"
                />
              </button>
            </div>
            
            {/* Informations de connexion */}
            <div className="flex items-center gap-1 sm:gap-4 mr-2 sm:mr-20">
              {user && (
                <div className="flex items-center gap-1 sm:gap-3">
                  {/* Icône Panier */}
                    <div className="relative cart-container z-[10000]">
                      <button
                      onClick={() => {
                        const wasOpen = showCartDropdown
                        setShowCartDropdown(!showCartDropdown)
                        // Tracker l'ouverture du panier (seulement quand on ouvre, pas quand on ferme)
                        if (!wasOpen && cartItems.length > 0) {
                          tracking.cartOpened(cartItems.length)
                        }
                      }}
                        data-onboarding="cart"
                      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {cartItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#FEBE02] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {cartItems.length}
                        </span>
                      )}
                    </button>

                    {/* Dropdown du panier */}
                    {showCartDropdown && (
                      <div className="fixed sm:absolute top-16 sm:top-auto right-1 sm:right-0 left-1 sm:left-auto mt-0 sm:mt-2 w-[calc(100vw-0.5rem)] sm:w-80 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-[10000] animate-fadeIn max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <h3 className="font-bold text-[#012F4E]" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>
                            {t.dashboard.cart.title}
                          </h3>
                        </div>

                        {/* Liste des articles */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                          {cartItems.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                              <span className="mr-2">👋</span>
                              {t.dashboard.cart.empty}
                              <p className="text-xs text-gray-400 mt-2">{t.dashboard.cart.emptyDescription}</p>
                            </div>
                          ) : (
                            <div className="px-4 py-2">
                              {cartItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
                                  {/* Image miniature */}
                                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={item.img}
                                      alt={item.title}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  
                                  {/* Infos */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                    <p className="text-sm text-gray-600">{t.dashboard.cart.quantity} {item.quantity}</p>
                                    <p className="text-sm font-bold text-[#012F4E]">{formatPrice(item.price * item.quantity)}</p>
                                  </div>

                                  {/* Bouton supprimer */}
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer avec sous-total et boutons */}
                        {cartItems.length > 0 && (
                          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
                            {/* Sous-total */}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{t.dashboard.cart.subtotal}</span>
                              <span className="text-base font-bold text-[#012F4E]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                                {formatPrice(getSubtotal())}
                              </span>
                            </div>

                            {/* Bouton "Voir le panier" */}
                            <button
                              onClick={handleViewCart}
                              className="w-full px-4 py-2 bg-[#00A1C6] text-white rounded-lg font-medium hover:bg-[#FEBE02] transition-colors"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            >
                              {t.dashboard.cart.viewCart}
                            </button>

                            {/* Lien "Continuer vos achats" */}
                            <button
                              onClick={() => setShowCartDropdown(false)}
                              className="w-full text-sm text-[#012F4E] hover:underline transition-colors"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            >
                              {t.dashboard.cart.continueShopping}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <CurrencySelector />
                  <LanguageSwitch />
                  <div className="relative user-menu-container z-[9999]">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {getInitials(user.email)}
                      </span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]">
                        <button
                          onClick={() => {
                            router.push('/dashboard')
                            setShowUserMenu(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {t.dashboard.myAccount}
                        </button>
                        <button
                          onClick={() => {
                            handleSignOut()
                            setShowUserMenu(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          {t.dashboard.signOut}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Message de succès du paiement */}
          {showPaymentSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-1">{t.dashboard.paymentSuccess.title}</h3>
                <p className="text-green-800">{t.dashboard.paymentSuccess.message}</p>
              </div>
            </div>
          )}

          {subscriptionError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {subscriptionError}
            </div>
          )}

          {!subscriptionLoading && !hasPremiumAccess && (
            <div className="mb-6 rounded-3xl border-2 border-[#FEBE02] bg-gradient-to-br from-[#FFF9EC] via-[#FFF3C4] to-[#FFE8A1] p-8 shadow-[0_20px_60px_rgba(254,190,2,0.25)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-4">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#012F4E] text-[#FEBE02] text-xs font-bold uppercase tracking-wider">
                    <span className="block w-2 h-2 rounded-full bg-[#FEBE02] animate-pulse" />
                    {t.dashboard.subscription?.badge || 'EXCLUSIF'}
                  </span>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-[#012F4E] leading-tight">
                      {t.dashboard.subscription?.lockedTitle || 'Débloquez votre transformation financière'}
                    </h2>
                    <div className="space-y-2 text-[#4E3B1A]">
                      {t.dashboard.subscription?.lockedDescription ? (
                        <p className="text-base leading-relaxed font-medium">
                          {t.dashboard.subscription.lockedDescription}
                        </p>
                      ) : (
                        <>
                          <p className="text-base leading-relaxed font-medium">
                            Accédez à votre <strong>Tableau de bord</strong> pour suivre vos revenus, dépenses et épargne en temps réel.
                          </p>
                          <p className="text-base leading-relaxed font-medium">
                            Utilisez <strong>Budget & suivi</strong> pour gérer vos finances mensuelles et identifier vos principales catégories de dépenses.
                          </p>
                          <p className="text-base leading-relaxed font-medium">
                            Lancez un <strong>Jeûne financier de 30 jours</strong> pour reprendre le contrôle de vos habitudes de dépenses.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 lg:items-end lg:min-w-[280px]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('boutique')
                      setSelectedCategory('abonnement')
                      if (typeof window !== 'undefined') {
                        requestAnimationFrame(() => {
                          document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        })
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FEBE02] via-[#F99500] to-[#F6AE2D] px-8 py-4 text-[#012F4E] font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t.dashboard.subscription?.cta || 'Découvrir l’abonnement'}
                  </button>
                  <p className="text-xs text-[#7A4F00] text-center lg:text-right font-medium">
                    {t.dashboard.subscription?.mobileInfo || 'Paiement sécurisé • Stripe & Mobile Money'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* En-tête d'accueil */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t.dashboard.welcomeGreeting} {getUserDisplayName(user)}
            </h1>
            <p className="text-gray-600">
              {t.dashboard.welcomeSubtitle}
            </p>
          </div>

          {/* Onglets de navigation */}
        <div className="mb-8 border-b border-gray-200 pb-2" data-onboarding="tabs">
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {navItems.map((item) => {
              const tooltipMap: Record<DashboardTab, string> = {
                overview: t.dashboard.tabs.tooltips?.overview || '',
                boutique: t.dashboard.tabs.tooltips?.boutique || '',
                formations: t.dashboard.tabs.tooltips?.myPurchases || '',
                profil: t.dashboard.tabs.tooltips?.profile || '',
                budget: t.dashboard.tabs.tooltips?.budget || '',
                fast: t.dashboard.tabs.tooltips?.financialFast || '',
                debtfree: t.dashboard.tabs.tooltips?.debtFree || ''
              }
              return (
              <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={tooltipMap[item.id]}
                  data-onboarding={
                    item.id === 'overview' ? 'overview-tab' : 
                    item.id === 'budget' ? 'budget-tab' : 
                    item.id === 'fast' ? 'fast-tab' : 
                    item.id === 'debtfree' ? 'debtfree-tab' :
                    item.id === 'profil' ? 'profile-tab' : 
                    item.id === 'boutique' ? 'boutique-tab' : 
                    item.id === 'formations' ? 'purchases-tab' : 
                    undefined
                  }
                  className={`snap-start px-5 sm:px-6 py-3 font-medium transition-all rounded-t-lg whitespace-nowrap ${
                    activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900 bg-white'
                  }`}
                >
                  {item.label}
              </button>
              )
            })}
          </div>
        </div>

          {/* Contenu de l'onglet "Tableau de bord" */}
          {hasPremiumAccess && activeTab === 'overview' && (
            <div className="space-y-8">
              <HelpBanner
                tabId="overview"
                title={t.dashboard.helpBanner?.overviewTitle || 'Comment utiliser votre tableau de bord'}
                description={t.dashboard.helpBanner?.overviewDescription || 'Découvrez comment naviguer et utiliser toutes les fonctionnalités de votre tableau de bord.'}
                modalTitle={t.dashboard.helpBanner?.overviewModalTitle || 'Comment utiliser votre tableau de bord'}
                modalContent={t.dashboard.helpBanner?.overviewModalContent || 'Votre tableau de bord vous donne une vue d\'ensemble de votre situation financière. Vous pouvez voir vos revenus, dépenses et épargne du mois en cours, comparer avec le mois précédent, et accéder rapidement aux différentes sections : Budget & suivi, Jeûne financier et DebtFree.'}
              />
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(1,47,78,0.08)] border border-[#E7EDF5]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.35em] text-[#00A1C6] mb-3">
                      {t.dashboard.overview?.summaryTitle || 'Résumé du mois'}
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-[#012F4E]">
                      {t.dashboard.tabs.overview || 'Tableau de bord'}
                    </h3>
                    <p className="mt-3 text-gray-500">
                      {t.dashboard.overview?.subtitle || 'Heureux de vous accompagner vers une vie financière équilibrée.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  {summaryCards.map((card) => {
                    const isSavingsNegative = card.isSavings && !card.isEmpty && card.savingsValue !== undefined && card.savingsValue < 0
                    const isSavingsPositive = card.isSavings && !card.isEmpty && card.savingsValue !== undefined && card.savingsValue > 0
                    const savingsColor = isSavingsNegative ? 'text-red-600' : isSavingsPositive ? 'text-emerald-600' : ''
                    
                    return (
                      <div
                        key={card.label}
                        className="bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-4"
                      >
                        <p className="text-sm text-[#7CA7C0]">{card.label}</p>
                        <div className="flex items-baseline justify-between mt-2">
                          <p className={`text-2xl font-semibold ${
                            card.isEmpty 
                              ? 'text-gray-400' 
                              : card.isSavings && savingsColor
                                ? savingsColor
                                : 'text-[#012F4E]'
                          }`}>
                            {card.value}
                          </p>
                          {!card.isEmpty && <span className="text-xs text-[#00A1C6]">•</span>}
                        </div>
                      {card.isEmpty && budgetSnapshot === null && (
                        <p className="text-xs text-gray-400 mt-1">
                          {t.dashboard.overview?.setupHint || 'Configurez votre budget pour voir vos données'}
                        </p>
                      )}
                      {!card.isEmpty && card.comparison && (
                        <p className={`text-xs mt-2 ${
                          card.comparison.isPositive ? 'text-emerald-600' : 'text-gray-500'
                        }`}>
                          {card.comparison.label}
                        </p>
                      )}
                      {!card.isEmpty && !card.comparison && previousMonthSnapshot === null && budgetSnapshot && (
                        <p className="text-xs text-gray-400 mt-2">
                          {t.dashboard.overview?.firstMonth || 'Premier mois'}
                        </p>
                      )}
                      </div>
                    )
                  })}
                </div>

                {/* Indicateur de santé financière - placé après les cards pour plus de clarté */}
                {budgetSnapshot && financialHealthStatus.status !== 'excellent' && (
                  <div className={`mt-6 flex items-start gap-3 p-4 rounded-xl border ${financialHealthStatus.bgColor} ${financialHealthStatus.borderColor}`}>
                    <div className={`text-xl flex-shrink-0 ${financialHealthStatus.color}`}>
                      {financialHealthStatus.status === 'critical' ? '🚨' : 
                       financialHealthStatus.status === 'warning' ? '⚠️' :
                       financialHealthStatus.status === 'good' ? '👍' : '📝'}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold mb-1 ${financialHealthStatus.color}`}>
                        {financialHealthStatus.label}
                      </p>
                      {financialHealthStatus.status === 'critical' && (
                        <p className="text-xs text-red-700">
                          {t.dashboard.overview?.healthStatusCriticalDesc || 'Vos dépenses dépassent vos revenus. Rééquilibrez votre budget rapidement.'}
                        </p>
                      )}
                      {financialHealthStatus.status === 'warning' && (
                        <p className="text-xs text-yellow-700">
                          {t.dashboard.overview?.healthStatusWarningDesc || 'Vous avez utilisé plus de 90% de votre budget. Restez vigilant.'}
                        </p>
                      )}
                      {financialHealthStatus.status === 'good' && (
                        <p className="text-xs text-blue-700">
                          {t.dashboard.overview?.healthStatusGoodDesc || 'Vous respectez votre budget. Continuez ainsi !'}
                        </p>
                      )}
                      {financialHealthStatus.status === 'setup' && (
                        <p className="text-xs text-gray-600">
                          {t.dashboard.overview?.healthStatusSetupDesc || 'Configurez votre budget pour voir votre situation financière.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {t.dashboard.overview?.actionsTitle || 'Prochaines actions'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {t.dashboard.overview?.subtitle || 'Choisissez la prochaine étape pour avancer.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {/* TODO: connect upcoming milestone */}
                        2 actions à jour
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                      type="button"
                      onClick={() => setActiveTab('budget')}
                      className={`w-full group rounded-2xl border p-5 text-left bg-white hover:shadow-lg transition-all duration-200 ${
                        !budgetSnapshot || budgetSnapshot.monthlyIncome === 0
                          ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                          : budgetSnapshot?.remaining < 0
                            ? 'border-red-300 bg-red-50 hover:border-red-400'
                            : 'border-[#00A1C6]/20 hover:border-[#00A1C6]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-lg font-semibold group-hover:text-[#00A1C6] ${
                          !budgetSnapshot || budgetSnapshot.monthlyIncome === 0
                            ? 'text-yellow-900'
                            : budgetSnapshot?.remaining < 0
                              ? 'text-red-900'
                              : 'text-[#012F4E]'
                        }`}>
                          {!budgetSnapshot || budgetSnapshot.monthlyIncome === 0
                            ? (t.dashboard.overview?.actionSetupBudget || 'Configurer mon budget')
                            : budgetSnapshot?.remaining < 0
                              ? (t.dashboard.overview?.actionReviewExpenses || 'Réviser mes dépenses')
                              : (t.dashboard.overview?.primaryAction || 'Gérer mon budget')}
                        </h4>
                        <span className={`text-sm ${
                          !budgetSnapshot || budgetSnapshot.monthlyIncome === 0
                            ? 'text-yellow-600'
                            : budgetSnapshot?.remaining < 0
                              ? 'text-red-600'
                              : 'text-[#00A1C6]'
                        } group-hover:text-[#012F4E]`}>→</span>
                      </div>
                      <p className={`text-sm group-hover:text-gray-700 ${
                        !budgetSnapshot || budgetSnapshot.monthlyIncome === 0
                          ? 'text-yellow-800'
                          : budgetSnapshot?.remaining < 0
                            ? 'text-red-800'
                            : 'text-gray-600'
                      }`}>
                        {!budgetSnapshot || budgetSnapshot.monthlyIncome === 0
                          ? (t.dashboard.overview?.actionSetupBudgetDesc || 'Commencez par enregistrer vos revenus et dépenses.')
                          : budgetSnapshot?.remaining < 0
                            ? (t.dashboard.overview?.actionReviewExpensesDesc || 'Vos dépenses dépassent vos revenus. Rééquilibrez votre budget.')
                            : (t.dashboard.overview?.actionManageBudgetDesc || 'Suivez vos dépenses en temps réel et optimisez chaque euro.')}
                      </p>
              </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('fast')}
                      className={`w-full group rounded-2xl border p-5 text-left bg-gradient-to-br transition-colors duration-200 ${
                        fastSummary.status === 'none'
                          ? 'border-yellow-300 from-yellow-50 to-white hover:from-yellow-100 hover:to-white'
                          : fastSummary.status === 'active'
                            ? 'border-green-300 from-green-50 to-white hover:from-green-100 hover:to-white'
                            : 'border-sky-200 from-sky-50 to-white hover:from-sky-100 hover:to-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-lg font-semibold group-hover:text-sky-950 ${
                          fastSummary.status === 'none'
                            ? 'text-yellow-900'
                            : fastSummary.status === 'active'
                              ? 'text-green-900'
                              : 'text-sky-900'
                        }`}>
                          {fastSummary.status === 'active' && fastSummary.day
                            ? `${t.dashboard.tabs.financialFast || 'Jeûne financier'} - Jour ${fastSummary.day}/30`
                            : fastSummary.status === 'completed'
                              ? `${t.dashboard.tabs.financialFast || 'Jeûne financier'} - Terminé`
                              : (t.dashboard.tabs.financialFast || 'Jeûne financier')}
                        </h4>
                        <span className={`text-sm group-hover:text-sky-950 ${
                          fastSummary.status === 'none'
                            ? 'text-yellow-600'
                            : fastSummary.status === 'active'
                              ? 'text-green-600'
                              : 'text-sky-600'
                        }`}>→</span>
                      </div>
                      <p className={`text-sm group-hover:text-sky-950 ${
                        fastSummary.status === 'none'
                          ? 'text-yellow-800'
                          : fastSummary.status === 'active'
                            ? 'text-green-800'
                            : 'text-sky-900/80'
                      }`}>
                        {fastSummary.status === 'active' && fastSummary.day
                          ? (t.dashboard.overview?.fastInsightActive?.replace('{day}', fastSummary.day.toString()) || `Jour ${fastSummary.day}/30 – Continue, tu avances.`)
                          : fastSummary.status === 'completed'
                            ? (t.dashboard.overview?.fastInsightCompleted || 'Jeûne terminé : décide quoi faire de cette économie.')
                            : (t.dashboard.overview?.fastInsightMissing || 'Active ton jeûne financier pour renforcer ta discipline.')}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('debtfree')}
                      className={`w-full group rounded-2xl border p-5 text-left bg-gradient-to-br transition-colors duration-200 ${
                        debtSummary && debtSummary.totalDebtMonthlyPayments > 0 && debtSummary.availableMarginMonthly <= 0
                          ? 'border-red-300 from-red-50 to-white hover:from-red-100 hover:to-white'
                          : debtSummary && debtSummary.totalDebtMonthlyPayments > 0
                            ? 'border-purple-200 from-purple-50 to-white hover:from-purple-100 hover:to-white'
                            : 'border-purple-200 from-purple-50 to-white hover:from-purple-100 hover:to-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-lg font-semibold group-hover:text-purple-950 ${
                          debtSummary && debtSummary.totalDebtMonthlyPayments > 0 && debtSummary.availableMarginMonthly <= 0
                            ? 'text-red-900'
                            : 'text-purple-900'
                        }`}>
                          {t.dashboard.tabs.debtFree || 'DebtFree'}
                        </h4>
                        <span className={`text-sm group-hover:text-purple-950 ${
                          debtSummary && debtSummary.totalDebtMonthlyPayments > 0 && debtSummary.availableMarginMonthly <= 0
                            ? 'text-red-600'
                            : 'text-purple-600'
                        }`}>→</span>
                      </div>
                      <p className={`text-sm group-hover:text-purple-950 ${
                        debtSummary && debtSummary.totalDebtMonthlyPayments > 0 && debtSummary.availableMarginMonthly <= 0
                          ? 'text-red-800'
                          : 'text-purple-900/80'
                      }`}>
                        {debtSummary && debtSummary.totalDebtMonthlyPayments > 0 && debtSummary.availableMarginMonthly <= 0
                          ? (t.dashboard.overview?.debtCriticalMessage || 'Situation critique : pas de marge pour rembourser.')
                          : debtSummary && debtSummary.totalDebtMonthlyPayments > 0
                            ? (t.dashboard.overview?.debtActiveMessage || 'Plan de remboursement basé sur votre budget.')
                            : (t.dashboard.overview?.debtNoDebtMessage || 'Plan de remboursement de dettes basé sur votre budget et vos économies.')}
                      </p>
                    </button>
                  </div>
                </div>
                <div className="bg-white text-[#012F4E] rounded-2xl p-6 shadow-xl border border-[#E7EDF5]">
                  <div className="mb-3">
                    <p className="text-xs font-semibold tracking-[0.35em] text-[#00A1C6] uppercase mb-1">
                      {t.dashboard.overview?.inspirationTitle || 'Verset du jour'}
                    </p>
                    <h3 className="text-lg font-semibold">
                      {dailyVerse?.reference || t.dashboard.overview?.inspirationReference || 'Proverbes 24:3'}
                    </h3>
                  </div>
                  <p className="text-xl font-medium italic mb-4 leading-relaxed text-gray-700">
                    “{dailyVerse?.text || t.dashboard.overview?.inspirationText || 'La sagesse assure la réussite.'}”
                  </p>
                  {dailyVerse?.summary && dailyVerse.summary !== dailyVerse.text && (
                    <p className="text-sm text-gray-500">
                      {dailyVerse.summary}
                    </p>
                  )}
                </div>
            </div>

              {/* Insights personnalisés */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {t.dashboard.overview?.insightsTitle || 'Suivi personnalisé'}
                  </h3>
                </div>
                <div className="space-y-5">
                  {overviewInsights.map((insight) => (
                    <div key={insight.key} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                      <span className={`text-sm font-semibold ${insight.accent}`}>{insight.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contenu de l'onglet "Budget & suivi" */}
          {hasPremiumAccess && activeTab === 'budget' && (
            <div className="space-y-8">
              <HelpBanner
                tabId="budget"
                title={t.dashboard.helpBanner?.budgetTitle || 'Comment utiliser Budget & suivi'}
                description={t.dashboard.helpBanner?.budgetDescription || 'Découvrez comment gérer vos revenus et dépenses mensuels efficacement.'}
                modalTitle={t.dashboard.helpBanner?.budgetModalTitle || 'Comment utiliser Budget & suivi'}
                modalContent={t.dashboard.helpBanner?.budgetModalContent || 'Dans Budget & suivi, vous pouvez :\n\n1. Enregistrer votre revenu mensuel net\n2. Ajouter vos dépenses par catégorie (alimentation, transport, loisirs, etc.)\n3. Suivre votre taux d\'utilisation en temps réel\n4. Visualiser vos principales catégories de dépenses\n\nN\'oubliez pas de cliquer sur "Enregistrer mes revenus" après avoir saisi votre revenu, puis "Enregistrer mon budget" pour sauvegarder toutes vos données.'}
              />
              <BudgetTracker variant="embedded" onBudgetChange={handleBudgetChange} />
            </div>
          )}

        {hasPremiumAccess && activeTab === 'fast' && (
          <div className="space-y-8">
            <HelpBanner
              tabId="fast"
              title={t.dashboard.helpBanner?.fastTitle || 'Comment utiliser le Jeûne financier'}
              description={t.dashboard.helpBanner?.fastDescription || 'Découvrez comment créer et suivre votre jeûne financier de 30 jours.'}
              modalTitle={t.dashboard.helpBanner?.fastModalTitle || 'Comment utiliser le Jeûne financier'}
              modalContent={t.dashboard.helpBanner?.fastModalContent || 'Le Jeûne financier vous aide à reprendre le contrôle de vos habitudes de dépenses en 30 jours :\n\n1. Sélectionnez les catégories de dépenses à jeûner (ex: restaurants, shopping)\n2. Définissez votre intention et votre habitude de remplacement\n3. Suivez votre progression jour par jour\n4. Visualisez vos économies réalisées\n\nUn jeûne actif vous permet de renforcer votre discipline financière et d\'économiser de l\'argent chaque mois.'}
            />
            <FinancialFast variant="embedded" onStatusChange={refreshFastSummary} />
          </div>
        )}

          {/* Contenu de l'onglet "DebtFree" */}
          {hasPremiumAccess && activeTab === 'debtfree' && (
            <div className="space-y-8">
              <HelpBanner
                tabId="debtfree"
                title={t.dashboard.helpBanner?.debtfreeTitle || 'Comment utiliser DebtFree'}
                description={t.dashboard.helpBanner?.debtfreeDescription || 'Découvrez comment créer votre plan de remboursement de dettes intelligent.'}
                modalTitle={t.dashboard.helpBanner?.debtfreeModalTitle || 'Comment utiliser DebtFree'}
                modalContent={t.dashboard.helpBanner?.debtfreeModalContent || 'DebtFree analyse automatiquement vos dettes à partir de votre budget :\n\n1. Ajoutez vos paiements mensuels de dettes dans Budget & suivi (catégories contenant "dette", "crédit" ou "prêt")\n2. DebtFree calcule automatiquement votre marge disponible pour rembourser\n3. Visualisez votre date estimée de libération de dettes\n4. Découvrez comment accélérer votre remboursement avec le jeûne financier\n\nPlus vous économisez avec le jeûne financier, plus vite vous serez libre de dettes !'}
              />
              <DebtFree variant="embedded" />
            </div>
          )}

          {/* Contenu de l'onglet "Boutique" */}
          {activeTab === 'boutique' && (
            <div className="space-y-6">
              {/* Titre et description de la section */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
                        <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t.dashboard.boutique.title}</h2>
                  <p className="text-gray-600">{t.dashboard.boutique.subtitle}</p>
                    </div>
                  </div>

              {/* Onglets de catégories */}
              <div className="bg-white rounded-lg border border-gray-200 p-2" data-onboarding="categories">
                <div className="flex gap-2 overflow-x-auto">
                  {[
                    { id: 'capsules', label: t.dashboard.boutique.categories.capsules },
                    { id: 'analyse-financiere', label: t.dashboard.boutique.categories.analysis },
                    { id: 'pack', label: t.dashboard.boutique.categories.pack },
                    { id: 'ebook', label: t.dashboard.boutique.categories.ebook, badge: hasEbookProducts ? undefined : t.dashboard.boutique.comingSoon },
                    { id: 'abonnement', label: t.dashboard.boutique.categories.subscription, badge: hasAbonnementProducts ? undefined : t.dashboard.boutique.comingSoon },
                    { id: 'coaching', label: t.dashboard.boutique.categories.coaching },
                    { id: 'masterclass', label: t.dashboard.boutique.categories.masterclass }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className={selectedCategory === cat.id ? 'text-white' : ''}>{cat.label}</span>
                      {cat.badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          selectedCategory === cat.id 
                            ? 'bg-yellow-400 text-yellow-900' 
                            : 'bg-yellow-400 text-yellow-900'
                        }`}>
                          {cat.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchBoutique}
                    onChange={(e) => setSearchBoutique(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t.dashboard.boutique.searchPlaceholder}
                  />
                  {searchBoutique && (
                    <button
                      onClick={() => setSearchBoutique('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {searchBoutique && (
                  <p className="mt-2 text-sm text-gray-600">
                    {filteredBoutiqueCapsules.length} {filteredBoutiqueCapsules.length > 1 ? t.dashboard.boutique.searchResultsPlural : t.dashboard.boutique.searchResults}
                  </p>
                )}
              </div>

              {/* Grille des capsules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentBoutiqueCapsules.map((capsule) => (
                  <div
                    key={`${capsule.id}-${currentCurrency}`}
                    id={
                      capsule.id === 'analyse-financiere'
                        ? 'analyse-financiere-card'
                        : (capsule as any).category === 'abonnement'
                          ? 'subscription'
                          : undefined
                    }
                    className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col ${
                      (capsule as any).category === 'abonnement' ? 'ring-1 ring-[#FEBE02]/40' : ''
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={capsule.img}
                        alt={capsule.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error('Erreur chargement image:', capsule.img, e)
                        }}
                        unoptimized
                      />
                    </div>

                    {/* Contenu */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{capsule.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 flex-1">{capsule.blurb}</p>

                      {/* Prix */}
                      <div className="mb-4">
                        {capsule.originalPrice && capsule.originalPrice > capsule.price ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">{formatPrice(capsule.price)}</span>
                            <span className="text-sm text-gray-400 line-through">{formatPrice(capsule.originalPrice)}</span>
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">
                              -{Math.round((1 - capsule.price / capsule.originalPrice) * 100)}%
                            </span>
                        </div>
                        ) : (
                          <span className="text-lg font-bold text-blue-600">{formatPrice(capsule.price)}</span>
                        )}
                      </div>

                      {/* Bouton d'achat ou abonnement */}
                      {(() => {
                        const capsuleCategory = (capsule as any).category || 'capsules'
                        if (capsuleCategory === 'abonnement') {
                          if (hasPremiumAccess) {
                            return (
                              <button
                                type="button"
                                disabled
                                className="w-full px-4 py-2 rounded-lg bg-emerald-600/10 text-emerald-700 font-semibold border border-emerald-200 cursor-not-allowed"
                              >
                                {t.dashboard.subscription?.activeLabel || 'Abonnement actif'}
                              </button>
                            )
                          }
                          const isProcessing = subscriptionCheckoutProduct === capsule.id
                          return (
                            <div className="space-y-3">
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleSubscriptionCheckout(capsule.id)}
                                  disabled={isProcessing}
                                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#FEBE02] to-[#F99500] text-[#012F4E] font-semibold shadow hover:from-[#ffd24f] hover:to-[#ffae33] transition disabled:opacity-60"
                                >
                                  {isProcessing
                                    ? t.dashboard.subscription?.checkoutLoading || 'Redirection...'
                                    : t.dashboard.subscription?.cta || 'Paiement carte bancaire'}
                                </button>
                                {t.dashboard.subscription?.ctaSubtext && (
                                  <p className="text-xs text-gray-600 mt-1 text-center">
                                    {t.dashboard.subscription.ctaSubtext}
                                  </p>
                                )}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleSubscriptionMobileMoney(capsule)}
                                  className="w-full px-4 py-2 rounded-lg border border-[#FEBE02] text-[#012F4E] font-semibold hover:bg-yellow-50 transition"
                                >
                                  {t.dashboard.subscription?.mobileButton || 'Paiement Mobile Money'}
                                </button>
                                {t.dashboard.subscription?.mobileButtonSubtext && (
                                  <p className="text-xs text-gray-600 mt-1 text-center">
                                    {t.dashboard.subscription.mobileButtonSubtext}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 text-center space-y-1">
                                <p>
                                  {t.dashboard.subscription?.accessSummary ||
                                    'Accédez au tableau de bord complet, Budget & suivi et Jeûne financier.'}
                                </p>
                                <p className="text-[11px] text-gray-600">
                                  {t.dashboard.subscription?.mobileInfo ||
                                    'Orange Money & Wave – Afrique de l’Ouest/Centrale. Activation manuelle sous 24h.'}
                                </p>
                              </div>
                            </div>
                          )
                        }

                        if (capsule.isOneTime && userCapsules.includes(capsule.id)) {
                          return (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t.dashboard.boutique.alreadyBought}
                        </button>
                          )
                        }

                        const cartItem = cartItems.find((item) => item.id === capsule.id)
                        const isInCart = cartItem !== undefined
                        const isDisabled = capsuleCategory !== 'analyse-financiere' && isInCart
                        
                        return (
                          <button
                            onClick={() => {
                              if (!isDisabled) {
                                addToCart({
                                  id: capsule.id,
                                  title: capsule.title,
                                  img: capsule.img,
                                  price: capsule.price,
                                  category: capsuleCategory
                                })
                                setShowCartDropdown(true)
                              }
                            }}
                            disabled={isDisabled}
                            className={`w-full px-4 py-2 rounded-lg transition-colors font-medium ${
                              isDisabled
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isDisabled 
                              ? t.dashboard.boutique.alreadyInCart
                              : capsule.isPack
                                ? t.dashboard.boutique.buyPack
                                : t.dashboard.boutique.buy}
                          </button>
                        )
                      })()}
                        </div>
                        </div>
                ))}
                      </div>

              {/* Pagination Boutique */}
              {totalPagesBoutique > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPageBoutique(prev => Math.max(1, prev - 1))}
                      disabled={currentPageBoutique === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.dashboard.pagination.previous}
                    </button>
                    <button
                      onClick={() => setCurrentPageBoutique(prev => Math.min(totalPagesBoutique, prev + 1))}
                      disabled={currentPageBoutique === totalPagesBoutique}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.dashboard.pagination.next}
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        {t.dashboard.pagination.showing} <span className="font-medium">{startIndexBoutique + 1}</span> {t.dashboard.pagination.to}{' '}
                        <span className="font-medium">{Math.min(endIndexBoutique, filteredBoutiqueCapsules.length)}</span> {t.dashboard.pagination.of}{' '}
                        <span className="font-medium">{filteredBoutiqueCapsules.length}</span> {filteredBoutiqueCapsules.length > 1 ? t.dashboard.pagination.products : t.dashboard.boutique.searchResults}
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageBoutique(prev => Math.max(1, prev - 1))}
                          disabled={currentPageBoutique === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Précédent</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {t.dashboard.pagination.page} {currentPageBoutique} {t.dashboard.pagination.on} {totalPagesBoutique}
                        </span>
                        <button
                          onClick={() => setCurrentPageBoutique(prev => Math.min(totalPagesBoutique, prev + 1))}
                          disabled={currentPageBoutique === totalPagesBoutique}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Suivant</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenu de l'onglet "Mes achats" */}
          {activeTab === 'formations' && (
            <div className="space-y-6">
              {/* Titre et description de la section */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t.dashboard.purchases.title}</h2>
                  </div>
                  <p className="text-gray-600">{t.dashboard.purchases.subtitle}</p>
                </div>
                <button
                  onClick={reloadAnalyses}
                  disabled={refreshingAnalyses}
                  className={`flex items-center gap-2 px-4 py-2 bg-[#00A1C6] text-white rounded-lg hover:bg-[#012F4E] transition-colors duration-200 shadow-sm ${refreshingAnalyses ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Actualiser les analyses"
                >
                  <svg 
                    className={`w-5 h-5 text-white ${refreshingAnalyses ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline text-white">{refreshingAnalyses ? 'Actualisation...' : 'Actualiser'}</span>
                </button>
              </div>

              {/* Onglets de catégories dans Mes achats */}
              <div className="bg-white rounded-lg border border-gray-200 p-2">
                <div className="flex gap-2 overflow-x-auto">
                  {[
                    { id: 'capsules', label: t.dashboard.boutique.categories.capsules },
                    { id: 'analyse-financiere', label: t.dashboard.boutique.categories.analysis },
                    { id: 'pack', label: t.dashboard.boutique.categories.pack },
                    { id: 'ebook', label: t.dashboard.boutique.categories.ebook, badge: hasEbookProducts ? undefined : t.dashboard.boutique.comingSoon },
                    { id: 'abonnement', label: t.dashboard.boutique.categories.subscription, badge: hasAbonnementProducts ? undefined : t.dashboard.boutique.comingSoon },
                    { id: 'coaching', label: t.dashboard.boutique.categories.coaching },
                    { id: 'masterclass', label: t.dashboard.boutique.categories.masterclass }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryAchats(cat.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                        selectedCategoryAchats === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className={selectedCategoryAchats === cat.id ? 'text-white' : ''}>{cat.label}</span>
                      {cat.badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          selectedCategoryAchats === cat.id 
                            ? 'bg-yellow-400 text-yellow-900' 
                            : 'bg-yellow-400 text-yellow-900'
                        }`}>
                          {cat.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchFormations}
                    onChange={(e) => setSearchFormations(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t.dashboard.purchases.searchPlaceholder}
                  />
                  {searchFormations && (
                    <button
                      onClick={() => setSearchFormations('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {searchFormations && (
                  <p className="mt-2 text-sm text-gray-600">
                    {filteredFormationsBySearch.length} {filteredFormationsBySearch.length > 1 ? t.dashboard.purchases.searchResultsPlural : t.dashboard.purchases.searchResults}
                  </p>
                )}
              </div>

              {filteredFormationsBySearch.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-lg bg-gray-100 mb-6">
                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchFormations ? 'Aucun achat trouvé' : 'Aucun achat pour le moment'}
                  </h3>
                  <p className="text-gray-600">
                    {searchFormations ? 'Essayez avec d\'autres mots-clés.' : 'Explorez la boutique pour découvrir nos produits disponibles.'}
                  </p>
                            </div>
              ) : (
                <div className="space-y-4">
                  {currentFormations.map((c) => {
                      // Pour analyse-financiere, utiliser AnalysisCard
                      const itemCategory = (c as any).category || 'capsules'
                      if (itemCategory === 'analyse-financiere') {
                        // Utiliser l'analyse passée dans l'objet c (une analyse par carte)
                        const analysis = (c as any).analysis || null
                        // Récupérer le statut de la commande pour Mobile Money
                        const orderStatus = (c as any).orderStatus || null
                        return (
                          <AnalysisCard
                            key={c.id || `analysis-${(c as any).analysisId}`}
                            item={c}
                            userAnalysis={analysis}
                            orderStatus={orderStatus}
                            onUploadSuccess={reloadAnalyses}
                          />
                        )
                      }

                      // Pour les autres produits, utiliser la carte normale
                      // Chercher la formation correspondante - essayer capsule_id d'abord, puis comparer les IDs
                      const formation = formationsData.find(f => {
                        // Vérifier si capsule_id correspond
                        if (f.capsule_id === c.id) return true
                        // Vérifier aussi si l'ID de la formation correspond à l'ID du produit/capsule
                        if (f.id === c.id) return true
                        return false
                      })
                      const formatDate = (dateStr: string) => {
                        if (!dateStr) return ''
                        const localeMap: { [key: string]: string } = {
                          'fr': 'fr-FR',
                          'en': 'en-US',
                          'es': 'es-ES',
                          'pt': 'pt-PT'
                        }
                        const locale = localeMap[language || 'fr'] || 'fr-FR'
                        return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
                      }
                      const formatTime = (timeStr: string) => {
                        if (!timeStr) return ''
                        return timeStr.substring(0, 5)
                      }
                      // Pour ebooks et packs, pas de statut de session (ils n'ont pas de sessions)
                      const isSubscriptionProduct = itemCategory === 'abonnement'
                      const hasNoSession = itemCategory === 'ebook' || itemCategory === 'pack' || isSubscriptionProduct
                      const isMasterclass = itemCategory === 'masterclass'
                      const isCoaching = itemCategory === 'coaching'
                      
                      const getStatus = (formation: any) => {
                        // Si c'est un ebook, pack ou analyse financière, pas de statut
                        if (hasNoSession) {
                          return null
                        }
                        if (!formation) return { label: t.dashboard.purchases.sessionStatus.planning, color: 'bg-gray-100 text-gray-800' }
                        // Si date ou heure sont null, la session est en cours de planification
                        if (!formation.date_scheduled || !formation.time_scheduled) {
                          return { label: t.dashboard.purchases.sessionStatus.planning, color: 'bg-gray-100 text-gray-800' }
                        }
                        try {
                          const now = new Date()
                          const sessionDate = new Date(`${formation.date_scheduled}T${formation.time_scheduled}`)
                          if (isNaN(sessionDate.getTime())) {
                            return { label: t.dashboard.purchases.sessionStatus.planning, color: 'bg-gray-100 text-gray-800' }
                          }
                          if (sessionDate < now) return { label: t.dashboard.purchases.sessionStatus.completed, color: 'bg-gray-100 text-gray-800' }
                          if (sessionDate.toDateString() === now.toDateString()) return { label: t.dashboard.purchases.sessionStatus.inProgress, color: 'bg-blue-100 text-blue-800' }
                          return { label: t.dashboard.purchases.sessionStatus.pending, color: 'bg-yellow-100 text-yellow-800' }
                        } catch {
                          return { label: t.dashboard.purchases.sessionStatus.planning, color: 'bg-gray-100 text-gray-800' }
                        }
                      }
                      const status = getStatus(formation)
                      
                      // Vérifier si c'est "Diagnostic Finance Express"
                      const isDiagnosticFinanceExpress = c.title && (
                        c.title.toLowerCase().includes('diagnostic') && 
                        c.title.toLowerCase().includes('finance') && 
                        c.title.toLowerCase().includes('express')
                      )
                      
                      return (
                        <div key={c.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="p-6">
                            <div className="flex items-start gap-4">
                              {/* Thumbnail */}
                              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={c.img}
                                  alt={c.title}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{c.title}</h3>
                                {/* Badge pour commandes en attente de validation */}
                                {(c as any).orderStatus && (c as any).orderStatus.status === 'pending_review' && (
                                  <div className="mb-2">
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                      {t.dashboard.purchases.pendingValidation}
                                    </span>
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 mb-3">{c.blurb}</p>
                                
                                {/* Session info - pour capsules, masterclass et coaching avec sessions */}
                                {!hasNoSession && (isMasterclass || !isCoaching) && formation && formation.date_scheduled && formation.time_scheduled && (
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-gray-700 font-medium">{formatDate(formation.date_scheduled)} {t.dashboard.purchases.sessionStatus.at} {formatTime(formation.time_scheduled)}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Status - seulement pour capsules avec sessions, masquer si commande en attente ou si le message est déjà affiché en bas */}
                                {status && !hasNoSession && !((c as any).orderStatus && (c as any).orderStatus.status === 'pending_review') && status.label !== t.dashboard.purchases.sessionStatus.planning && (
                                  <div className="mb-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                                      {status.label}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Button ou PDF pour ebook */}
                                {(c as any).category === 'ebook' && (c as any).pdfUrl ? (
                                  // Vérifier si la commande est en attente de validation
                                  (c as any).orderStatus && (c as any).orderStatus.status === 'pending_review' ? (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      {t.dashboard.purchases.downloadPdf}
                                    </span>
                                  ) : (
                                    <a
                                      href={(c as any).pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      {t.dashboard.purchases.downloadPdf}
                                    </a>
                                  )
                                ) : isSubscriptionProduct ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('profil')
                                      if (typeof window !== 'undefined') {
                                        requestAnimationFrame(() => {
                                          document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                        })
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#012F4E] text-white rounded-lg hover:bg-[#023d68] transition-colors font-medium"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 018 17h8a4 4 0 012.879 1.196M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {t.dashboard.subscription?.manageButton || 'Gérer mon abonnement'}
                                  </button>
                                ) : hasNoSession ? (
                                  // Pour packs et autres produits sans session
                                  // Ne pas afficher de message si la commande est en attente (le badge en haut suffit)
                                  !((c as any).orderStatus && (c as any).orderStatus.status === 'pending_review') && (
                                  <div className="text-sm text-gray-600 italic">
                                      {t.dashboard.purchases.purchaseConfirmed}
                                  </div>
                                  )
                                ) : isCoaching ? (
                                  // Pour Coaching : utiliser calendly_link
                                  // Vérifier si la commande est en attente de validation
                                  (c as any).orderStatus && (c as any).orderStatus.status === 'pending_review' ? (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {t.dashboard.purchases.takeAppointment || 'Prendre rendez-vous'}
                                    </span>
                                  ) : formation && formation.calendly_link ? (
                                    <a
                                      href={formation.calendly_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {t.dashboard.purchases.takeAppointment || 'Prendre rendez-vous'}
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium">
                                      {t.dashboard.purchases.appointmentNotConfigured || 'Rendez-vous en cours de configuration'}
                                    </span>
                                  )
                                ) : isDiagnosticFinanceExpress ? (
                                  // Pour Diagnostic Finance Express : utiliser calendly_link
                                  formation && formation.calendly_link ? (
                                    <a
                                      href={formation.calendly_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      Prendre rdv avec Myriam
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium">
                                      En attente de configuration
                                    </span>
                                  )
                                ) : isMasterclass ? (
                                  // Pour Masterclass : utiliser zoom_link avec date/heure
                                  formation && formation.zoom_link && formation.date_scheduled && formation.time_scheduled ? (
                                    <a
                                      href={formation.zoom_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      {t.dashboard.purchases.accessZoom || 'Accéder au Zoom'}
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium">
                                      {t.dashboard.purchases.zoomNotScheduled || 'Session Zoom en cours de planification'}
                                    </span>
                                  )
                                ) : formation && formation.zoom_link && formation.date_scheduled && formation.time_scheduled && status && status.label !== t.dashboard.purchases.sessionStatus.completed ? (
                                  <a
                                    href={formation.zoom_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    {t.dashboard.purchases.participate}
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium">
                                    {status && status.label === 'Terminée' ? t.dashboard.purchases.sessionStatus.completed : t.dashboard.purchases.sessionStatus.planning}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {/* Pagination Formations */}
              {totalPagesFormations > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPageFormations(prev => Math.max(1, prev - 1))}
                      disabled={currentPageFormations === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.dashboard.pagination.previous}
                    </button>
                    <button
                      onClick={() => setCurrentPageFormations(prev => Math.min(totalPagesFormations, prev + 1))}
                      disabled={currentPageFormations === totalPagesFormations}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.dashboard.pagination.next}
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        {t.dashboard.pagination.showing} <span className="font-medium">{startIndexFormations + 1}</span> {t.dashboard.pagination.to}{' '}
                        <span className="font-medium">{Math.min(endIndexFormations, filteredFormationsBySearch.length)}</span> {t.dashboard.pagination.of}{' '}
                        <span className="font-medium">{filteredFormationsBySearch.length}</span> {filteredFormationsBySearch.length > 1 ? t.dashboard.pagination.purchases : t.dashboard.purchases.searchResults}
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageFormations(prev => Math.max(1, prev - 1))}
                          disabled={currentPageFormations === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Précédent</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {t.dashboard.pagination.page} {currentPageFormations} {t.dashboard.pagination.on} {totalPagesFormations}
                        </span>
                        <button
                          onClick={() => setCurrentPageFormations(prev => Math.min(totalPagesFormations, prev + 1))}
                          disabled={currentPageFormations === totalPagesFormations}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Suivant</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenu de l'onglet "Profil" */}
          {activeTab === 'profil' && (
            <div className="space-y-6" id="profile-section">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t.dashboard.profile?.title || 'Mon profil'}
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    {t.dashboard.profile?.subtitle || 'Mettez à jour vos informations personnelles et vos coordonnées.'}
                  </p>
        </div>
      </div>

              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.dashboard.profile?.infoTitle || 'Informations personnelles'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t.dashboard.profile?.form?.firstName || 'Prénom'}
                    </label>
                    <input
                      type="text"
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t.dashboard.profile?.form?.lastName || 'Nom'}
                    </label>
                    <input
                      type="text"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t.dashboard.profile?.form?.email || 'Adresse e-mail'}
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {t.dashboard.profile?.form?.phone || 'Téléphone'}
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+33 X XX XX XX XX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1 1 0 01-1.414 0L6.343 16.657A8 8 0 1117.657 16.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t.dashboard.profile?.form?.country || 'Pays'}
                    </label>
                    <input
                      type="text"
                      value={profileCountry}
                      onChange={(e) => setProfileCountry(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="France"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1 1 0 01-1.414 0L6.343 16.657A8 8 0 1117.657 16.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t.dashboard.profile?.form?.city || 'Ville'}
                    </label>
                    <input
                      type="text"
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paris"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.866 0-7 1.567-7 3.5V15h14v-3.5C19 9.567 15.866 8 12 8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8V6a2 2 0 10-4 0v2m4 0a2 2 0 114 0v2M5 15h14v6H5z" />
                    </svg>
                    {t.dashboard.profile?.form?.profession || 'Profession'}
                  </label>
                  <input
                    type="text"
                    value={profileProfession}
                    onChange={(e) => setProfileProfession(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre profession"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileSaving && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3.536-3.536A8 8 0 114 12z"></path>
                      </svg>
                    )}
                    {profileSaving
                      ? t.dashboard.profile?.saving || 'Enregistrement...'
                      : t.dashboard.profile?.saveButton || 'Enregistrer'}
                  </button>
                </div>
              </form>

          {subscription && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.dashboard.subscription?.manageButton || 'Gérer mon abonnement'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subscriptionActionLoading
                      ? t.dashboard.subscription?.checkoutLoading || 'Redirection...'
                      : t.dashboard.subscription?.accessSummary || 'Gérez votre abonnement Sagesse de Salomon.'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    subscription.status === 'canceled'
                      ? 'bg-red-100 text-red-700'
                      : subscription.status === 'past_due'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {subscription.status === 'canceled'
                    ? t.dashboard.subscription?.statusCanceled || 'Abonnement arrêté'
                    : subscription.status === 'past_due'
                      ? t.dashboard.subscription?.statusPastDue || 'Paiement en attente'
                      : subscription.cancel_at_period_end
                        ? t.dashboard.subscription?.suspendButton || 'Suspendu'
                        : t.dashboard.subscription?.statusActive || 'Abonnement actif'}
                </span>
              </div>

              <div className="text-sm text-gray-700 space-y-1">
                {hasSubscriptionEndEstimate && !subscription.cancel_at_period_end && (
                  <p>
                    <span className="font-medium">{t.dashboard.subscription?.nextRenewal || 'Prochain renouvellement'} :</span>{' '}
                    {subscriptionEndLabel}
                  </p>
                )}
                {subscription.cancel_at_period_end && subscription.grace_until && (
                  <p>
                    <span className="font-medium">{t.dashboard.subscription?.graceUntil || 'Accès disponible jusqu’au'} :</span>{' '}
                    {formatDateFromISO(subscription.grace_until)}
                  </p>
                )}
                {subscription.status === 'canceled' && subscription.grace_until && (
                  <p className="text-gray-600">
                    {t.dashboard.subscription?.cancelledInfo || 'Votre abonnement est arrêté. Relancez-le quand vous voulez.'}
                  </p>
                )}
              </div>

              {subscriptionActionMessage && (
                <div
                  className={`text-sm px-4 py-2 rounded-lg border ${
                    subscriptionActionMessage.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {subscriptionActionMessage.text}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {!subscription.cancel_at_period_end && subscription.status !== 'canceled' && (
                  <button
                    type="button"
                    onClick={() =>
                      setSubscriptionConfirm({
                        action: 'cancel_period_end',
                        dateLabel: formatDateFromISO(subscription.grace_until || subscriptionEndISO) || subscriptionEndLabel
                      })
                    }
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-yellow-300 text-yellow-800 hover:bg-yellow-50 transition-colors"
                  >
                      {t.dashboard.subscription?.terminateButton || "Résiliez l'abonnement"}
                  </button>
                )}

                {subscription.cancel_at_period_end && subscription.status !== 'canceled' && (
                  <button
                    type="button"
                    onClick={() => handleSubscriptionAction('resume')}
                    disabled={subscriptionActionLoading !== null}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {subscriptionActionLoading === 'resume' && (
                      <svg className="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3.536-3.536A8 8 0 114 12z"></path>
                      </svg>
                    )}
                    {t.dashboard.subscription?.resumeButton || 'Relancer l’abonnement'}
                  </button>
                )}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      </div>

      {subscriptionConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h4 className="text-xl font-semibold text-gray-900">
              {t.dashboard.subscription?.confirmTitle || 'Vous partez déjà ?'}
            </h4>
            <p className="text-gray-700">
              {(t.dashboard.subscription?.confirmDescription ||
                'Vous continuez à bénéficier de l’abonnement jusqu’au {date}. Vous pourrez le relancer quand vous voulez.')
                .replace('{date}', subscriptionConfirm.dateLabel || '')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSubscriptionConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t.dashboard.subscription?.confirmCancel || 'Annuler'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = subscriptionConfirm.action
                  setSubscriptionConfirm(null)
                  handleSubscriptionAction(action)
                }}
                disabled={subscriptionActionLoading !== null}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#012F4E] text-white hover:bg-[#023d68] transition-colors disabled:opacity-50"
              >
                {subscriptionActionLoading === 'cancel_period_end' && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3.536-3.536A8 8 0 114 12z"></path>
                  </svg>
                )}
                {t.dashboard.subscription?.confirmAction || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {subscriptionMobileModalOpen && subscriptionMobileOrderId && subscriptionMobileCartItems.length > 0 && (
        <ModalOMWave
          isOpen={subscriptionMobileModalOpen}
          onClose={handleCloseSubscriptionMobileModal}
          orderId={subscriptionMobileOrderId}
          cartItems={subscriptionMobileCartItems}
          productName={subscriptionMobileProductName}
          amountEUR={subscriptionMobileAmountEUR}
          amountFCFA={subscriptionMobileAmountFCFA}
        />
      )}

      {/* Bouton WhatsApp flottant */}
      <div className="fixed bottom-6 right-6 z-50 whatsapp-container">
        {/* Popup flottant */}
        {showWhatsAppPopup && (
          <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 mb-2">
                  {t.dashboard.whatsAppPopup.text}
                </p>
                <p className="text-xs text-gray-600 mb-3 italic">
                  {t.dashboard.whatsAppPopup.bugReport || 'Vous constatez un bug ou un problème ? Signalez-le nous !'}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowWhatsAppPopup(false)}
                    className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    {t.dashboard.whatsAppPopup.cancel}
                  </button>
                  <button
                    onClick={handleWhatsAppConfirm}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                  >
                    {t.dashboard.whatsAppPopup.confirm}
                  </button>
                </div>
              </div>
            </div>
            {/* Flèche vers le bouton */}
            <div className="absolute bottom-0 right-4 transform translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
            </div>
          </div>
        )}
        
        {/* Bouton WhatsApp */}
        <button
          onClick={handleWhatsAppClick}
          className="flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          title="Contactez-nous sur WhatsApp"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
        </button>
      </div>

      {/* Onboarding */}
      <DashboardOnboarding userId={user?.id || null} />
      {hasPremiumAccess && <PostSubscriptionOnboarding userId={user?.id || null} />}

      {/* Pop-up Carrousel pour utilisateurs avec abonnement */}
      {/* 
        Le carrousel s'affiche :
        - Après les onboarding pour les nouveaux utilisateurs
        - À chaque nouvelle connexion (session) tant qu'il reste des items non achetés
        - L'API filtre automatiquement les items déjà achetés
        - Si carouselItems.length > 0, c'est qu'il reste des produits à découvrir
      */}
      {showCarousel && hasPremiumAccess && carouselItems.length > 0 && (
        <CarouselPopup
          items={carouselItems}
          onClose={handleCarouselClose}
          title="Nouveautés dans votre boutique"
        />
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  )
}
