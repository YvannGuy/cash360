'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

export default function AdminAbonnementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [terminatingId, setTerminatingId] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminSession = () => {
      const adminSessionData = localStorage.getItem('admin_session')
      const adminEmail = localStorage.getItem('admin_email')
      const adminRole = localStorage.getItem('admin_role')
      
      if (adminSessionData === 'true' && adminEmail) {
        setAdminSession({ isAdmin: true, email: adminEmail, role: adminRole as 'admin' | 'commercial' })
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
      loadSubscriptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSession, statusFilter])

  const loadSubscriptions = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/subscriptions'
        : `/api/admin/subscriptions?status=${statusFilter}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      if (data.success) {
        setSubscriptions(data.subscriptions || [])
        setStats(data.stats || {})
      } else {
        console.error('Erreur lors du chargement des abonnements:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des abonnements:', error)
    }
  }

  const handleTerminateSubscription = async (subscriptionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cet abonnement immédiatement ? L\'utilisateur perdra l\'accès aux fonctionnalités premium tout de suite.')) {
      return
    }

    setTerminatingId(subscriptionId)
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Impossible de terminer l\'abonnement')
      }

      // Recharger les abonnements
      await loadSubscriptions()
      alert('Abonnement terminé avec succès')
    } catch (error: any) {
      console.error('Erreur lors de la terminaison:', error)
      alert('Erreur: ' + (error.message || 'Impossible de terminer l\'abonnement'))
    } finally {
      setTerminatingId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      canceled: { label: 'Annulé', className: 'bg-red-100 text-red-800' },
      past_due: { label: 'En retard', className: 'bg-yellow-100 text-yellow-800' },
      trialing: { label: 'Essai', className: 'bg-blue-100 text-blue-800' },
      incomplete: { label: 'Incomplet', className: 'bg-gray-100 text-gray-800' },
      unpaid: { label: 'Non payé', className: 'bg-red-100 text-red-800' }
    }
    return badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  const filteredSubscriptions = subscriptions.filter((sub: any) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      sub.user_email?.toLowerCase().includes(search) ||
      sub.user_name?.toLowerCase().includes(search) ||
      sub.user_id?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeTab="abonnements" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Annulés</p>
              <p className="text-2xl font-bold text-red-600">{stats.canceled || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Mobile Money</p>
              <p className="text-2xl font-bold text-blue-600">{stats.mobileMoney || 0}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par email ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="canceled">Annulés</option>
                  <option value="past_due">En retard</option>
                  <option value="trialing">Essai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des abonnements */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Début
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucun abonnement trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub: any) => {
                      const statusBadge = getStatusBadge(sub.status)
                      const isMobileMoney = !sub.stripe_subscription_id || sub.price_id === 'mobile_money_manual'
                      const isActive = sub.status === 'active' || sub.status === 'trialing'
                      
                      return (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {sub.user_name || '—'}
                              </p>
                              <p className="text-sm text-gray-500">{sub.user_email || '—'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {isMobileMoney ? 'Mobile Money' : 'Stripe'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(sub.current_period_start || sub.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(sub.current_period_end || sub.grace_until)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isActive && (
                              <button
                                onClick={() => handleTerminateSubscription(sub.id)}
                                disabled={terminatingId === sub.id}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {terminatingId === sub.id ? 'Terminaison...' : 'Terminer'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

