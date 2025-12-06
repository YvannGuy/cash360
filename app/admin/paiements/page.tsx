'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
}

export default function AdminPaiementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [payments, setPayments] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [stats, setStats] = useState<any>({
    monthlyRevenue: 0,
    cumulativeRevenue: 0,
    transactions: 0,
    failureRate: 0,
    averageBasket: 0
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  useEffect(() => {
    if (adminSession?.isAdmin) {
      loadPayments()
    }
  }, [adminSession])

  const loadPayments = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/paiements')
      const data = await response.json()
      if (data.success) {
        console.log('[PAGE PAIEMENTS] Données reçues:', {
          totalPayments: data.payments?.length || 0,
          payments: data.payments?.map((p: any) => ({
            id: p.id,
            user_email: p.user_email,
            product_id: p.product_id,
            payment_type: p.payment_type,
            type_label: p.type_label,
            amount: p.amount,
            status: p.status,
            created_at: p.created_at
          }))
        })
        
        // Diagnostic: Vérifier si certains paiements manquent
        const byType = (data.payments || []).reduce((acc: any, p: any) => {
          const type = p.payment_type || 'non défini'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {})
        console.log('[PAGE PAIEMENTS] Paiements par type:', byType)
        setPayments(data.payments || [])
        setStats(data.stats || {
          monthlyRevenue: 0,
          cumulativeRevenue: 0,
          transactions: 0,
          failureRate: 0,
          averageBasket: 0
        })
        console.log('[PAGE PAIEMENTS] Paiements chargés:', data.payments?.length || 0)
      } else {
        console.error('Erreur lors du chargement des paiements:', data.error)
        alert('Erreur lors du chargement des paiements: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error)
      alert('Erreur lors du chargement des paiements')
    } finally {
      setRefreshing(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Utilisateur', 'Email', 'Type', 'Montant', 'Statut', 'Méthode', 'Date']
    const rows = payments.map((payment: any) => [
      payment.user_name || '',
      payment.user_email || '',
      payment.type_label || payment.payment_type || '',
      `${payment.amount || 0}€`,
      payment.status || '',
      payment.method || '',
      payment.created_at ? new Date(payment.created_at).toLocaleDateString('fr-FR') : ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `paiements_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleGenerateMonthlyReport = () => {
    const now = new Date()
    const month = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const monthlyPayments = payments.filter((payment: any) => {
      const paymentDate = new Date(payment.created_at)
      return paymentDate >= firstDay
    })
    
    const totalAmount = monthlyPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0)
    const totalTransactions = monthlyPayments.length
    
    const report = {
      month,
      totalAmount,
      totalTransactions,
      payments: monthlyPayments
    }
    
    const jsonContent = JSON.stringify(report, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `rapport_mensuel_${month}.json`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment)
    setShowPaymentModal(true)
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/paiements?paymentId=${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      alert('Paiement supprimé avec succès!')
      loadPayments()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  // Pagination
  const totalPages = Math.ceil(payments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPayments = payments.slice(startIndex, endIndex)

  // Reset page when payments change
  useEffect(() => {
    setCurrentPage(1)
  }, [payments])

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
      <AdminSidebar activeTab="paiements" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
              <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Paiements et Transactions</h1>
              <p className="text-gray-600">Suivez et gérez toutes les transactions effectuées sur Cash360 : analyses financières, capsules, packs complets, ebooks, abonnements et formations.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={loadPayments}
                disabled={refreshing}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={handleExportCSV}
                className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exporter CSV
              </button>
              <button 
                onClick={handleGenerateMonthlyReport}
                className="bg-[#FEBE02] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e6a802] transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Générer rapport mensuel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/debug-payments')
                    const data = await response.json()
                    console.log('[DEBUG] Tous les paiements dans la DB:', data)
                    alert(`Total dans DB: ${data.total}\nPar type: ${JSON.stringify(data.summary)}\nVoir console pour détails`)
                  } catch (error) {
                    console.error('Erreur debug:', error)
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Debug DB
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267zM10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">€{stats.monthlyRevenue.toFixed(2)}</h3>
              <p className="text-gray-600 text-sm">Revenu mensuel</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">€{stats.cumulativeRevenue.toFixed(2)}</h3>
              <p className="text-gray-600 text-sm">Revenu cumulé</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{stats.transactions}</h3>
              <p className="text-gray-600 text-sm">Transactions</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">{stats.failureRate.toFixed(1)}%</h3>
              <p className="text-gray-600 text-sm">Taux d'échec</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#012F4E] mb-1">€{stats.averageBasket.toFixed(2)}</h3>
              <p className="text-gray-600 text-sm">Panier moyen</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer">
                  <option>Tous les statuts</option>
                  <option>Réussi</option>
                  <option>Échec</option>
                  <option>En attente</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer">
                  <option>Toutes les méthodes</option>
                  <option>PayPal</option>
                  <option>Stripe</option>
                  <option>Carte bancaire</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer">
                  <option>Ce mois</option>
                  <option>Cette semaine</option>
                  <option>Cette année</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer">
                  <option>Tous les types</option>
                  <option>Analyse financière</option>
                  <option>Capsule</option>
                  <option>Pack complet</option>
                  <option>Ebook</option>
                  <option>Abonnement</option>
                  <option>Formation</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Utilisateur</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Type d'achat</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Montant (€)</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Méthode</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        Aucun paiement enregistré
                      </td>
                    </tr>
                  ) : (
                    currentPayments.map((payment: any) => {
                      const initials = getInitials(payment.user_email || payment.email || 'UN')
                      const statusColor = payment.status === 'success' ? 'green' : payment.status === 'failed' ? 'red' : payment.status === 'pending' ? 'orange' : 'gray'
                      const StatusIcon = payment.status === 'success' ? (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )
                      const statusLabel = payment.status === 'success' ? 'Réussi' : payment.status === 'failed' ? 'Échec' : payment.status === 'pending' ? 'En attente' : 'Inconnu'
                      
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full bg-[#00A1C6] flex items-center justify-center text-white font-medium text-sm`}>
                                {initials}
                              </div>
                              <span className="font-medium text-gray-900">{payment.user_name || payment.user_email?.split('@')[0] || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{payment.type_label || payment.payment_type || payment.type || 'N/A'}</td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">{parseFloat(payment.amount || 0).toFixed(2).replace('.', ',')}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {StatusIcon}
                              <span className={`text-${statusColor}-600 text-sm`}>{statusLabel}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{payment.method || 'N/A'}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {payment.created_at ? new Date(payment.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : payment.date || 'N/A'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleViewPayment(payment)} className="text-[#00A1C6] hover:text-[#0089a3] transition-colors" title="Voir détails">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeletePayment(payment.id)} 
                                className="text-red-600 hover:text-red-800 transition-colors" 
                                title="Supprimer"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
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
                    <span className="font-medium">{Math.min(endIndex, payments.length)}</span> sur{' '}
                    <span className="font-medium">{payments.length}</span> paiements
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

      {/* Modal Détails Paiement */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#012F4E]">Détails du Paiement</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Statut */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Statut</label>
                <div className="flex items-center gap-2">
                  {selectedPayment.status === 'success' ? (
                    <>
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-green-600 font-medium">Réussi</span>
                    </>
                  ) : selectedPayment.status === 'failed' ? (
                    <>
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-red-600 font-medium">Échec</span>
                    </>
                  ) : (
                    <span className="text-orange-600 font-medium">En attente</span>
                  )}
                </div>
              </div>

              {/* Informations Utilisateur */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Utilisateur</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#00A1C6] flex items-center justify-center text-white font-medium">
                    {getInitials(selectedPayment.user_email || selectedPayment.email || 'UN')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedPayment.user_name || selectedPayment.user_email?.split('@')[0] || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{selectedPayment.user_email || selectedPayment.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Type de Paiement */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Type</label>
                <p className="text-gray-900">{selectedPayment.type_label || selectedPayment.payment_type || selectedPayment.type || 'N/A'}</p>
              </div>

              {/* Montant */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Montant</label>
                <p className="text-2xl font-bold text-[#012F4E]">{parseFloat(selectedPayment.amount || 0).toFixed(2).replace('.', ',')}€</p>
              </div>

              {/* Méthode de Paiement */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Méthode de Paiement</label>
                <p className="text-gray-900">{selectedPayment.method || 'N/A'}</p>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Date</label>
                <p className="text-gray-900">
                  {selectedPayment.created_at 
                    ? new Date(selectedPayment.created_at).toLocaleDateString('fr-FR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : selectedPayment.date || 'N/A'}
                </p>
              </div>

              {/* Transaction ID */}
              {selectedPayment.transaction_id && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">ID Transaction</label>
                  <p className="text-gray-900 font-mono text-sm break-all">{selectedPayment.transaction_id}</p>
                </div>
              )}

              {/* Description */}
              {selectedPayment.description && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
                  <p className="text-gray-900">{selectedPayment.description}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2 bg-[#012F4E] text-white rounded-lg font-medium hover:bg-[#011a28] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

