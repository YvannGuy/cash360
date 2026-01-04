'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
}

export default function AdminMesAchatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    total: 0,
    pending: 0,
    paid: 0,
    rejected: 0,
    mobileMoney: 0,
    stripe: 0,
    totalRevenue: 0
  })
  const [filters, setFilters] = useState({
    userId: '',
    status: '',
    paymentMethod: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [refreshing, setRefreshing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [showAdminMenu, setShowAdminMenu] = useState(false)

  // Formulaire création
  const [newOrder, setNewOrder] = useState({
    userId: '',
    productId: '',
    productName: '',
    amount: '',
    amountFcfa: '',
    paymentMethod: 'stripe',
    operator: '',
    msisdn: '',
    txRef: ''
  })

  const loadOrders = useCallback(async () => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams()
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.status) params.append('status', filters.status)
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod)

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        console.log('[ADMIN] Commandes chargées:', data.orders?.length || 0)
        console.log('[ADMIN] Commandes mobile_money:', data.orders?.filter((o: any) => o.payment_method === 'mobile_money').map((o: any) => ({
          id: o.id,
          operator: o.operator,
          status: o.status,
          product_id: o.product_id,
          product_name: o.product_name
        })))
        console.log('[ADMIN] Commandes Congo:', data.orders?.filter((o: any) => o.operator === 'congo_mobile_money').map((o: any) => ({
          id: o.id,
          operator: o.operator,
          status: o.status,
          product_id: o.product_id,
          product_name: o.product_name,
          created_at: o.created_at
        })))
        console.log('[ADMIN] Toutes les commandes avec operator:', data.orders?.map((o: any) => ({
          id: o.id,
          operator: o.operator,
          payment_method: o.payment_method,
          status: o.status
        })))
        setOrders(data.orders || [])
        setStats(data.stats || {})
      } else {
        console.error('Erreur chargement commandes:', data.error)
        alert('Erreur lors du chargement des commandes: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error)
      alert('Erreur lors du chargement des commandes')
    } finally {
      setRefreshing(false)
    }
  }, [filters])

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error)
    }
  }, [])

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
      loadOrders()
      loadUsers()
      loadProducts()
    }
  }, [adminSession, filters, loadOrders, loadUsers, loadProducts])

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

  const handleValidateOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir valider cette commande ?')) return

    try {
      const adminEmail = localStorage.getItem('admin_email')
      const adminUser = users.find((u: any) => u.email === adminEmail)
      const validatedBy = adminUser?.id || null

      console.log('[ADMIN] Validation commande:', { orderId, status: 'paid', validatedBy })

      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'paid', validatedBy })
      })

      const data = await response.json()
      
      console.log('[ADMIN] Réponse validation:', data)
      
      if (data.success) {
        alert('Commande validée avec succès')
        loadOrders()
        setShowOrderModal(false)
      } else {
        console.error('[ADMIN] Erreur validation:', data.error)
        alert('Erreur lors de la validation: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('[ADMIN] Erreur validation:', error)
      alert('Erreur lors de la validation')
    }
  }

  const handleRejectOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette commande ?')) return

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'rejected' })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Commande rejetée')
        loadOrders()
        setShowOrderModal(false)
      } else {
        alert('Erreur lors du rejet: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur rejet:', error)
      alert('Erreur lors du rejet')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.')) return

    try {
      const response = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Commande supprimée avec succès')
        loadOrders()
        setShowOrderModal(false)
      } else {
        alert('Erreur lors de la suppression: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleCreateOrder = async () => {
    if (!newOrder.userId || !newOrder.productId || !newOrder.productName || !newOrder.amount) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Commande créée avec succès')
        setShowCreateModal(false)
        setNewOrder({
          userId: '',
          productId: '',
          productName: '',
          amount: '',
          amountFcfa: '',
          paymentMethod: 'stripe',
          operator: '',
          msisdn: '',
          txRef: ''
        })
        loadOrders()
      } else {
        alert('Erreur lors de la création: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur création:', error)
      alert('Erreur lors de la création')
    }
  }

  // Filtrer les commandes par recherche
  const filteredOrders = orders.filter((order: any) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        order.user_email?.toLowerCase().includes(searchLower) ||
        order.user_name?.toLowerCase().includes(searchLower) ||
        order.product_name?.toLowerCase().includes(searchLower) ||
        order.product_id?.toLowerCase().includes(searchLower) ||
        order.transaction_id?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; className: string } } = {
      pending_review: { text: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      paid: { text: 'Payé', className: 'bg-green-100 text-green-800' },
      rejected: { text: 'Rejeté', className: 'bg-red-100 text-red-800' }
    }
    const badge = badges[status] || { text: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    )
  }

  const getPaymentMethodBadge = (method: string) => {
    if (method === 'mobile_money') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Mobile Money</span>
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Stripe</span>
  }

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
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar activeTab="mes-achats-utilisateurs" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-64">
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

        <main className="p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Mes achats utilisateurs</h1>
            <p className="text-gray-600">Gérer les achats de tous les utilisateurs (Stripe et Mobile Money)</p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">En attente</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Payé</div>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Revenus</div>
              <div className="text-2xl font-bold text-blue-600">{(stats.totalRevenue || 0).toFixed(2)}€</div>
            </div>
          </div>

          {/* Filtres et actions */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par email, nom, produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending_review">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>
              <div>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les méthodes</option>
                  <option value="stripe">Stripe</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div>
                <select
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les utilisateurs</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadOrders()}
                  disabled={refreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {refreshing ? '...' : 'Actualiser'}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Liste des commandes */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.user_name || order.user_email?.split('@')[0] || 'Utilisateur inconnu'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user_email || `ID: ${order.user_id?.substring(0, 8)}...` || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.product_name}
                          {order.is_virtual && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Virtuel</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{order.product_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.amount?.toFixed(2)}€</div>
                        {order.amount_fcfa && (
                          <div className="text-sm text-gray-500">{order.amount_fcfa.toLocaleString('fr-FR')} FCFA</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(order.payment_method)}
                        {order.payment_method === 'mobile_money' && order.operator && (
                          <div className="text-xs text-gray-500 mt-1">
                            {order.operator === 'orange_money' ? 'Orange Money' : order.operator === 'wave' ? 'Wave' : order.operator === 'congo_mobile_money' ? 'Mobile Money RDC' : order.operator}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOrderModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Voir
                        </button>
                        {!order.is_virtual && order.status === 'pending_review' && (
                          <>
                            <button
                              onClick={() => handleValidateOrder(order.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              className="text-red-600 hover:text-red-900 mr-3"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                        {order.is_virtual && (
                          <span className="ml-2 text-xs text-gray-500 italic">(virtuel)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Affichage de <span className="font-medium">{startIndex + 1}</span> à <span className="font-medium">{Math.min(endIndex, filteredOrders.length)}</span> sur <span className="font-medium">{filteredOrders.length}</span> résultats
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                      >
                        Précédent
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === i + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                      >
                        Suivant
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal détails commande */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Détails de la commande</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Utilisateur</h3>
                  <p className="text-gray-900">{selectedOrder.user_name || 'N/A'}</p>
                  <p className="text-gray-600 text-sm">{selectedOrder.user_email || 'N/A'}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Produit</h3>
                  <p className="text-gray-900">{selectedOrder.product_name}</p>
                  <p className="text-gray-600 text-sm">ID: {selectedOrder.product_id}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Montant</h3>
                  <p className="text-gray-900 text-lg font-bold">{selectedOrder.amount?.toFixed(2)}€</p>
                  {selectedOrder.amount_fcfa && (
                    <p className="text-gray-600 text-sm">{selectedOrder.amount_fcfa.toLocaleString('fr-FR')} FCFA</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Méthode de paiement</h3>
                  {getPaymentMethodBadge(selectedOrder.payment_method)}
                  {selectedOrder.payment_method === 'mobile_money' && (
                    <div className="mt-2 space-y-1">
                      {selectedOrder.operator && (
                        <p className="text-sm text-gray-600">Opérateur: {selectedOrder.operator === 'orange_money' ? 'Orange Money' : selectedOrder.operator === 'wave' ? 'Wave' : 'Mobile Money RDC'}</p>
                      )}
                      {selectedOrder.msisdn && (
                        <p className="text-sm text-gray-600">Téléphone: {selectedOrder.msisdn}</p>
                      )}
                      {selectedOrder.tx_ref && (
                        <p className="text-sm text-gray-600">Référence transaction: {selectedOrder.tx_ref}</p>
                      )}
                      {selectedOrder.proof_path && (
                        <p className="text-sm text-gray-600">Preuve: {selectedOrder.proof_path}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Statut</h3>
                  {getStatusBadge(selectedOrder.status)}
                  {selectedOrder.validated_at && (
                    <p className="text-sm text-gray-600 mt-2">Validé le: {new Date(selectedOrder.validated_at).toLocaleString('fr-FR')}</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Transaction</h3>
                  <p className="text-gray-900 font-mono text-sm">{selectedOrder.transaction_id}</p>
                  <p className="text-gray-600 text-sm">Créé le: {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}</p>
                </div>

                {!selectedOrder.is_virtual && selectedOrder.status === 'pending_review' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleValidateOrder(selectedOrder.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => handleRejectOrder(selectedOrder.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
                {selectedOrder.is_virtual && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 italic">
                      Cet achat est une entrée virtuelle créée depuis user_capsules. Il n'est pas possible de le valider ou rejeter car il n'existe pas dans la table orders.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal création commande */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Créer une commande</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur *</label>
                  <select
                    value={newOrder.userId}
                    onChange={(e) => setNewOrder({ ...newOrder, userId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>{user.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                  <select
                    value={newOrder.productId}
                    onChange={(e) => {
                      const product = products.find((p: any) => p.id === e.target.value)
                      setNewOrder({
                        ...newOrder,
                        productId: e.target.value,
                        productName: product?.name || e.target.value
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map((product: any) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                  <input
                    type="text"
                    value={newOrder.productName}
                    onChange={(e) => setNewOrder({ ...newOrder, productName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (EUR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOrder.amount}
                    onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de paiement *</label>
                  <select
                    value={newOrder.paymentMethod}
                    onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                {newOrder.paymentMethod === 'mobile_money' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                      <input
                        type="number"
                        value={newOrder.amountFcfa}
                        onChange={(e) => setNewOrder({ ...newOrder, amountFcfa: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Opérateur</label>
                      <select
                        value={newOrder.operator}
                        onChange={(e) => setNewOrder({ ...newOrder, operator: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="wave">Wave</option>
                        <option value="congo_mobile_money">Mobile Money RDC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={newOrder.msisdn}
                        onChange={(e) => setNewOrder({ ...newOrder, msisdn: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Référence transaction</label>
                      <input
                        type="text"
                        value={newOrder.txRef}
                        onChange={(e) => setNewOrder({ ...newOrder, txRef: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

