'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase'
import { analysisService, type AnalysisRecord, capsulesService } from '@/lib/database'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'
import LanguageSwitch from '@/components/LanguageSwitch'

export default function DashboardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([])
  const [activeTab, setActiveTab] = useState<'analyses' | 'capsules'>('analyses')
  const [availableCapsules] = useState(() => ([
    { id: 'capsule1', title: "L’éducation financière" },
    { id: 'capsule2', title: 'Les combats liés à la prospérité' },
    { id: 'capsule3', title: 'Les lois spirituelles liées à l’argent' },
    { id: 'capsule4', title: 'La mentalité de Pauvre' },
    { id: 'capsule5', title: 'Épargne et Investissement' }
  ]))
  const [selectedCapsules, setSelectedCapsules] = useState<string[]>([])
  const [userCapsules, setUserCapsules] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const analysesPerPage = 2
  
  const supabase = createClientBrowser()

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
  }, [])

  useEffect(() => {
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
        // Charger les capsules de l'utilisateur
        const myCaps = await capsulesService.getUserCapsules().catch(() => [])
        setUserCapsules(Array.isArray(myCaps) ? myCaps.map((c: any) => c.capsule_id) : [])
      } catch (e) {
        console.error('Erreur init dashboard:', e)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [supabase.auth, router])

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
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu, showWhatsAppPopup])

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
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleNewAnalysis = () => {
    router.push('/analyse-financiere')
  }





  const handleWhatsAppClick = () => {
    setShowWhatsAppPopup(true)
  }

  const handleWhatsAppConfirm = () => {
    window.open('https://wa.me/33756848734', '_blank')
    setShowWhatsAppPopup(false)
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
      <div className="py-4 sm:py-8 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header du tableau de bord */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t.dashboard.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t.dashboard.subtitle}
            </p>
          </div>

          {/* Onglets Analyses/Capsules (affiché si analyse terminée avec PDF) */}
          {hasCompletedAnalysisWithPdf && (
            <div className="mb-4 flex gap-2 border-b border-gray-200">
              <button
                className={`px-4 py-2 -mb-px border-b-2 ${activeTab === 'analyses' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
                onClick={() => setActiveTab('analyses')}
              >
                Analyses
              </button>
              <button
                className={`px-4 py-2 -mb-px border-b-2 ${activeTab === 'capsules' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'}`}
                onClick={() => setActiveTab('capsules')}
              >
                Capsules
              </button>
            </div>
          )}

          {/* Bouton Nouvelle analyse */}
          <div className="mb-6 sm:mb-8">
            <button
              onClick={handleNewAnalysis}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">{t.dashboard.newAnalysis}</span>
              <span className="sm:hidden">{t.dashboard.newAnalysisShort}</span>
            </button>
          </div>

          {/* Capsules */}
          {activeTab === 'capsules' && hasCompletedAnalysisWithPdf && (
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0B1B2B] mb-4">Capsules disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCapsules.map((c) => (
                  <div key={c.id} className="bg-white rounded-lg border p-4 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCapsules.includes(c.id)}
                      onChange={() => toggleCapsule(c.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{c.title}</div>
                      {userCapsules.includes(c.id) && (
                        <div className="text-xs text-green-700 mt-1">Déjà dans mes formations</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={handleAddCapsules}
                  disabled={selectedCapsules.length === 0}
                  className="bg-[#D4AF37] text-[#0B1B2B] px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Ajouter à mes formations
                </button>
              </div>
            </div>
          )}

          {/* Liste des analyses */}
          {analyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t.dashboard.noAnalysisTitle}
              </h3>
              <p className="text-gray-600 mb-6">
                {t.dashboard.noAnalysisText}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleNewAnalysis}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {t.dashboard.createFirstAnalysis}
                </button>
                
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {currentAnalyses.map((analysis) => (
                <div key={analysis.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header de l'analyse */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <div>
                          <h3 className="text-base sm:text-lg font-medium text-gray-900">
                            {t.dashboard.analysisNumber}{analysis.ticket}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {t.dashboard.createdOn} {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`}>
                          {getStatusLabel(analysis.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenu de l'analyse */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4">
                    {/* Barre de progression */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {t.dashboard.progressLabel}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {analysis.status === 'terminee' ? '100%' : '70%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 sm:h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: analysis.status === 'terminee' ? '100%' : '70%' }}
                        ></div>
                      </div>
                    </div>

                    {/* Étapes de l'analyse */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold bg-blue-600 text-white">
                          ✓
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{t.dashboard.steps.reception}</p>
                          <p className="text-xs text-gray-600">{t.dashboard.steps.receptionDesc}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold bg-blue-600 text-white">
                          ✓
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{t.dashboard.steps.analysis}</p>
                          <p className="text-xs text-gray-600">{t.dashboard.steps.analysisDesc}</p>
                        </div>
                      </div>

                      <div className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg ${analysis.status === 'terminee' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${analysis.status === 'terminee' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                          {analysis.status === 'terminee' ? '✓' : '3'}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{t.dashboard.steps.report}</p>
                          <p className="text-xs text-gray-600">{t.dashboard.steps.reportDesc}</p>
                        </div>
                      </div>
                    </div>

                    {/* Informations détaillées */}
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">{t.dashboard.details}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">{t.dashboard.client} :</span>
                          <span className="ml-2 font-medium">{analysis.client_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.dashboard.emailLabel} :</span>
                          <span className="ml-2 font-medium">{analysis.client_email}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.dashboard.lastUpdate} :</span>
                          <span className="ml-2 font-medium">{new Date(analysis.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.dashboard.statusLabel} :</span>
                          <span className="ml-2 font-medium">{getStatusLabel(analysis.status)}</span>
                        </div>
                      </div>

                      {/* Section terminée */}
                      {analysis.status === 'terminee' && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                          {/* Message de succès */}
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">
                                {t.dashboard.completedTitle}
                              </h5>
                              <p className="text-xs text-gray-600">
                                {t.dashboard.completedText}
                              </p>
                            </div>
                          </div>

                          {/* Boutons d'action */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            {/* Bouton Télécharger PDF */}
                            {analysis.pdf_url && (
                              <button
                                onClick={() => {
                                  window.open(analysis.pdf_url, '_blank')
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t.dashboard.downloadPdf}
                              </button>
                            )}

                            {/* Bouton Prendre RDV */}
                            <button
                              onClick={() => {
                                window.open('https://calendly.com/cash360/le-debut-de-votre-liberte-financiere-clone', '_blank')
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {t.dashboard.bookAppointment}
                            </button>

                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {analyses.length > analysesPerPage && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                {/* Bouton Précédent */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.dashboard.pagination.previous}
                </button>

                {/* Numéros de page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Bouton Suivant */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.dashboard.pagination.next}
                </button>
              </div>
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
    </div>
  )
}
