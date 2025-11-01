'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'
import Footer from '@/components/Footer'
import AdminPdfUploadModal from '@/components/AdminPdfUploadModal'

interface AdminSession {
  isAdmin: boolean
  email: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const checkAdminSession = () => {
      const adminSessionData = localStorage.getItem('admin_session')
      const adminEmail = localStorage.getItem('admin_email')
      
      if (adminSessionData === 'true' && adminEmail) {
        setAdminSession({ isAdmin: true, email: adminEmail })
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
  const revenuesThisMonth = 0 // TODO: calculer depuis les paiements
  const capsulesThisMonth = 0 // TODO: calculer depuis les capsules

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <AdminSidebar activeTab="overview" />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header - à conserver tel quel */}
        <header className="bg-[#012F4E] text-white px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold">Cash360 Admin</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 text-white placeholder-white/70 px-4 py-2 rounded-lg border border-white/20 focus:outline-none focus:border-[#00A1C6] w-80"
              />
              <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70"></i>
            </div>
            
            <div className="relative">
              <i className="fas fa-bell text-xl cursor-pointer hover:text-[#00A1C6]"></i>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            
            <div className="relative admin-menu-container">
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 px-3 py-2 rounded-lg">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Admin" className="w-8 h-8 rounded-full" />
                <span className="font-medium">Admin</span>
                <i className="fas fa-chevron-down text-sm"></i>
              </div>
              
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
                  <i className="fas fa-users text-[#00A1C6] text-xl"></i>
                </div>
                <span className="text-green-500 text-sm font-medium">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{totalUsers.toLocaleString()}</h3>
              <p className="text-gray-600 text-sm">Utilisateurs inscrits</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-[#00A1C6] text-xl"></i>
                </div>
                <span className="text-green-500 text-sm font-medium">+8%</span>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{analysesLast30Days}</h3>
              <p className="text-gray-600 text-sm">Analyses reçues (30j)</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-euro-sign text-[#00A1C6] text-xl"></i>
                </div>
                <span className="text-green-500 text-sm font-medium">+15%</span>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{revenuesThisMonth.toLocaleString()} €</h3>
              <p className="text-gray-600 text-sm">Revenus (mois)</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-[#00A1C6] text-xl"></i>
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
                          <i className="fas fa-eye text-[#00A1C6] cursor-pointer hover:text-[#012F4E]"></i>
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
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-orange-800">3 analyses en attente de validation</h4>
                      <p className="text-sm text-orange-600 mt-1">Nécessite votre attention</p>
                    </div>
                    <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">Voir</button>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-800">2 paiements à vérifier (Stripe)</h4>
                      <p className="text-sm text-red-600 mt-1">Échec de transaction détecté</p>
                    </div>
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">Gérer</button>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-800">1 session de formation aujourd'hui 19h</h4>
                      <p className="text-sm text-blue-600 mt-1">Formation &quot;Analyse financière avancée&quot;</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Voir</button>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-800">Sauvegarde système complétée</h4>
                      <p className="text-sm text-green-600 mt-1">Dernière sauvegarde : il y a 2h</p>
                    </div>
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium">Détails</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-[#012F4E] mb-6">Évolution hebdomadaire</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-chart-area text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600">Graphique d'évolution</p>
                <p className="text-sm text-gray-500">Analyses / Ventes de capsules (7-30j)</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />

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

