'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { type AnalysisRecord } from '@/lib/database'
import Image from 'next/image'
import AdminPdfUploadModal from '@/components/AdminPdfUploadModal'

interface AdminSession {
  isAdmin: boolean
  email: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)

  useEffect(() => {
    checkAdminSession()
  }, [])

  useEffect(() => {
    if (adminSession?.isAdmin) {
      loadAllAnalyses()
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

  useEffect(() => {
    filterAnalyses()
  }, [analyses, statusFilter, searchTerm])

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
      // En cas d'erreur, on affiche un message mais on ne bloque pas l'interface
    }
  }

  const filterAnalyses = () => {
    let filtered = analyses

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.status === statusFilter)
    }

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(analysis => 
        analysis.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.ticket.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAnalyses(filtered)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'en_analyse':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'terminee':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleMarkAsCompleted = async (analysis: AnalysisRecord) => {
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
        // Mettre à jour localement
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

  const handleUpdateStatus = async (analysisId: string, newStatus: string, newProgress: number) => {
    try {
      // Mettre à jour dans la base de données via l'API admin
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
        // Mettre à jour localement
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

  const handleDiagnostic = async () => {
    try {
      const response = await fetch('/api/test/fix-dashboard')
      const data = await response.json()
      setDiagnosticInfo(data)
      console.log('Diagnostic admin:', data)
    } catch (error) {
      console.error('Erreur lors du diagnostic:', error)
    }
  }

  const handleUploadPdf = (analysisId: string) => {
    setSelectedAnalysisId(analysisId)
    setShowPdfModal(true)
  }

  const handlePdfUploadSuccess = () => {
    loadAllAnalyses() // Recharger les analyses pour afficher le PDF
  }

  const handleCheckStorage = async () => {
    try {
      // Vérifier le storage
      const storageResponse = await fetch('/api/test/check-storage')
      const storageData = await storageResponse.json()
      console.log('Diagnostic Storage:', storageData)
      
      if (!storageData.success) {
        // Si le bucket n'existe pas, essayer de le créer
        if (storageData.error?.includes('bucket "analyses" n\'existe pas')) {
          const createResponse = await fetch('/api/test/create-bucket', { method: 'POST' })
          const createData = await createResponse.json()
          console.log('Création bucket:', createData)
          alert(createData.success ? 'Bucket créé avec succès!' : `Erreur création bucket: ${createData.error}`)
        } else {
          alert(`Erreur Storage: ${storageData.error}`)
        }
      } else {
        alert('Storage OK! Buckets disponibles: ' + storageData.buckets?.map((b: any) => b.name).join(', '))
      }
    } catch (error) {
      console.error('Erreur lors du diagnostic storage:', error)
      alert('Erreur lors du diagnostic storage')
    }
  }

  const handleTestPdfUpload = async () => {
    try {
      const response = await fetch('/api/test/test-pdf-upload', { method: 'POST' })
      const data = await response.json()
      console.log('Test PDF Upload:', data)
      
      if (data.success) {
        alert('Test PDF Upload réussi! Le bucket fonctionne correctement.')
      } else {
        alert(`Erreur Test PDF: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur lors du test PDF upload:', error)
      alert('Erreur lors du test PDF upload')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button
                onClick={() => router.push('/')}
                className="cursor-pointer"
              >
                <Image
                  src="/images/logo/logofinal.png"
                  alt="Cash360 Admin"
                  width={120}
                  height={120}
                  className="h-16 w-auto hover:opacity-80 transition-opacity duration-200"
                />
              </button>
            </div>

            {/* Titre et informations admin */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900">Dashboard Administrateur</h1>
                <p className="text-sm text-gray-600">Gestion des analyses financières</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative admin-menu-container">
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition-colors duration-200"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-700">
                      Admin: {adminSession.email}
                    </span>
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showAdminMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
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
            </div>
          </div>
        </div>
      </header>

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En cours</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyses.filter(a => a.status === 'en_cours').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En analyse</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyses.filter(a => a.status === 'en_analyse').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Terminées</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyses.filter(a => a.status === 'terminee').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                    Statut:
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous</option>
                    <option value="en_cours">En cours</option>
                    <option value="en_analyse">En analyse</option>
                    <option value="terminee">Terminées</option>
                  </select>
                </div>
                
                <button
                  onClick={handleDiagnostic}
                  className="px-3 py-1 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                >
                  🔍 Diagnostic
                </button>
                <button
                  onClick={handleCheckStorage}
                  className="px-3 py-1 text-xs font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 border border-green-200"
                >
                  📁 Storage
                </button>
                <button
                  onClick={handleTestPdfUpload}
                  className="px-3 py-1 text-xs font-medium rounded-md text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                >
                  🧪 Test PDF
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email ou ticket..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {diagnosticInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">Diagnostic Admin :</div>
                  <div>Total analyses: {diagnosticInfo.summary?.totalAnalyses || 0}</div>
                  <div>Avec user_id: {diagnosticInfo.summary?.analysesWithUserId || 0}</div>
                  <div>Sans user_id: {diagnosticInfo.summary?.analysesWithoutUserId || 0}</div>
                  {diagnosticInfo.allAnalyses?.slice(0, 3).map((analysis: any) => (
                    <div key={analysis.id} className="ml-2">
                      {analysis.ticket} - {analysis.client_name} ({analysis.user_id ? 'avec user_id' : 'sans user_id'})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Liste des analyses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Demandes d'analyse ({filteredAnalyses.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progression
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnalyses.map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {analysis.ticket}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {analysis.client_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {analysis.client_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(analysis.status)}`}>
                          {getStatusLabel(analysis.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: analysis.status === 'terminee' ? '100%' : '70%' }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{analysis.status === 'terminee' ? '100%' : '70%'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {analysis.status === 'en_cours' && (
                            <button
                              onClick={() => handleUpdateStatus(analysis.id, 'en_analyse', 70)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Démarrer analyse
                            </button>
                          )}
                          {analysis.status === 'en_analyse' && (
                            <button
                              onClick={() => handleMarkAsCompleted(analysis)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Marquer comme terminée
                            </button>
                          )}
                          {analysis.status === 'terminee' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">
                                Analyse terminée
                              </span>
                              <button
                                onClick={() => handleUploadPdf(analysis.id)}
                                className="text-yellow-600 hover:text-yellow-900 text-xs"
                              >
                                📄 Upload PDF
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
  )
}
