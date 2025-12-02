'use client'

// Page Tableau de bord Cash360 (V1 statique, à connecter aux données utilisateur plus tard)
// NAV NOTE: La navigation principale (onglets Tableau de bord, Boutique, Mes achats, Profil) et les sections associées sont toutes gérées dans ce fichier. Les sous-routes comme /dashboard/settings restent indépendantes.

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase'
import { analysisService, type AnalysisRecord, capsulesService } from '@/lib/database'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'
import { useCart } from '@/lib/CartContext'
import { useCurrency } from '@/lib/CurrencyContext'
import LanguageSwitch from '@/components/LanguageSwitch'
import CurrencySelector from '@/components/CurrencySelector'
import AnalysisCard from '@/components/AnalysisCard'
import DashboardOnboarding from '@/components/DashboardOnboarding'
import BudgetTracker, { type BudgetSnapshot } from '@/components/dashboard/BudgetTracker'

function DashboardPageContent() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cartItems, addToCart, removeFromCart, getSubtotal } = useCart()
  const { format: formatPrice, currency: currentCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userAnalyses, setUserAnalyses] = useState<AnalysisRecord[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'boutique' | 'formations' | 'profil' | 'budget'>('overview')
  
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

  const refreshBudgetSnapshot = useCallback(async () => {
    try {
      const response = await fetch('/api/budget', { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      setBudgetSnapshot(computeBudgetSnapshot(data))
    } catch (error) {
      console.error('Failed to load budget snapshot', error)
    }
  }, [computeBudgetSnapshot])

  useEffect(() => {
    refreshBudgetSnapshot()
  }, [refreshBudgetSnapshot])

  useEffect(() => {
    if (activeTab === 'overview' && budgetSnapshot) {
      refreshBudgetSnapshot()
    }
  }, [activeTab, budgetSnapshot, refreshBudgetSnapshot])

  const handleBudgetChange = useCallback((snapshot: BudgetSnapshot) => {
    setBudgetSnapshot(snapshot)
  }, [])

  const summaryCards = useMemo(() => {
    const fallbackIncome = 1500
    const fallbackExpenses = 1050
    const incomeValue = budgetSnapshot?.monthlyIncome ?? fallbackIncome
    const expensesValue = budgetSnapshot?.totalExpenses ?? fallbackExpenses
    const savingsValue =
      budgetSnapshot?.remaining ?? incomeValue - expensesValue

    return [
      {
        label: t.dashboard.overview?.incomeLabel || 'Revenu du mois',
        value: formatPrice(incomeValue)
      },
      {
        label: t.dashboard.overview?.expensesLabel || 'Dépenses',
        value: formatPrice(expensesValue)
      },
      {
        label: t.dashboard.overview?.savingsLabel || 'Épargne',
        value: formatPrice(savingsValue)
      }
    ]
  }, [budgetSnapshot, formatPrice, t.dashboard.overview])

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

    const latestAnalysis = userAnalyses[0]
    if (latestAnalysis) {
      const statusKey = latestAnalysis.status as keyof (typeof t.dashboard.analysis)['status']
      const statusLabel =
        t.dashboard.analysis?.status?.[statusKey] || latestAnalysis.status

      items.push({
        key: 'analysis',
        title: t.dashboard.overview?.analysisInsightTitle || 'Analyse financière',
        description: t.dashboard.overview?.analysisInsightActive || 'Une analyse est actuellement en cours.',
        status: statusLabel,
        accent: 'text-blue-600'
      })
    } else {
      items.push({
        key: 'analysis',
        title: t.dashboard.overview?.analysisInsightTitle || 'Analyse financière',
        description: t.dashboard.overview?.analysisInsightEmpty || 'Lancez une nouvelle analyse pour obtenir un diagnostic.',
        status: '—',
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
  }, [budgetSnapshot, formatPrice, t, userAnalyses, userCapsules])
  
  // Pagination
  const [currentPageBoutique, setCurrentPageBoutique] = useState(1)
  const [currentPageFormations, setCurrentPageFormations] = useState(1)
  const itemsPerPage = 6
  const formationsPerPage = 3
  
  const [supabase, setSupabase] = useState<any>(null)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

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
    
    // Ensuite, traiter les autres produits (en excluant analyse-financiere de userCapsules)
    const otherCapsules = (userCapsules || []).filter((id: string) => id !== 'analyse-financiere')
    
    if (otherCapsules.length > 0) {
      for (const capsuleId of otherCapsules) {
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
    
    return result
  }, [userCapsules, allProducts, availableCapsules, formationsData, userOrders, userAnalyses])

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
          .select('id, product_id, status, payment_method, created_at, validated_at')
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
        }
      } catch (error) {
        console.error('Erreur rechargement périodique analyses/commandes:', error)
      }
    }, 10000) // Toutes les 10 secondes (au lieu de 30)
    
    return () => clearInterval(interval)
  }, [supabase, user])

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
              // Utiliser les traductions multilingues
              return {
                id: p.id,
                title: getProductName(p),
                img: p.image_url || '/images/pack.png',
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
            // Utiliser les traductions multilingues
            return {
              id: p.id,
              title: getProductName(p),
              img: p.image_url || '/images/pack.png',
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
          const orderProductIds = ordersData
            .map((o: any) => o.product_id)
            .filter((productId: string) => productId && productId !== 'abonnement')
          
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
        
        setUserCapsules(userCapsulesIds)
        console.log('[RAFRAÎCHISSEMENT] Capsules/Packs/Ebooks achetés après paiement:', userCapsulesIds)
        
        // Recharger aussi les produits pour mettre à jour filteredFormations
        const { data: allProductsData } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: true })
        
        if (allProductsData) {
          const allProductsForFormations = allProductsData.map((p: any) => {
            // Utiliser les traductions multilingues
            return {
              id: p.id,
              title: getProductName(p),
              img: p.image_url || '/images/pack.png',
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
            // Utiliser les traductions multilingues
            return {
              id: p.id,
              title: getProductName(p),
              img: p.image_url || '/images/pack.png',
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
                      onClick={() => setShowCartDropdown(!showCartDropdown)}
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
            {[
              { id: 'overview', label: t.dashboard.tabs.overview || 'Tableau de bord' },
              { id: 'budget', label: t.dashboard.tabs.budget || 'Budget & suivi' },
              { id: 'boutique', label: t.dashboard.tabs.boutique },
              { id: 'formations', label: t.dashboard.tabs.myPurchases },
              { id: 'profil', label: t.dashboard.tabs.profile || 'Profil' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'overview' | 'boutique' | 'formations' | 'budget' | 'profil')}
                className={`snap-start px-5 sm:px-6 py-3 font-medium transition-all rounded-t-lg whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900 bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

          {/* Contenu de l'onglet "Tableau de bord" */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
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
                  {summaryCards.map((card) => (
                    <div
                      key={card.label}
                      className="bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-4"
                    >
                      <p className="text-sm text-[#7CA7C0]">{card.label}</p>
                      <div className="flex items-baseline justify-between mt-2">
                        <p className="text-2xl font-semibold text-[#012F4E]">{card.value}</p>
                        <span className="text-xs text-[#00A1C6]">•</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('budget')}
                      className="w-full group rounded-2xl border border-[#00A1C6]/20 p-5 text-left bg-white hover:border-[#00A1C6] hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-[#012F4E] group-hover:text-[#00A1C6]">
                          {t.dashboard.overview?.primaryAction || 'Gérer mon budget'}
                        </h4>
                        <span className="text-sm text-[#00A1C6] group-hover:text-[#012F4E]">→</span>
                      </div>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700">
                        {/* TODO: connect to budget completion */}
                        Suivez vos dépenses en temps réel et optimisez chaque euro.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/defi-7-jours')}
                      className="w-full group rounded-2xl border border-amber-200 p-5 text-left bg-gradient-to-br from-amber-50 to-white hover:from-amber-100 hover:to-white transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-amber-900 group-hover:text-amber-950">
                          {t.dashboard.overview?.secondaryAction || 'Défi 7 jours'}
                        </h4>
                        <span className="text-sm text-amber-600 group-hover:text-amber-950">→</span>
                      </div>
                      <p className="text-sm text-amber-900/80 group-hover:text-amber-950">
                        {/* TODO: connect to challenge progress */}
                        Construisez votre discipline financière en un exercice par jour.
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
          {activeTab === 'budget' && (
            <div className="space-y-8">
              <BudgetTracker variant="embedded" onBudgetChange={handleBudgetChange} />
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
                    { id: 'abonnement', label: t.dashboard.boutique.categories.subscription, badge: hasAbonnementProducts ? undefined : t.dashboard.boutique.comingSoon }
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
                  <div key={`${capsule.id}-${currentCurrency}`} id={capsule.id === 'analyse-financiere' ? 'analyse-financiere-card' : undefined} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={capsule.img}
                        alt={capsule.title}
                        fill
                        className="object-cover"
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

                      {/* Bouton d'achat */}
                      {capsule.isOneTime && userCapsules.includes(capsule.id) ? (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t.dashboard.boutique.alreadyBought}
                        </button>
                      ) : (() => {
                        const capsuleCategory = (capsule as any).category || 'capsules'
                        const cartItem = cartItems.find(item => item.id === capsule.id)
                        const isInCart = cartItem !== undefined
                        
                        // Pour capsules/pack/ebook/abonnement : désactiver si déjà dans le panier (quantité = 1)
                        // Pour analyse-financiere : quantités illimitées, toujours activé
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
                              : (capsule.isPack ? t.dashboard.boutique.buyPack : t.dashboard.boutique.buy)
                            }
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
                    { id: 'abonnement', label: t.dashboard.boutique.categories.subscription, badge: hasAbonnementProducts ? undefined : t.dashboard.boutique.comingSoon }
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
                      const hasNoSession = itemCategory === 'ebook' || itemCategory === 'pack'
                      
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
                                
                                {/* Session info - seulement pour capsules avec sessions */}
                                {!hasNoSession && formation && formation.date_scheduled && formation.time_scheduled && (
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
                                ) : hasNoSession ? (
                                  // Pour packs et autres produits sans session
                                  // Ne pas afficher de message si la commande est en attente (le badge en haut suffit)
                                  !((c as any).orderStatus && (c as any).orderStatus.status === 'pending_review') && (
                                  <div className="text-sm text-gray-600 italic">
                                      {t.dashboard.purchases.purchaseConfirmed}
                                  </div>
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
            <div className="space-y-6">
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
            </div>
          )}
        </div>
      </div>

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
                <p className="text-sm text-gray-800 mb-3">
                  {t.dashboard.whatsAppPopup.text}
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
