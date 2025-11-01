'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'
import Footer from '@/components/Footer'

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
  status: string
}

interface FormationStats {
  sessionsThisMonth: number
  totalRegistered: number
  participationRate: number
  sessionsThisWeek: number
}

export default function AdminFormationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [formations, setFormations] = useState<Formation[]>([])
  const [stats, setStats] = useState<FormationStats>({
    sessionsThisMonth: 0,
    totalRegistered: 0,
    participationRate: 0,
    sessionsThisWeek: 0
  })
  const [showAdminMenu, setShowAdminMenu] = useState(false)

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
      const response = await fetch('/api/admin/formations')
      const data = await response.json()
      
      if (data.success) {
        setFormations(data.formations || [])
        setStats(data.stats || { sessionsThisMonth: 0, totalRegistered: 0, participationRate: 0, sessionsThisWeek: 0 })
      } else {
        console.error('Erreur lors du chargement des formations:', data.error)
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
      <AdminSidebar activeTab="formations" />

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
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
              <button className="bg-[#FEBE02] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e6a802] transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Programmer une nouvelle session
              </button>
            </div>
          </div>

          {/* Formations Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Formation</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Capsule liée</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Date & Heure</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Inscrits</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Lien Zoom</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        Aucune formation trouvée
                      </td>
                    </tr>
                  ) : (
                    formations.map((formation) => (
                      <tr key={formation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{formation.title}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Capsule #{formation.capsule_number}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">{formatDate(formation.date)}</div>
                          <div className="text-sm text-gray-500">{formation.time}</div>
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
                          <button className="text-gray-400 hover:text-[#00A1C6] transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
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
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

