'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase'
import { analysisService, type AnalysisRecord, capsulesService } from '@/lib/database'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'
import { useCart } from '@/lib/CartContext'
import LanguageSwitch from '@/components/LanguageSwitch'
import LegalModal from '@/components/LegalModal'

export default function DashboardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { cartItems, addToCart, removeFromCart, getSubtotal } = useCart()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([])
  const [activeTab, setActiveTab] = useState<'analyses' | 'boutique' | 'formations'>('analyses')
  const [availableCapsules] = useState(() => ([
    {
      id: 'capsule1',
      title: "L'éducation financière",
      img: '/images/logo/capsule1.jpg',
      blurb: "Tout ce qu'il faut savoir sur l'argent et la gestion."
    },
    {
      id: 'capsule2',
      title: 'Les combats liés à la prospérité',
      img: '/images/logo/capsule2.jpg',
      blurb: 'Identifier et vaincre les résistances à la prospérité.'
    },
    {
      id: 'capsule3',
      title: "Les lois spirituelles liées à l'argent",
      img: '/images/logo/capsule3.jpg',
      blurb: 'Principes et lois qui gouvernent la prospérité.'
    },
    {
      id: 'capsule4',
      title: 'La mentalité de Pauvre',
      img: '/images/logo/capsule4.jpg',
      blurb: 'Briser les limites intérieures et changer de mindset.'
    },
    {
      id: 'capsule5',
      title: 'Épargne et Investissement',
      img: '/images/logo/capsule5.jpg',
      blurb: "Faire fructifier ton argent et préparer l'avenir."
    }
  ]))
  
  // Capsules pour la boutique avec prix
  const boutiqueCapsules = [
    {
      id: 'capsule1',
      title: "L'Éducation financière",
      img: '/images/logo/capsule1.jpg',
      blurb: "Apprenez à maîtriser votre budget, comprendre vos dépenses et poser les fondations d'une stabilité durable.",
      price: 350,
      isPack: false
    },
    {
      id: 'capsule2',
      title: 'La Mentalité de la pauvreté',
      img: '/images/logo/capsule2.jpg',
      blurb: "Identifiez et brisez les blocages mentaux qui sabotent votre relation avec l'argent.",
      price: 350,
      isPack: false
    },
    {
      id: 'capsule3',
      title: "Les Lois spirituelles liées à l'argent",
      img: '/images/logo/capsule3.jpg',
      blurb: 'Découvrez les principes divins qui gouvernent la prospérité et la bénédiction financière.',
      price: 350,
      isPack: false
    },
    {
      id: 'capsule4',
      title: 'Les Combats liés à la prospérité',
      img: '/images/logo/capsule4.jpg',
      blurb: 'Apprenez à reconnaître et vaincre les résistances spirituelles à votre épanouissement.',
      price: 350,
      isPack: false
    },
    {
      id: 'capsule5',
      title: 'Épargne & Investissement',
      img: '/images/logo/capsule5.jpg',
      blurb: 'Apprenez à épargner intelligemment et à faire fructifier vos ressources avec sagesse.',
      price: 350,
      isPack: false
    },
    {
      id: 'pack',
      title: 'Pack complet Cash360',
      img: '/images/pack.png',
      blurb: "Accédez à l'ensemble des 5 capsules pour une transformation complète.",
      price: 1500,
      originalPrice: 1750,
      isPack: true
    },
    {
      id: 'analyse-financiere',
      title: 'Analyse financière personnalisée',
      img: '/images/pack.png', // TODO: changer l'image
      blurb: 'Analyse approfondie de votre situation financière avec recommandations personnalisées.',
      price: 39.99,
      isPack: false
    }
  ]
  const [selectedCapsules, setSelectedCapsules] = useState<string[]>([])
  const [userCapsules, setUserCapsules] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [hasPaidAnalysis, setHasPaidAnalysis] = useState(false)
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'legal' | 'terms'>('privacy')
  const [showCartDropdown, setShowCartDropdown] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const analysesPerPage = 2
  
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

  // Fonction pour extraire un prénom depuis l'email
  const getFirstNameFromEmail = (email: string | undefined): string => {
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

  // Calculs de pagination
  const totalPages = Math.ceil(analyses.length / analysesPerPage)
  const startIndex = (currentPage - 1) * analysesPerPage
  const endIndex = startIndex + analysesPerPage
  const currentAnalyses = analyses.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    setMounted(true)
    // Initialiser Supabase côté client uniquement
    setSupabase(createClientBrowser())
  }, [])

  useEffect(() => {
    if (!supabase) return
    
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
          setAnalyses(userAnalyses as AnalysisRecord[])
        }
        // Charger capsules utilisateur
        const myCaps = await capsulesService.getUserCapsules().catch(() => [])
        setUserCapsules(Array.isArray(myCaps) ? myCaps.map((c: any) => c.capsule_id) : [])
        
        // Vérifier si l'utilisateur a payé l'analyse financière
        const { data: paymentAnalysis } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', 'analyse-financiere')
          .eq('status', 'success')
          .limit(1)
        setHasPaidAnalysis(!!(paymentAnalysis && paymentAnalysis.length > 0))
      } catch (e) {
        console.error('Erreur init dashboard:', e)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [supabase, router])

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

    // Gérer l'ouverture des modals légaux
    const handleLegalModal = (event: CustomEvent) => {
      const type = event.detail.type as 'privacy' | 'legal' | 'terms'
      setLegalModalType(type)
      setLegalModalOpen(true)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('openLegalModal', handleLegalModal as EventListener)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('openLegalModal', handleLegalModal as EventListener)
    }
  }, [showUserMenu, showWhatsAppPopup, showCartDropdown])

  const loadAnalyses = async () => {
    try {
      const userAnalyses = await analysisService.getAnalysesByUser()
      setAnalyses(userAnalyses)
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error)
      // En cas d'erreur, on affiche un message mais on ne bloque pas l'interface
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleNewAnalysis = () => {
    if (!hasPaidAnalysis) {
      // Rediriger vers la boutique pour acheter l'analyse
      setActiveTab('boutique')
      // Scroll vers la carte analyse financière
      setTimeout(() => {
        const element = document.getElementById('analyse-financiere-card')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }
    router.push('/analyse-financiere')
  }





  const hasCompletedAnalysisWithPdf = analyses.some(a => a.status === 'terminee' && !!a.pdf_url)

  const toggleCapsule = (id: string) => {
    setSelectedCapsules(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleAddCapsules = async () => {
    if (selectedCapsules.length === 0) return
    const ok = await capsulesService.addUserCapsules(selectedCapsules)
    if (ok) {
      const myCaps = await capsulesService.getUserCapsules().catch(() => [])
      setUserCapsules(Array.isArray(myCaps) ? myCaps.map((c: any) => c.capsule_id) : [])
      setSelectedCapsules([])
      alert('Ajouté à mes formations')
    } else {
      alert("Impossible d'ajouter les capsules pour le moment")
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours':
        return t.dashboard.status.inProgress
      case 'en_analyse':
        return t.dashboard.status.analyzing
      case 'terminee':
        return t.dashboard.status.completed
      default:
        return t.dashboard.status.unknown
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-800'
      case 'en_analyse':
        return 'bg-blue-100 text-blue-800'
      case 'terminee':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
                  <div className="relative cart-container">
                    <button
                      onClick={() => setShowCartDropdown(!showCartDropdown)}
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
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[10000] animate-fadeIn">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <h3 className="font-bold text-[#012F4E]" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>
                            Mon panier
                          </h3>
                        </div>

                        {/* Liste des articles */}
                        <div className="max-h-64 overflow-y-auto">
                          {cartItems.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                              Votre panier est vide
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
                                    <p className="text-sm text-gray-600">Qté: {item.quantity}</p>
                                    <p className="text-sm font-bold text-[#012F4E]">{(item.price * item.quantity).toFixed(2)} €</p>
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
                              <span className="text-sm text-gray-600">Sous-total :</span>
                              <span className="text-base font-bold text-[#012F4E]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                                {getSubtotal().toFixed(2)} €
                              </span>
                            </div>

                            {/* Bouton "Voir le panier" */}
                            <button
                              onClick={handleViewCart}
                              className="w-full px-4 py-2 bg-[#00A1C6] text-white rounded-lg font-medium hover:bg-[#FEBE02] transition-colors"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            >
                              Voir le panier
                            </button>

                            {/* Lien "Continuer vos achats" */}
                            <button
                              onClick={() => setShowCartDropdown(false)}
                              className="w-full text-sm text-[#012F4E] hover:underline transition-colors"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            >
                              Continuer vos achats
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
                <h3 className="text-lg font-semibold text-green-900 mb-1">Paiement effectué avec succès !</h3>
                <p className="text-green-800">Vos capsules sont maintenant disponibles dans l'onglet "Mes Formations".</p>
              </div>
            </div>
          )}

          {/* En-tête d'accueil */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bonjour, {getFirstNameFromEmail(user?.email)} 👋
            </h1>
            <p className="text-gray-600">
              Découvrez votre tableau de bord et gérez toutes vos activités en un seul endroit.
            </p>
          </div>

          {/* Onglets de navigation */}
          <div className="mb-8 flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('analyses')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'analyses'
                  ? 'bg-blue-600 text-white rounded-t-lg shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              >
              Mes Analyses
              </button>
              <button
              onClick={() => setActiveTab('boutique')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'boutique'
                  ? 'bg-blue-600 text-white rounded-t-lg shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Boutique
              </button>
              <button
                onClick={() => setActiveTab('formations')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'formations'
                  ? 'bg-blue-600 text-white rounded-t-lg shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              >
              Mes Formations
              </button>
            </div>

          {/* Contenu de l'onglet "Mes Analyses" */}
          {activeTab === 'analyses' && (
            <div className="space-y-6">
              {/* Titre et description de la section */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
          </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Mes Analyses</h2>
                  <p className="text-gray-600">Retrouvez ici toutes vos analyses financières réalisées avec Cash360.</p>
                      </div>
                      </div>

              {/* Carte "Faire une nouvelle analyse" */}
              <div className="bg-yellow-400 rounded-2xl p-8 mb-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Faire une nouvelle analyse</h3>
                  <p className="text-gray-700 mb-6 max-w-md">
                    Téléversez vos relevés et recevez votre diagnostic sous 48h.
                  </p>
                          <button
                    onClick={handleNewAnalysis}
                    disabled={!hasPaidAnalysis}
                    className={`px-6 py-3 rounded-lg transition-colors font-medium shadow-lg flex items-center gap-2 mx-auto ${
                      hasPaidAnalysis
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-gray-700 cursor-not-allowed relative'
                    }`}
                          >
                    <span>Lancer une nouvelle analyse</span>
                    {!hasPaidAnalysis && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                          </button>
                          {!hasPaidAnalysis && (
                            <p className="text-sm text-gray-800 mt-3 font-medium">
                              Achetez l'analyse dans la boutique pour débloquer cette fonctionnalité
                            </p>
                          )}
                      </div>
                    </div>
            
            {/* Liste des analyses */}
            {analyses.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
                    {/* En-tête de la carte */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Analyse du {new Date(analysis.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-full ${analysis.status === 'terminee' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {analysis.status === 'terminee' ? 'Terminée' : 'En cours'}
                        </span>
              </div>
                      <p className="text-sm text-gray-600">
                        {analysis.status === 'terminee' 
                          ? 'Analyse de vos 3 relevés bancaires – rapport disponible.'
                          : 'Traitement en cours de vos relevés bancaires.'
                        }
                      </p>
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex gap-3">
                      {analysis.status === 'terminee' && analysis.pdf_url ? (
                        <>
                <button
                            onClick={() => window.open(analysis.pdf_url, '_blank')}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Télécharger PDF
                </button>
                  <button
                            onClick={handleNewAnalysis}
                            className="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                            Refaire une analyse
                  </button>
                        </>
                      ) : (
                        <>
                            <button
                            disabled
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            En traitement
                            </button>
                          <button
                            onClick={handleNewAnalysis}
                            className="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                          >
                            Refaire une analyse
                          </button>
                        </>
                      )}
                        </div>
                      </div>
                  ))}
                </div>
              )}
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
                  <h2 className="text-2xl font-bold text-gray-900">Boutique</h2>
                  <p className="text-gray-600">Découvrez les 7 produits exclusifs Cash360 pour transformer votre vie financière et spirituelle.</p>
                    </div>
                  </div>

              {/* Grille des capsules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boutiqueCapsules.map((capsule) => (
                  <div key={capsule.id} id={capsule.id === 'analyse-financiere' ? 'analyse-financiere-card' : undefined} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
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
                        {capsule.isPack && capsule.originalPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">{capsule.price.toFixed(2)} €</span>
                            <span className="text-sm text-gray-400 line-through">{capsule.originalPrice.toFixed(2)} €</span>
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">-15%</span>
                        </div>
                        ) : (
                          <span className="text-lg font-bold text-blue-600">{capsule.price.toFixed(2)} €</span>
                        )}
                      </div>

                      {/* Bouton d'achat */}
                      <button
                        onClick={() => {
                          addToCart({
                            id: capsule.id,
                            title: capsule.title,
                            img: capsule.img,
                            price: capsule.price
                          })
                          setShowCartDropdown(true)
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        {capsule.isPack ? 'Acheter le pack' : 'Acheter'}
                      </button>
                        </div>
                        </div>
                ))}
                      </div>
                    </div>
          )}

          {/* Contenu de l'onglet "Mes Formations" */}
          {activeTab === 'formations' && (
            <div className="space-y-6">
              {/* Titre et description de la section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                        </div>
                  <h2 className="text-2xl font-bold text-gray-900">Mes Formations</h2>
                        </div>
                <p className="text-gray-600">Accédez à vos formations à venir ou passées et rejoignez-les en un clic.</p>
                      </div>

              {userCapsules.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-lg bg-gray-100 mb-6">
                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune formation pour le moment</h3>
                  <p className="text-gray-600">Explorez la boutique pour découvrir nos formations disponibles.</p>
                            </div>
              ) : (
                <div className="space-y-4">
                  {availableCapsules
                    .filter(c => userCapsules.includes(c.id))
                    .map((c, index) => (
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
                              <p className="text-sm text-gray-600">{c.blurb}</p>
                          </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Legal Modal */}
      <LegalModal 
        isOpen={legalModalOpen} 
        onClose={() => setLegalModalOpen(false)} 
        type={legalModalType} 
      />
    </div>
  )
}
