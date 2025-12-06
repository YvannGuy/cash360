'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
}

interface Formation {
  id: string
  title: string
  capsule_id: string
  capsule_number: number
  date: string
  time: string
  inscrits: number
  zoom_link: string
  calendly_link?: string
  status: string
}

interface FormationStats {
  sessionsThisMonth: number
  totalRegistered: number
  participationRate: number
  sessionsThisWeek: number
}

const CAPSULES = [
  { id: 'capsule1', title: "L'éducation financière", img: '/images/logo/capsule1.jpg' },
  { id: 'capsule2', title: 'La mentalité de pauvreté', img: '/images/logo/capsule2.jpg' },
  { id: 'capsule3', title: "Les lois spirituelles liées à l'argent", img: '/images/logo/capsule3.jpg' },
  { id: 'capsule4', title: 'Les combats liés à la prospérité', img: '/images/logo/capsule4.jpg' },
  { id: 'capsule5', title: 'Épargne et Investissement', img: '/images/logo/capsule5.jpg' }
]

export default function AdminFormationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [formations, setFormations] = useState<Formation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<FormationStats>({
    sessionsThisMonth: 0,
    totalRegistered: 0,
    participationRate: 0,
    sessionsThisWeek: 0
  })
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    capsuleId: '',
    sessionName: '',
    sessionType: 'Capsule',
    duration: 60,
    date: '',
    time: '',
    description: '',
    zoomLink: '',
    calendlyLink: '',
    maxParticipants: 50,
    timezone: 'Europe/Paris'
  })

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

  const loadFormations = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/formations')
      const data = await response.json()
      
      if (data.success) {
        const loadedFormations = data.formations || []
        setFormations(loadedFormations)
        setStats(data.stats || { sessionsThisMonth: 0, totalRegistered: 0, participationRate: 0, sessionsThisWeek: 0 })
        console.log('Formations chargées:', loadedFormations.length)
        console.log('Détails des formations:', loadedFormations.map((f: Formation) => ({ id: f.id, title: f.title, capsule_id: f.capsule_id })))
        
        // Afficher un message si aucune formation n'est trouvée
        if (loadedFormations.length === 0) {
          console.warn('Aucune formation trouvée dans la base de données')
        }
      } else {
        console.error('Erreur lors du chargement des formations:', data.error)
        alert('Erreur lors du chargement des formations: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error)
      alert('Erreur lors du chargement des formations')
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

  const handleOpenModalForCapsule = (capsuleId: string) => {
    const existingFormation = formations.find(f => f.capsule_id === capsuleId)
    
    if (existingFormation) {
      // Édition : remplir le formulaire avec les données existantes
      setFormData({
        capsuleId: capsuleId,
        sessionName: existingFormation.title,
        sessionType: 'Capsule',
        duration: 60,
        date: existingFormation.date.split('T')[0], // Convertir YYYY-MM-DD
        time: existingFormation.time,
        description: '',
        zoomLink: existingFormation.zoom_link || '',
        maxParticipants: 50,
        timezone: 'Europe/Paris'
      })
    } else {
      // Création : juste la capsule
      const capsule = CAPSULES.find(c => c.id === capsuleId)
      const newFormData = {
        capsuleId: capsuleId,
        sessionName: capsule ? capsule.title : '',
        sessionType: 'Capsule',
        duration: 60,
        date: '',
        time: '',
        description: '',
        zoomLink: '',
        calendlyLink: '',
        maxParticipants: 50,
        timezone: 'Europe/Paris'
      }
      setFormData(newFormData)
    }
    setShowSessionModal(true)
  }

  const handleOpenModalForFormation = (formation: Formation) => {
    setFormData({
      capsuleId: formation.capsule_id || '',
      sessionName: formation.title,
      sessionType: 'Capsule',
      duration: 60,
      date: formation.date ? formation.date.split('T')[0] : '',
      time: formation.time || '',
      description: '',
      zoomLink: formation.zoom_link || '',
      calendlyLink: (formation as any).calendly_link || '',
      maxParticipants: 50,
      timezone: 'Europe/Paris'
    })
    setShowSessionModal(true)
  }

  const handleSaveSession = async () => {
    try {
      if (!formData.sessionName) {
        alert('Veuillez remplir le nom de la session (champ obligatoire)')
        return
      }

      // Vérifier si on est en mode édition (chercher par ID si on a une formation existante)
      // Si capsuleId est fourni, chercher par capsule_id, sinon chercher par titre et date
      let existingFormation = null
      if (formData.capsuleId) {
        existingFormation = formations.find(f => f.capsule_id === formData.capsuleId)
      }
      // Si pas trouvé par capsule, chercher par titre et date pour les formations indépendantes
      if (!existingFormation) {
        existingFormation = formations.find(f => 
          f.title === formData.sessionName && 
          f.date.split('T')[0] === formData.date
        )
      }
      const isEdit = !!existingFormation

      const url = isEdit && existingFormation
        ? `/api/admin/formations?formationId=${existingFormation.id}`
        : '/api/admin/formations'
      
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      console.log('Formation sauvegardée:', data)
      alert(isEdit ? 'Session modifiée avec succès!' : 'Session programmée avec succès!')
      setShowSessionModal(false)
      
      // Reset form
      setFormData({
        capsuleId: '',
        sessionName: '',
        sessionType: 'Capsule',
        duration: 60,
        date: '',
        time: '',
        description: '',
        zoomLink: '',
        calendlyLink: '',
        maxParticipants: 50,
        timezone: 'Europe/Paris'
      })
      
      // Recharger les formations après un court délai pour laisser le temps à la base de données
      setTimeout(() => {
        loadFormations()
      }, 500)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteFormation = async (formationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer la date et l\'heure de cette formation ? La formation restera disponible mais sans date/heure programmée.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/formations?formationId=${formationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      alert('Date et heure supprimées avec succès! La formation reste disponible.')
      loadFormations()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  const handleDeleteFormationCompletely = async (formationId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Empêcher l'ouverture du modal si on clique sur l'icône
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette formation ? Cette action est irréversible et la formation sera complètement supprimée.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/formations?formationId=${formationId}&deleteCompletely=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      alert('Formation supprimée définitivement avec succès!')
      loadFormations()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_ligne':
        return 'bg-green-100 text-green-800'
      case 'a_venir':
        return 'bg-yellow-100 text-yellow-800'
      case 'termine':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_ligne':
        return 'En ligne'
      case 'a_venir':
        return 'À venir'
      case 'termine':
        return 'Terminé'
      default:
        return 'Inconnu'
    }
  }

  // Filtrer les formations pour le tableau : seulement celles avec date et heure
  // Les formations sans date/heure n'apparaissent que dans "Formations disponibles" (cards)
  const formationsWithDate = formations.filter(f => f.date && f.time)
  
  // Pagination
  const totalPages = Math.ceil(formationsWithDate.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentFormations = formationsWithDate.slice(startIndex, endIndex)

  // Reset page when formations change
  useEffect(() => {
    setCurrentPage(1)
  }, [formations])

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
      {/* Sidebar */}
      <AdminSidebar activeTab="formations" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Bouton hamburger pour mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
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
              <div className="flex items-center gap-3 mr-2 sm:mr-20">
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

        {/* Main Content */}
        <main className="p-6">
          {/* Page Title */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Formations & Sessions Zoom</h1>
              <p className="text-gray-600">Gérez toutes les formations Cash380 et les sessions Zoom associées à chaque capsule.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={loadFormations}
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
                onClick={() => {
                  setFormData({
                    capsuleId: '',
                    sessionName: '',
                    sessionType: 'Capsule',
                    duration: 60,
                    date: '',
                    time: '',
                    description: '',
                    zoomLink: '',
                    maxParticipants: 50,
                    timezone: 'Europe/Paris'
                  })
                  setShowSessionModal(true)
                }}
                className="bg-[#FEBE02] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e6a802] transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Programmer une nouvelle session
              </button>
            </div>
          </div>

          {/* Formations disponibles */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#012F4E] mb-4">Formations disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Afficher toutes les formations */}
              {formations.map((formation) => {
                const capsule = CAPSULES.find(c => c.id === formation.capsule_id)
                return (
                  <div key={formation.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative bg-gray-100 flex items-center justify-center">
                          {capsule ? (
                            <Image src={capsule.img} alt={capsule.title} width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 mb-1 flex-1">{formation.title}</h3>
                            <button
                              onClick={(e) => handleDeleteFormationCompletely(formation.id, e)}
                              className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 p-1"
                              title="Supprimer définitivement cette formation"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-600">
                              {formation.date && formation.time 
                                ? `${formatDate(formation.date)} à ${formation.time?.substring(0, 5)}`
                                : 'Date et heure non définies'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formation.zoom_link ? 'Lien Zoom configuré' : 'Pas de lien Zoom'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(formation as any).calendly_link ? 'Lien Calendly configuré' : 'Pas de lien Calendly'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenModalForFormation(formation)}
                        className="w-full px-4 py-2 bg-[#00A1C6] text-white rounded-lg hover:bg-[#0089a3] transition-colors font-medium text-sm"
                      >
                        Modifier la session
                      </button>
                    </div>
                  </div>
                )
              })}
              {/* Afficher les capsules sans formations */}
              {CAPSULES.filter(capsule => !formations.find(f => f.capsule_id === capsule.id)).map((capsule) => (
                <div key={capsule.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <Image src={capsule.img} alt={capsule.title} width={64} height={64} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{capsule.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">Aucune session programmée</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenModalForCapsule(capsule.id)}
                      className="w-full px-4 py-2 bg-[#00A1C6] text-white rounded-lg hover:bg-[#0089a3] transition-colors font-medium text-sm"
                    >
                      Programmer une session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formations Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Formation</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Date & Heure</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Inscrits</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Lien Zoom</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentFormations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        Aucune formation trouvée
                      </td>
                    </tr>
                  ) : (
                    currentFormations.map((formation) => (
                      <tr key={formation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{formation.title}</span>
                        </td>
                        <td className="py-4 px-6">
                          {formation.capsule_id ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Capsule #{formation.capsule_number || 'N/A'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Formation
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {formation.date && formation.time ? (
                            <>
                              <div className="text-sm text-gray-900">{formatDate(formation.date)}</div>
                              <div className="text-sm text-gray-500">{formation.time}</div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-400 italic">Non définies</div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                            </svg>
                            <span className="text-sm text-gray-600">{formation.inscrits} inscrits</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <a 
                            href={formation.zoom_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#00A1C6] hover:text-[#0089a3] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm">Lien Zoom</span>
                          </a>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(formation.status)}`}>
                            {getStatusLabel(formation.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button 
                            onClick={() => handleDeleteFormation(formation.id)} 
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Supprimer la date et l'heure (la formation reste disponible)"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{stats.sessionsThisMonth}</h3>
              <p className="text-gray-600 text-sm">Sessions du mois</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{stats.totalRegistered}</h3>
              <p className="text-gray-600 text-sm">Total d'inscrits</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{stats.participationRate}%</h3>
              <p className="text-gray-600 text-sm">Taux de participation</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{stats.sessionsThisWeek}</h3>
              <p className="text-gray-600 text-sm">Sessions cette semaine</p>
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
                    <span className="font-medium">{Math.min(endIndex, formations.length)}</span> sur{' '}
                    <span className="font-medium">{formations.length}</span> formations
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
        </main>

        {/* Session Modal */}
        {showSessionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-[#012F4E]">Détails de la session</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Détails de la session */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capsule associée (optionnel)</label>
                  <select
                    value={formData.capsuleId}
                    onChange={(e) => setFormData({...formData, capsuleId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  >
                    <option value="">Aucune capsule (Formation indépendante)</option>
                    <option value="capsule1">L'éducation financière</option>
                    <option value="capsule2">La mentalité de pauvreté</option>
                    <option value="capsule3">Les lois spirituelles liées à l'argent</option>
                    <option value="capsule4">Les combats liés à la prospérité</option>
                    <option value="capsule5">Épargne et Investissement</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Laissez vide pour créer une formation indépendante</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la session *</label>
                  <input
                    type="text"
                    value={formData.sessionName}
                    onChange={(e) => setFormData({...formData, sessionName: e.target.value})}
                    placeholder="Ex: Session 1 - L'éducation financière"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de session</label>
                    <select
                      value={formData.sessionType}
                      onChange={(e) => setFormData({...formData, sessionType: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    >
                      <option value="Capsule">Capsule</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Webinaire">Webinaire</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Durée estimée</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                      />
                      <span className="text-gray-600">minutes</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description brève</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Décrivez brièvement le contenu de la session..."
                    rows={4}
                    maxLength={250}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum 250 caractères</p>
                </div>

                {/* Détails techniques */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#00A1C6] rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#012F4E]">Détails techniques</h3>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Lien Zoom ou plateforme
                    <svg className="w-4 h-4 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                    </svg>
                  </label>
                  <input
                    type="url"
                    value={formData.zoomLink}
                    onChange={(e) => setFormData({...formData, zoomLink: e.target.value})}
                    placeholder="https://zoom.us/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Lien Calendly (pour Diagnostic Finance Express)
                    <svg className="w-4 h-4 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                  </label>
                  <input
                    type="url"
                    value={formData.calendlyLink}
                    onChange={(e) => setFormData({...formData, calendlyLink: e.target.value})}
                    placeholder="https://calendly.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lien pour prendre rendez-vous avec Pasteur Myriam</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacité max de participants</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fuseau horaire</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    >
                      <option value="Europe/Paris">Europe/Paris (FR)</option>
                      <option value="America/New_York">America/New_York (ET)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-gray-200 flex gap-4">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSession}
                  className="flex-1 px-4 py-2 bg-[#00A1C6] text-white rounded-lg font-medium hover:bg-[#0089a3] transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Enregistrer la session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
      </div>
    </div>
  )
}

