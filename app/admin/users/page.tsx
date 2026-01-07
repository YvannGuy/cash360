'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'

// Style pour cacher la scrollbar sur les tabs mobiles
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`

interface AdminSession {
  isAdmin: boolean
  email: string
}

interface User {
  id: string
  email: string
  name?: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  last_seen?: string | null
  active_bucket?: '24h' | '7d' | '30d' | 'inactive' | 'never_active'
  core_actions_30d?: number
  active_days_30d?: number
  plan?: 'paid' | 'trial' | 'free' | 'past_due'
  role?: 'user' | 'admin' | 'commercial'
  analysis_count?: number
  verification_emails_sent?: number
  country?: string
  city?: string
  phone?: string
}

type UserSegment = 'active_30d' | 'paid_active' | 'new_7d' | 'inactive_30d' | 'all'
type PlanFilter = 'paid' | 'trial' | 'free' | 'past_due' | 'all'

export default function AdminUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Tabs (segments)
  const [activeSegment, setActiveSegment] = useState<UserSegment>('all')
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const itemsPerPage = 10
  
  // UI states
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [resendingEmail, setResendingEmail] = useState<string | null>(null)
  const [sendingToAll, setSendingToAll] = useState(false)
  
  // Options pour les filtres
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])

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

  // Charger les utilisateurs avec les filtres
  const loadUsers = useCallback(async () => {
    if (!adminSession?.isAdmin) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        segment: activeSegment,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { q: searchTerm }),
        ...(planFilter !== 'all' && { plan: planFilter }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(countryFilter && { country: countryFilter }),
        ...(cityFilter && { city: cityFilter })
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalUsers(data.pagination?.total || 0)
      } else {
        console.error('Erreur lors du chargement des utilisateurs:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }, [adminSession, activeSegment, currentPage, searchTerm, planFilter, roleFilter, countryFilter, cityFilter])

  // Charger les options de filtres
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?filters=true')
      const data = await response.json()
      if (data.success && data.filters) {
        setAvailableCountries(data.filters.countries || [])
        setAvailableCities(data.filters.cities || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des options de filtres:', error)
    }
  }, [])

  useEffect(() => {
    if (adminSession?.isAdmin) {
      loadUsers()
      loadFilterOptions()
    }
  }, [adminSession, loadUsers, loadFilterOptions])

  // Reset page quand on change de segment ou filtre
  useEffect(() => {
    setCurrentPage(1)
  }, [activeSegment, searchTerm, planFilter, roleFilter, countryFilter, cityFilter])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAdminMenu) {
        const target = event.target as Element
        if (!target.closest('.admin-menu-container')) {
          setShowAdminMenu(false)
        }
      }
      if (editingRole) {
        const target = event.target as Element
        if (!target.closest('.role-dropdown')) {
          setEditingRole(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAdminMenu, editingRole])

  const handleSignOut = () => {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_email')
    router.push('/admin/login')
  }

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.')
    const firstInitial = parts[0]?.[0]?.toUpperCase() || ''
    const secondInitial = parts[1]?.[0]?.toUpperCase() || ''
    return firstInitial + secondInitial
  }

  const getStatusColor = (bucket?: string) => {
    switch (bucket) {
      case '24h':
        return 'bg-green-100 text-green-800'
      case '7d':
        return 'bg-blue-100 text-blue-800'
      case '30d':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'never_active':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (bucket?: string) => {
    switch (bucket) {
      case '24h':
        return 'Actif 24h'
      case '7d':
        return 'Actif 7j'
      case '30d':
        return 'Actif 30j'
      case 'inactive':
        return 'Inactif'
      case 'never_active':
        return 'Jamais actif'
      default:
        return 'Inconnu'
    }
  }

  const getPlanColor = (plan?: string) => {
    switch (plan) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'trial':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-orange-100 text-orange-800'
      case 'free':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanLabel = (plan?: string) => {
    switch (plan) {
      case 'paid':
        return 'Payant'
      case 'trial':
        return 'Essai'
      case 'past_due':
        return 'En retard'
      case 'free':
        return 'Gratuit'
      default:
        return 'Gratuit'
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'commercial':
        return 'bg-blue-100 text-blue-800'
      case 'user':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'commercial':
        return 'Commercial'
      case 'user':
        return 'Utilisateur'
      default:
        return 'Utilisateur'
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })
      
      const data = await response.json()
      if (data.success) {
        loadUsers()
        setEditingRole(null)
      } else {
        alert('Erreur lors de la mise à jour du rôle: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du rôle')
    }
  }

  const formatLastActivity = (dateString?: string | null) => {
    if (!dateString) return 'Jamais'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes === 0 ? "À l'instant" : `Il y a ${diffMinutes} min`
      }
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return "Hier"
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    }
  }

  const handleViewFiles = (user: User) => {
    router.push(`/admin/fichiers?user=${user.email}`)
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ?`)) {
      return
    }
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      const data = await response.json()
      if (data.success) {
        loadUsers()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const handleResendVerification = async (user: User) => {
    if (!confirm(`Renvoyer l'email de validation à ${user.email} ?`)) {
      return
    }

    setResendingEmail(user.id)
    try {
      const response = await fetch('/api/admin/users/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`Email de validation renvoyé avec succès à ${user.email}`)
        loadUsers()
      } else {
        alert(`Erreur: ${data.error || 'Erreur lors de l\'envoi de l\'email'}`)
      }
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'email:', error)
      alert('Erreur lors du renvoi de l\'email de validation')
    } finally {
      setResendingEmail(null)
    }
  }

  if (loading && users.length === 0) {
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
    <>
      <style jsx global>{scrollbarHideStyle}</style>
      <div className="flex min-h-screen bg-[#F5F7FA]">
        {/* Sidebar */}
        <AdminSidebar activeTab="users" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex-shrink-0 ml-2 sm:ml-16 mt-4">
                <button onClick={() => router.push('/')} className="cursor-pointer">
                  <Image
                    src="/images/logo/logofinal.png"
                    alt="Cash360"
                    width={540}
                    height={540}
                    className="h-16 sm:h-32 md:h-42 w-auto hover:opacity-80 transition-opacity duration-200"
                  />
                </button>
              </div>
              
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
        <main className="p-4 sm:p-6">
          {/* Page Title */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#012F4E] mb-1 sm:mb-2">Utilisateurs</h1>
              <p className="text-sm sm:text-base text-gray-600">Gérez les comptes utilisateurs, leurs analyses et leurs relevés bancaires.</p>
            </div>
            <button
              onClick={() => {
                window.open('/api/admin/users/export-phones', '_blank')
              }}
              className="inline-flex items-center px-4 py-2 bg-[#00A1C6] text-white rounded-lg hover:bg-[#0089a3] transition-colors text-sm font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter les numéros (CSV)
            </button>
          </div>

          {/* Tabs - Scrollable sur mobile */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto scrollbar-hide" aria-label="Tabs">
                {[
                  { id: 'all', label: 'Tous', count: null },
                  { id: 'active_30d', label: 'Actifs (30j)', count: null },
                  { id: 'paid_active', label: 'Abonnés actifs', count: null },
                  { id: 'new_7d', label: 'Nouveaux (7j)', count: null },
                  { id: 'inactive_30d', label: 'Inactifs (30j+)', count: null }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSegment(tab.id as UserSegment)}
                    className={`
                      px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                      ${activeSegment === tab.id
                        ? 'border-[#00A1C6] text-[#00A1C6] bg-[#00A1C6]/5'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="lg:col-span-2 relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par nom, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                />
              </div>

              {/* Plan Filter */}
              <div className="relative">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer w-full"
                >
                  <option value="all">Tous les plans</option>
                  <option value="paid">Payant</option>
                  <option value="trial">Essai</option>
                  <option value="free">Gratuit</option>
                  <option value="past_due">En retard</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Role Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer w-full"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="user">Utilisateur</option>
                  <option value="admin">Admin</option>
                  <option value="commercial">Commercial</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Country Filter */}
              <div className="relative">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer w-full"
                >
                  <option value="">Tous les pays</option>
                  {availableCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* City Filter */}
              <div className="relative">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer w-full"
                >
                  <option value="">Toutes les villes</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Users - Table Desktop / Cards Mobile */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Utilisateur</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Téléphone</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Usage (30j)</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rôle</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Ville</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Dernière activité</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-gray-500">
                        {loading ? 'Chargement...' : 'Aucun utilisateur trouvé'}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-[#00A1C6] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                              {getInitials(user.email)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">{user.name || user.email.split('@')[0]}</div>
                              {!user.email_confirmed_at && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                                  En attente
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 truncate max-w-xs">{user.email}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {user.phone || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(user.active_bucket)}`}>
                            {getStatusLabel(user.active_bucket)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getPlanColor(user.plan)}`}>
                            {getPlanLabel(user.plan)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {user.active_days_30d !== undefined && user.core_actions_30d !== undefined ? (
                            <span className="whitespace-nowrap">
                              {user.active_days_30d}j • {user.core_actions_30d} actions
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          <div className="relative inline-block role-dropdown">
                            <button
                              onClick={() => setEditingRole(editingRole === user.id ? null : user.id)}
                              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${getRoleColor(user.role)} hover:opacity-80 transition-opacity cursor-pointer`}
                            >
                              {getRoleLabel(user.role)}
                              <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {editingRole === user.id && (
                              <div className="absolute left-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 min-w-[150px] role-dropdown">
                                {['user', 'admin', 'commercial'].map((role) => (
                                  <button
                                    key={role}
                                    onClick={async () => {
                                      await handleUpdateRole(user.id, role)
                                    }}
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                      user.role === role ? 'text-[#00A1C6] font-medium' : 'text-gray-700'
                                    }`}
                                  >
                                    {getRoleLabel(role as any)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {user.city || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">
                          {formatLastActivity(user.last_seen)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {!user.email_confirmed_at && (
                              <button 
                                onClick={() => handleResendVerification(user)} 
                                disabled={resendingEmail === user.id}
                                className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100" 
                                title="Renvoyer l'email de validation"
                              >
                                {resendingEmail === user.id ? (
                                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            )}
                            <button onClick={() => handleViewFiles(user)} className="p-1.5 text-gray-400 hover:text-[#00A1C6] transition-colors rounded-md hover:bg-gray-100" title="Voir fichiers">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                              </svg>
                            </button>
                            <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-100" title="Supprimer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {users.length === 0 ? (
                <div className="text-center py-12 text-gray-500 px-4">
                  {loading ? 'Chargement...' : 'Aucun utilisateur trouvé'}
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#00A1C6] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                          {getInitials(user.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{user.name || user.email.split('@')[0]}</div>
                          <div className="text-sm text-gray-500 truncate mt-0.5">{user.email}</div>
                          {!user.email_confirmed_at && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                              En attente
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!user.email_confirmed_at && (
                          <button 
                            onClick={() => handleResendVerification(user)} 
                            disabled={resendingEmail === user.id}
                            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 rounded-md" 
                            title="Renvoyer l'email"
                          >
                            {resendingEmail === user.id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        )}
                        <button onClick={() => handleViewFiles(user)} className="p-1.5 text-gray-400 hover:text-[#00A1C6] transition-colors rounded-md" title="Voir fichiers">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Téléphone</div>
                        <div className="text-sm text-gray-900">{user.phone || <span className="text-gray-400">-</span>}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Statut</div>
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(user.active_bucket)}`}>
                          {getStatusLabel(user.active_bucket)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Plan</div>
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getPlanColor(user.plan)}`}>
                          {getPlanLabel(user.plan)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Usage (30j)</div>
                        <div className="text-sm text-gray-900">
                          {user.active_days_30d !== undefined && user.core_actions_30d !== undefined ? (
                            <span>{user.active_days_30d}j • {user.core_actions_30d} actions</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Dernière activité</div>
                        <div className="text-sm text-gray-900">{formatLastActivity(user.last_seen)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Rôle</div>
                        <div className="relative inline-block role-dropdown">
                          <button
                            onClick={() => setEditingRole(editingRole === user.id ? null : user.id)}
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(user.role)} hover:opacity-80 transition-opacity`}
                          >
                            {getRoleLabel(user.role)}
                            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {editingRole === user.id && (
                            <div className="absolute left-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 min-w-[120px] role-dropdown">
                              {['user', 'admin', 'commercial'].map((role) => (
                                <button
                                  key={role}
                                  onClick={async () => {
                                    await handleUpdateRole(user.id, role)
                                  }}
                                  className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 transition-colors ${
                                    user.role === role ? 'text-[#00A1C6] font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  {getRoleLabel(role as any)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {user.city && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Ville</div>
                          <div className="text-sm text-gray-900">{user.city}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 sm:px-6 mt-4 sm:mt-6 rounded-lg shadow-sm">
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
                    Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalUsers)}</span> sur{' '}
                    <span className="font-medium">{totalUsers}</span> utilisateurs
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
      </div>
    </div>
    </>
  )
}
