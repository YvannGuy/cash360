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
  const [users, setUsers] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)
  const [relevesFiles, setRelevesFiles] = useState<{ [ticket: string]: any[] }>({})
  const [loadingReleves, setLoadingReleves] = useState<{ [ticket: string]: boolean }>({})
  
  // Pagination pour les analyses
  const [currentAnalysisPage, setCurrentAnalysisPage] = useState(1)
  const analysesPerPage = 2
  
  // Pagination pour les utilisateurs
  const [currentUserPage, setCurrentUserPage] = useState(1)
  const usersPerPage = 2

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filterAnalyses = React.useCallback(() => {
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
    // Reset à la page 1 quand on filtre
    setCurrentAnalysisPage(1)
  }, [analyses, statusFilter, searchTerm])

  useEffect(() => {
    filterAnalyses()
  }, [filterAnalyses])

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

  // Calculs de pagination pour les analyses
  const totalAnalysisPages = Math.ceil(filteredAnalyses.length / analysesPerPage)
  const startAnalysisIndex = (currentAnalysisPage - 1) * analysesPerPage
  const endAnalysisIndex = startAnalysisIndex + analysesPerPage
  const currentAnalyses = filteredAnalyses.slice(startAnalysisIndex, endAnalysisIndex)

  // Calculs de pagination pour les utilisateurs
  const totalUserPages = Math.ceil(users.length / usersPerPage)
  const startUserIndex = (currentUserPage - 1) * usersPerPage
  const endUserIndex = startUserIndex + usersPerPage
  const currentUsers = users.slice(startUserIndex, endUserIndex)

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


  const handleUploadPdf = (analysisId: string) => {
    setSelectedAnalysisId(analysisId)
    setShowPdfModal(true)
  }

  const handlePdfUploadSuccess = () => {
    loadAllAnalyses() // Recharger les analyses pour afficher le PDF
  }

  const loadRelevesForAnalysis = async (ticket: string) => {
    setLoadingReleves(prev => ({ ...prev, [ticket]: true }))
    try {
      const response = await fetch(`/api/admin/releves?ticket=${ticket}`)
      const data = await response.json()
      
      if (data.files) {
        setRelevesFiles(prev => ({ ...prev, [ticket]: data.files }))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des relevés:', error)
    } finally {
      setLoadingReleves(prev => ({ ...prev, [ticket]: false }))
    }
  }

  const handleDownloadReleve = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: filePath,
          bucket: 'releves'
        })
      })
      
      const data = await response.json()
      
      if (data.downloadUrl) {
        // Ouvrir le fichier dans un nouvel onglet
        window.open(data.downloadUrl, '_blank')
      } else {
        console.error('Erreur lors du téléchargement:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
    
    // fileName est conservé pour une utilisation future potentielle (logs, analytics, etc.)
    void fileName
  }


  const getPdfFileName = (pdfUrl: string) => {
    try {
      const url = new URL(pdfUrl)
      const pathParts = url.pathname.split('/')
      const fileName = pathParts[pathParts.length - 1]
      return fileName || 'PDF uploadé'
    } catch {
      return 'PDF uploadé'
    }
  }

  const handleDeleteAnalysis = async (analysisId: string, analysisTicket: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'analyse ${analysisTicket} ?\n\nCette action est irréversible et supprimera :\n- L'analyse de la base de données\n- Le fichier PDF associé (si il existe)\n- L'accès utilisateur à cette analyse`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/delete-analysis', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analysisId })
      })

      const data = await response.json()

      if (data.success) {
        // Supprimer de la liste locale
        setAnalyses(prev => prev.filter(a => a.id !== analysisId))
        alert('Analyse supprimée avec succès!')
      } else {
        console.error('Erreur lors de la suppression:', data.error)
        alert(`Erreur lors de la suppression: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression de l\'analyse')
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ?\n\nCette action est irréversible et supprimera :\n- L'utilisateur de Supabase Auth\n- Toutes ses analyses de la base de données\n- Tous ses fichiers PDF associés\n- Son accès à l'application`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (data.success) {
        // Supprimer de la liste locale
        setUsers(prev => prev.filter(u => u.id !== userId))
        // Recharger les analyses pour mettre à jour la liste
        loadAllAnalyses()
        alert('Utilisateur supprimé avec succès!')
      } else {
        console.error('Erreur lors de la suppression:', data.error)
        alert(`Erreur lors de la suppression: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression de l\'utilisateur')
    }
  }

  const handleDeleteUserByEmail = async (userEmail: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes les analyses de ${userEmail} ?\n\nCette action est irréversible et supprimera :\n- Toutes les analyses de cet email\n- Tous les fichiers PDF associés`)) {
      return
    }

    try {
      // Supprimer toutes les analyses de cet email
      const { data: userAnalyses } = await fetch('/api/admin/analyses').then(res => res.json())
      const analysesToDelete = userAnalyses.analyses.filter((a: any) => a.client_email === userEmail)

      for (const analysis of analysesToDelete) {
        const response = await fetch('/api/admin/delete-analysis', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ analysisId: analysis.id })
        })
        
        // Vérifier si la suppression a réussi
        if (!response.ok) {
          console.error(`Erreur lors de la suppression de l'analyse ${analysis.id}`)
        }
      }

      // Recharger les données
      loadAllAnalyses()
      loadAllUsers()
      alert('Analyses supprimées avec succès!')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression des analyses')
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
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header Admin */}
      <header className="bg-white border-b border-gray-200 relative z-[9998]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="cursor-pointer group"
              >
                <Image
                  src="/images/logo/logofinal.png"
                  alt="Cash360 Admin"
                  width={120}
                  height={120}
                  className="h-10 w-auto group-hover:opacity-80 transition-opacity duration-200"
                />
              </button>
              <div className="hidden md:block text-sm text-gray-500">/ Dashboard</div>
            </div>

            {/* Menu admin */}
            <div className="relative admin-menu-container z-[9999]">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {adminSession.email?.charAt(0).toUpperCase()}
                </div>
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{analyses.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {analyses.filter(a => a.status === 'en_cours').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En analyse</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyses.filter(a => a.status === 'en_analyse').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Terminées</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyses.filter(a => a.status === 'terminee').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Demandes d'analyse</h2>
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="en_cours">En cours</option>
                <option value="en_analyse">En analyse</option>
                <option value="terminee">Terminées</option>
              </select>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Liste des analyses en cartes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
            {currentAnalyses.map((analysis) => (
              <div key={analysis.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                {/* Header de la carte */}
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-bold text-gray-900">#{analysis.ticket}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(analysis.status)}`}>
                          {getStatusLabel(analysis.status)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{analysis.client_name}</p>
                        <p className="text-gray-500 text-xs">{analysis.client_email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAnalysis(analysis.id, analysis.ticket)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Body de la carte */}
                <div className="p-5 space-y-4">
                  {/* Progression */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Progression</span>
                      <span className="text-xs font-semibold text-gray-900">{analysis.status === 'terminee' ? '100%' : '70%'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: analysis.status === 'terminee' ? '100%' : '70%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                  </div>

                  {/* PDF */}
                  <div>
                    <span className="text-xs font-medium text-gray-600 block mb-1">Fichier PDF</span>
                    {analysis.pdf_url ? (
                      <a
                        href={analysis.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{getPdfFileName(analysis.pdf_url)}</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">Aucun PDF</span>
                    )}
                  </div>

                  {/* Relevés */}
                  <div>
                    <span className="text-xs font-medium text-gray-600 block mb-1">Relevés bancaires</span>
                    {!relevesFiles[analysis.ticket] ? (
                      <button
                        onClick={() => loadRelevesForAnalysis(analysis.ticket)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        🔍 Charger les relevés
                      </button>
                    ) : loadingReleves[analysis.ticket] ? (
                      <span className="text-gray-500 text-sm">⏳ Chargement...</span>
                    ) : relevesFiles[analysis.ticket].length === 0 ? (
                      <span className="text-gray-400 text-sm">Aucun relevé</span>
                    ) : (
                      <div className="space-y-1">
                        {relevesFiles[analysis.ticket].map((file: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleDownloadReleve(file.path, file.name)}
                            className="block text-blue-600 hover:text-blue-800 text-sm truncate"
                            title={file.name}
                          >
                            📄 {file.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100">
                    {analysis.status === 'en_cours' && (
                      <button
                        onClick={() => handleUpdateStatus(analysis.id, 'en_analyse', 70)}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Démarrer l'analyse
                      </button>
                    )}
                    {analysis.status === 'en_analyse' && (
                      <button
                        onClick={() => handleMarkAsCompleted(analysis)}
                        className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Marquer comme terminée
                      </button>
                    )}
                    {analysis.status === 'terminee' && (
                      <div className="space-y-2">
                        <div className="text-center text-sm text-green-600 font-medium">
                          ✓ Analyse terminée
                        </div>
                        {!analysis.pdf_url && (
                          <button
                            onClick={() => handleUploadPdf(analysis.id)}
                            className="w-full px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
                          >
                            📄 Uploader le PDF
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination pour les analyses */}
          {totalAnalysisPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentAnalysisPage(prev => Math.max(1, prev - 1))}
                  disabled={currentAnalysisPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentAnalysisPage(prev => Math.min(totalAnalysisPages, prev + 1))}
                  disabled={currentAnalysisPage === totalAnalysisPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de <span className="font-medium">{startAnalysisIndex + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(endAnalysisIndex, filteredAnalyses.length)}</span> sur{' '}
                    <span className="font-medium">{filteredAnalyses.length}</span> analyses
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentAnalysisPage(prev => Math.max(1, prev - 1))}
                      disabled={currentAnalysisPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Précédent</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentAnalysisPage} sur {totalAnalysisPages}
                    </span>
                    <button
                      onClick={() => setCurrentAnalysisPage(prev => Math.min(totalAnalysisPages, prev + 1))}
                      disabled={currentAnalysisPage === totalAnalysisPages}
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

        {/* Section Utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Utilisateurs inscrits ({users.length})
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {currentUsers.map((user) => (
              <div key={user.id || user.email} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                {/* Header de la carte */}
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_authenticated 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {user.is_authenticated ? '✓ Compte créé' : '📧 Email uniquement'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{user.email}</p>
                        {user.name && (
                          <p className="text-gray-500 text-xs">{user.name}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => user.is_authenticated ? handleDeleteUser(user.id, user.email) : handleDeleteUserByEmail(user.email)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title={user.is_authenticated ? "Supprimer cet utilisateur" : "Supprimer toutes les analyses"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Body de la carte */}
                <div className="p-5 space-y-3">
                  {/* Nombre d'analyses */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Analyses</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.analysis_count} analyse{user.analysis_count > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Première analyse */}
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs">1ère analyse : {new Date(user.first_analysis_date || user.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {/* Dernière connexion */}
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs">Dernière connexion : {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination pour les utilisateurs */}
          {totalUserPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentUserPage(prev => Math.max(1, prev - 1))}
                  disabled={currentUserPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentUserPage(prev => Math.min(totalUserPages, prev + 1))}
                  disabled={currentUserPage === totalUserPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de <span className="font-medium">{startUserIndex + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(endUserIndex, users.length)}</span> sur{' '}
                    <span className="font-medium">{users.length}</span> utilisateurs
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentUserPage(prev => Math.max(1, prev - 1))}
                      disabled={currentUserPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Précédent</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentUserPage} sur {totalUserPages}
                    </span>
                    <button
                      onClick={() => setCurrentUserPage(prev => Math.min(totalUserPages, prev + 1))}
                      disabled={currentUserPage === totalUserPages}
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
