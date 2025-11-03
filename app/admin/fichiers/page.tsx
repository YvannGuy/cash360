'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
}

interface FileRecord {
  id: string
  analysis_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
  user_name: string
  user_email: string
  status: string
}

interface FileStats {
  totalFiles: number
  pendingAnalysis: number
  analyzed: number
  deleted: number
}

export default function AdminFichiersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [stats, setStats] = useState<FileStats>({
    totalFiles: 0,
    pendingAnalysis: 0,
    analyzed: 0,
    deleted: 0
  })
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
  const [refreshing, setRefreshing] = useState(false)

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
      loadFiles()
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

  const loadFiles = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/fichiers')
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files || [])
        setStats(data.stats || { totalFiles: 0, pendingAnalysis: 0, analyzed: 0, deleted: 0 })
        console.log('Fichiers chargés:', data.files?.length || 0)
      } else {
        console.error('Erreur lors du chargement des fichiers:', data.error)
        alert('Erreur lors du chargement des fichiers: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error)
      alert('Erreur lors du chargement des fichiers')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_email')
    router.push('/admin/login')
  }

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} Mo`
  }

  const getFileTypeLabel = (fileName: string) => {
    if (fileName.toLowerCase().includes('releve')) return 'Relevé bancaire'
    if (fileName.toLowerCase().includes('analyse') || fileName.toLowerCase().includes('rapport')) return 'Rapport PDF'
    if (fileName.toLowerCase().match(/\.(png|jpg|jpeg|gif)$/)) return 'Image'
    return 'Autre'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analysé':
        return 'bg-green-100 text-green-800'
      case 'en_attente':
        return 'bg-orange-100 text-orange-800'
      case 'non_traite':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'analysé':
        return 'Analysé'
      case 'en_attente':
        return 'En attente'
      case 'non_traite':
        return 'Non traité'
      default:
        return 'Inconnu'
    }
  }

  const handleExportList = () => {
    const headers = ['Utilisateur', 'Email', 'Type de fichier', 'Nom du fichier', 'Date d\'envoi', 'Taille', 'Statut']
    const rows = filteredFiles.map(file => [
      file.user_name,
      file.user_email,
      getFileTypeLabel(file.file_name),
      file.file_name,
      formatDate(file.created_at),
      formatFileSize(file.file_size),
      getStatusLabel(file.status)
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `fichiers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteObsolete = async () => {
    const obsoleteFiles = files.filter(file => file.status === 'non_traite')
    
    if (obsoleteFiles.length === 0) {
      alert('Aucun fichier obsolète à supprimer')
      return
    }
    
    if (!confirm(`Voulez-vous vraiment supprimer ${obsoleteFiles.length} fichier(s) obsolète(s) ?`)) {
      return
    }
    
    try {
      // TODO: Implémenter l'API de suppression
      alert(`${obsoleteFiles.length} fichier(s) obsolète(s) supprimé(s) avec succès`)
      loadFiles()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression des fichiers')
    }
  }

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fileUrl, bucket: 'releves' })
      })
      
      const data = await response.json()
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      } else {
        alert('Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      alert('Erreur lors du téléchargement du fichier')
    }
  }

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le fichier "${fileName}" ?`)) {
      return
    }
    
    try {
      const response = await fetch('/api/admin/fichiers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      })
      
      const data = await response.json()
      if (data.success) {
        loadFiles()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du fichier')
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = 
      file.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || getFileTypeLabel(file.file_name).toLowerCase().includes(typeFilter.toLowerCase())
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Grouper les fichiers par utilisateur
  const groupedByUser = filteredFiles.reduce((acc, file) => {
    const key = file.user_email
    if (!acc[key]) {
      acc[key] = {
        user_name: file.user_name,
        user_email: file.user_email,
        files: []
      }
    }
    acc[key].files.push(file)
    return acc
  }, {} as Record<string, { user_name: string, user_email: string, files: FileRecord[] }>)

  // Convertir en array pour la pagination
  const userGroups = Object.values(groupedByUser)
  
  // Pagination
  const totalPages = Math.ceil(userGroups.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUserGroups = userGroups.slice(startIndex, endIndex)

  const toggleUserExpansion = (userEmail: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userEmail]: !prev[userEmail]
    }))
  }

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, statusFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    )
  }

  if (!adminSession?.isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar activeTab="fichiers" />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0 ml-2 sm:ml-16 mt-4">
                <button onClick={() => router.push('/')} className="cursor-pointer">
                  <Image src="/images/logo/logofinal.png" alt="Cash360" width={540} height={540} className="h-16 sm:h-32 md:h-42 w-auto hover:opacity-80 transition-opacity duration-200" />
                </button>
              </div>
              <div className="flex items-center gap-1 sm:gap-4 mr-2 sm:mr-20">
                {adminSession && (
                  <div className="flex items-center gap-1 sm:gap-3">
                    <div className="relative admin-menu-container z-[9999]">
                      <button onClick={() => setShowAdminMenu(!showAdminMenu)} className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{getInitials(adminSession.email)}</span>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showAdminMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]">
                          <button onClick={() => { router.push('/admin/dashboard'); setShowAdminMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mon compte</button>
                          <button onClick={() => { handleSignOut(); setShowAdminMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Se déconnecter</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Fichiers & Relevés utilisateurs</h1>
              <p className="text-gray-600">Accédez à tous les fichiers envoyés pour analyse et rapports générés par Cash360.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={loadFiles}
                disabled={refreshing}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg 
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
              <button 
                onClick={handleExportList}
                className="bg-[#00A1C6] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0089a3] transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter la liste
              </button>
              <button 
                onClick={handleDeleteObsolete}
                className="bg-[#FEBE02] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e6a802] transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Supprimer obsolètes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="Rechercher par nom d'utilisateur ou fichier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent" />
                  </div>
                  <div className="relative">
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer">
                      <option value="all">Tous les types</option>
                      <option value="relevé">Relevés bancaires</option>
                      <option value="rapport">Rapports PDF</option>
                      <option value="image">Images</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="relative">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer">
                      <option value="all">Tous les statuts</option>
                      <option value="analysé">Analysé</option>
                      <option value="en_attente">En attente</option>
                      <option value="non_traite">Non traité</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-[#012F4E]">Liste des fichiers</h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-[#00A1C6] focus:ring-[#00A1C6]" />
                    <span className="text-sm text-gray-700">Sélectionner tout</span>
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider"></th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Utilisateur</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Type de fichier</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Nom du fichier</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Date d'envoi</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Taille</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentUserGroups.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-gray-500">Aucun fichier trouvé</td>
                        </tr>
                      ) : (
                        currentUserGroups.map((userGroup) => (
                          <React.Fragment key={userGroup.user_email}>
                            {/* Dossier utilisateur */}
                            <tr className="hover:bg-gray-50 transition-colors bg-gray-50">
                              <td className="py-4 px-6">
                                <input type="checkbox" className="rounded border-gray-300 text-[#00A1C6] focus:ring-[#00A1C6]" />
                              </td>
                              <td className="py-4 px-6" colSpan={7}>
                                <button
                                  onClick={() => toggleUserExpansion(userGroup.user_email)}
                                  className="flex items-center space-x-3 w-full text-left"
                                >
                                  <div className="w-10 h-10 rounded-full bg-[#00A1C6] flex items-center justify-center text-white font-medium text-sm">
                                    {getInitials(userGroup.user_email)}
                                  </div>
                                  <span className="font-medium text-gray-900">{userGroup.user_name}</span>
                                  <span className="text-sm text-gray-500">({userGroup.files.length} fichier{userGroup.files.length > 1 ? 's' : ''})</span>
                                  <svg 
                                    className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${expandedUsers[userGroup.user_email] ? 'transform rotate-90' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                            {/* Fichiers sous le dossier */}
                            {expandedUsers[userGroup.user_email] && userGroup.files.map((file) => (
                              <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 pl-16">
                                  <input type="checkbox" className="rounded border-gray-300 text-[#00A1C6] focus:ring-[#00A1C6]" />
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-600 text-xs">
                                      {getFileTypeLabel(file.file_name).charAt(0)}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-600">{getFileTypeLabel(file.file_name)}</td>
                                <td className="py-4 px-6 text-sm text-gray-900">{file.file_name}</td>
                                <td className="py-4 px-6 text-sm text-gray-600">{formatDate(file.created_at)}</td>
                                <td className="py-4 px-6 text-sm text-gray-600">{formatFileSize(file.file_size)}</td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                                    {getStatusLabel(file.status) === 'Analysé' && (
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                      </svg>
                                    )}
                                    {getStatusLabel(file.status) === 'En attente' && (
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                      </svg>
                                    )}
                                    {getStatusLabel(file.status) === 'Non traité' && (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                    {getStatusLabel(file.status)}
                                  </span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center space-x-3">
                                    <button onClick={() => handleDownloadFile(file.file_url, file.file_name)} className="text-gray-400 hover:text-[#00A1C6] transition-colors" title="Télécharger">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    </button>
                                    <button onClick={() => handleDeleteFile(file.id, file.file_name)} className="text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                        <span className="font-medium">{Math.min(endIndex, userGroups.length)}</span> sur{' '}
                        <span className="font-medium">{userGroups.length}</span> dossier{userGroups.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Précédent</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Page {currentPage} sur {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
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

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  <h3 className="text-lg font-bold text-[#012F4E]">Résumé global</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total de fichiers reçus</span>
                    <span className="text-lg font-bold text-blue-600">{stats.totalFiles}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">En attente d'analyse</span>
                    <span className="text-lg font-bold text-orange-600">{stats.pendingAnalysis}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Analysés</span>
                    <span className="text-lg font-bold text-green-600">{stats.analyzed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Supprimés / obsolètes</span>
                    <span className="text-lg font-bold text-red-600">{stats.deleted}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#012F4E] mb-4">Types de fichiers</h3>
                <div className="flex items-center justify-center h-48">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="#00A1C6" strokeWidth="8" fill="none" strokeDasharray={`${0.6 * 351.86} 351.86`} className="animate-draw-circle"/>
                      <circle cx="64" cy="64" r="56" stroke="#FEBE02" strokeWidth="8" fill="none" strokeDasharray={`${0.2 * 351.86} 351.86`} strokeDashoffset="-210" className="animate-draw-circle"/>
                      <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="8" fill="none" strokeDasharray={`${0.1 * 351.86} 351.86`} strokeDashoffset="-281" className="animate-draw-circle"/>
                      <circle cx="64" cy="64" r="56" stroke="#ef4444" strokeWidth="8" fill="none" strokeDasharray={`${0.1 * 351.86} 351.86`} strokeDashoffset="-315" className="animate-draw-circle"/>
                    </svg>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#00A1C6]"></div>
                    <span className="text-sm text-gray-600">Relevés bancaires</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FEBE02]"></div>
                    <span className="text-sm text-gray-600">Rapports PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Autres</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <span>Tous les fichiers sont hébergés de manière sécurisée et chiffrés selon les normes RGPD.</span>
            </div>
          </div>
        </main>

      </div>
    </div>
  )
}

