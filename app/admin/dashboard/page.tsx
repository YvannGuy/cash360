'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'
import AdminPdfUploadModal from '@/components/AdminPdfUploadModal'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [formations, setFormations] = useState<any[]>([])
  const [paymentStats, setPaymentStats] = useState<any>({})
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const checkAdminSession = () => {
      const adminSessionData = localStorage.getItem('admin_session')
      const adminEmail = localStorage.getItem('admin_email')
      const adminRole = localStorage.getItem('admin_role')
      
      if (adminSessionData === 'true' && adminEmail) {
        setAdminSession({ isAdmin: true, email: adminEmail, role: adminRole as 'admin' | 'commercial' })
        // Rediriger les commerciaux vers leur page
        if (adminRole === 'commercial') {
          router.push('/admin/commercial-calls')
        }
      } else {
        router.push('/admin/login')
        return
      }
      setLoading(false)
    }
    
    checkAdminSession()
  }, [router])

  useEffect(() => {
    if (adminSession?.isAdmin) {
      loadAllAnalyses()
      loadAllUsers()
      loadPayments()
      loadFormations()
    }
  }, [adminSession])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAdminMenu) {
        const target = event.target as Element
        if (!target.closest('.admin-menu-container')) {
          setShowAdminMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAdminMenu])

  const loadAllAnalyses = async () => {
    try {
      const response = await fetch('/api/admin/analyses')
      const data = await response.json()
      
      if (data.success) {
        setAnalyses(data.analyses)
      } else {
        console.error('Erreur lors du chargement des analyses:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error)
    }
  }

  const loadAllUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
      } else {
        console.error('Erreur lors du chargement des utilisateurs:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/admin/paiements')
      const data = await response.json()
      
      if (data.success) {
        setPayments(data.payments || [])
        setPaymentStats(data.stats || {})
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error)
    }
  }

  const loadFormations = async () => {
    try {
      const response = await fetch('/api/admin/formations')
      const data = await response.json()
      
      if (data.success) {
        setFormations(data.formations || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_email')
    router.push('/admin/login')
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'En cours'
      case 'en_analyse':
        return 'En analyse'
      case 'terminee':
        return 'Terminée'
      default:
        return 'Inconnu'
    }
  }

  const getStatusBadgeColor = (status: string) => {
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

  const getInitials = (email?: string) => {
    if (!email) return 'A'
    const parts = email.split('@')[0]
    return parts.substring(0, 2).toUpperCase()
  }

  const handleUpdateStatus = async (analysisId: string, newStatus: string, newProgress: number) => {
    try {
      const response = await fetch('/api/admin/analyses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisId,
          progress: newProgress,
          status: newStatus
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAnalyses(prev => prev.map(a => 
          a.id === analysisId 
            ? { ...a, status: newStatus as any, progress: newProgress }
            : a
        ))
      } else {
        console.error('Erreur lors de la mise à jour:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const handleMarkAsCompleted = async (analysis: any) => {
    try {
      const response = await fetch('/api/admin/analyses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisId: analysis.id,
          progress: 100,
          status: 'terminee'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAnalyses(prev => prev.map(a => 
          a.id === analysis.id 
            ? { ...a, status: 'terminee', progress: 100 }
            : a
        ))
      } else {
        console.error('Erreur lors de la mise à jour:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const handleUploadPdf = (analysisId: string) => {
    setSelectedAnalysisId(analysisId)
    setShowPdfModal(true)
  }

  const handlePdfUploadSuccess = () => {
    loadAllAnalyses()
  }

  const filteredAnalyses = analyses.filter(analysis => {
    if (statusFilter !== 'all' && analysis.status !== statusFilter) {
      return false
    }
    if (searchTerm && 
        !analysis.client_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !analysis.client_email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !analysis.ticket.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const recentAnalyses = filteredAnalyses
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  if (!adminSession?.isAdmin) {
    return null
  }

  // Calculer les KPIs
  const totalUsers = users.length
  const totalAnalyses = analyses.length
  const analysesLast30Days = analyses.filter(a => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return new Date(a.created_at) >= thirtyDaysAgo
  }).length

  const pendingAnalyses = analyses.filter(a => a.status === 'en_cours' || a.status === 'en_analyse').length
  const revenuesThisMonth = paymentStats.monthlyRevenue || 0
  const capsulesThisMonth = 0 // TODO: calculer depuis les capsules

  // Calculer les alertes dynamiquement
  const pendingAnalysesCount = analyses.filter(a => a.status === 'en_cours' || a.status === 'en_analyse').length
  const failedPayments = payments.filter(p => p.status === 'failed')
  const todayFormations = formations.filter(f => {
    const formationDate = new Date(f.date_scheduled)
    const today = new Date()
    return formationDate.toDateString() === today.toDateString()
  })

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <AdminSidebar activeTab="overview" />

      {/* Main Content */}
      <div className="flex-1 ml-64">
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
                {adminSession && (
                  <div className="flex items-center gap-1 sm:gap-3">
                    <div className="relative admin-menu-container z-[9999]">
                      <button
                        onClick={() => setShowAdminMenu(!showAdminMenu)}
                        className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {getInitials(adminSession.email)}
                        </span>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showAdminMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]">
                          <button
                            onClick={() => {
                              router.push('/admin/dashboard')
                              setShowAdminMenu(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Mon compte
                          </button>
                          <button
                            onClick={() => {
                              handleSignOut()
                              setShowAdminMenu(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Se déconnecter
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

        {/* Main Dashboard Content */}
        <main className="p-6">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#012F4E] mb-2">Overview (Admin)</h2>
            <p className="text-gray-600">Vue d'ensemble de l'activité Cash360.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
                <span className="text-green-500 text-sm font-medium">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{totalUsers.toLocaleString()}</h3>
              <p className="text-gray-600 text-sm">Utilisateurs inscrits</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <span className="text-green-500 text-sm font-medium">+8%</span>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{analysesLast30Days}</h3>
              <p className="text-gray-600 text-sm">Analyses reçues (30j)</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267zM10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"/>
                  </svg>
                </div>
                <span className="text-green-500 text-sm font-medium">+15%</span>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{revenuesThisMonth.toLocaleString()} €</h3>
              <p className="text-gray-600 text-sm">Revenus (mois)</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
                <span className="text-red-500 text-sm font-medium">-3%</span>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{capsulesThisMonth}</h3>
              <p className="text-gray-600 text-sm">Capsules vendues (mois)</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-[#012F4E] mb-6">Activité récente</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Utilisateur</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Statut</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-600">
                          {new Date(analysis.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="py-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Analyse</span>
                        </td>
                        <td className="py-3 text-sm">{analysis.client_name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(analysis.status)}`}>
                            {getStatusLabel(analysis.status)}
                          </span>
                        </td>
                        <td className="py-3">
                          <button 
                            onClick={() => router.push(`/admin/analyses`)}
                            className="text-[#00A1C6] cursor-pointer hover:text-[#012F4E]"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alerts & Tasks */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-[#012F4E] mb-6">Alertes & tâches</h3>
              <div className="space-y-4">
                {pendingAnalysesCount > 0 && (
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-orange-800">{pendingAnalysesCount} {pendingAnalysesCount === 1 ? 'analyse' : 'analyses'} en attente de validation</h4>
                        <p className="text-sm text-orange-600 mt-1">Nécessite votre attention</p>
                      </div>
                      <button onClick={() => router.push('/admin/analyses')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">Voir</button>
                    </div>
                  </div>
                )}

                {failedPayments.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-800">{failedPayments.length} {failedPayments.length === 1 ? 'paiement' : 'paiements'} à vérifier</h4>
                        <p className="text-sm text-red-600 mt-1">Échec de transaction détecté</p>
                      </div>
                      <button onClick={() => router.push('/admin/paiements')} className="text-red-600 hover:text-red-800 text-sm font-medium">Gérer</button>
                    </div>
                  </div>
                )}

                {todayFormations.map(formation => (
                  <div key={formation.id} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-800">Session de formation aujourd'hui {formation.time}</h4>
                        <p className="text-sm text-blue-600 mt-1">Formation &quot;{formation.session_name || formation.title}&quot;</p>
                      </div>
                      <button onClick={() => router.push('/admin/formations')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Voir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-[#012F4E] mb-6">Évolution hebdomadaire</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                </svg>
                <p className="text-gray-600">Graphique d'évolution</p>
                <p className="text-sm text-gray-500">Analyses / Ventes de capsules (7-30j)</p>
              </div>
            </div>
          </div>
        </main>

        {/* Modal d'upload PDF */}
        {showPdfModal && selectedAnalysisId && (
          <AdminPdfUploadModal
            isOpen={showPdfModal}
            onClose={() => {
              setShowPdfModal(false)
              setSelectedAnalysisId(null)
            }}
            analysisId={selectedAnalysisId}
            onUploadSuccess={handlePdfUploadSuccess}
          />
        )}
      </div>
    </div>
  )
}

