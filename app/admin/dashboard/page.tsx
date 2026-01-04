'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { Tooltip } from '@/components/Helpers'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

interface Metrics {
  totalUsers: number
  newUsers24h: number
  newUsers7d: number
  newUsers30d: number
  activeUsers7d: number
  activeUsers30d: number
  emailVerifiedCount: number
  emailVerifiedRate: number
  activeSubscriptions: number
  mrr: number
  revenueMonth: number
  paymentsCount: number
  variations: {
    newUsers24h: number
    newUsers7d: number
    newUsers30d: number
    activeUsers7d: number
    activeUsers30d: number
    mrr: number
    revenueMonth: number
  }
}

// Interfaces supprimées - on repart de zéro pour les métriques d'usage et boutique

interface GeoMetrics {
  regionsBreakdown: Array<{
    region: string
    users: number
    active30d: number
    paidUsers: number
    revenue30d: number
  }>
  countriesTopUsers: Array<{
    country: string
    users: number
    active30d: number
    paidUsers: number
    revenue30d: number
    conversionRate: number
    activeRate: number
  }>
  citiesTopUsers: Array<{
    city: string
    country: string
    users: number
    active30d: number
  }>
  unknownShare: {
    unknownUsers: number
    totalUsers: number
    percent: number
  }
  recommendations: {
    highPotentialCountries: Array<{
      country: string
      users: number
      conversionRate: number
    }>
    highPerformanceCountries: Array<{
      country: string
      users: number
      conversionRate: number
      activeRate: number
    }>
    topCitiesForEvents: Array<{
      city: string
      country: string
      users: number
      active30d: number
    }>
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [geoMetrics, setGeoMetrics] = useState<GeoMetrics | null>(null)
  const [paidUsageMetrics, setPaidUsageMetrics] = useState<any>(null)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [range, setRange] = useState<'7d' | '30d'>('30d')
  const [geoRange, setGeoRange] = useState<'7d' | '30d' | '90d' | '365d'>('30d')
  const [geoModuleVisible, setGeoModuleVisible] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

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
      loadMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSession, range])

  useEffect(() => {
    if (geoModuleVisible && adminSession?.isAdmin) {
      loadGeoMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoRange, geoModuleVisible, adminSession])

  const loadMetrics = async () => {
    setLoadingMetrics(true)
    try {
      const [overviewRes, simpleRes, paidUsageRes] = await Promise.all([
        fetch(`/api/admin/metrics/overview?range=${range}`),
        fetch(`/api/admin/metrics/simple?range=${range}`),
        fetch(`/api/admin/metrics/paid-usage?range=${range}`)
      ])

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json()
        if (overviewData.success) {
          setMetrics(overviewData.metrics)
        }
      }

      if (simpleRes.ok) {
        const simpleData = await simpleRes.json()
        if (simpleData.success) {
          setSimpleMetrics(simpleData)
        }
      }

      if (paidUsageRes.ok) {
        const paidUsageData = await paidUsageRes.json()
        if (paidUsageData.success) {
          setPaidUsageMetrics(paidUsageData)
        }
      }

      // Charger geo seulement si le module est visible
      if (geoModuleVisible) {
        loadGeoMetrics()
      }
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error)
    } finally {
      setLoadingMetrics(false)
    }
  }

  const loadGeoMetrics = async () => {
    setLoadingGeo(true)
    try {
      const geoRes = await fetch(`/api/admin/metrics/geo?range=${geoRange}`)
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        if (geoData.success) {
          setGeoMetrics(geoData.geo)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des métriques géographiques:', error)
    } finally {
      setLoadingGeo(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getVariationColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getVariationIcon = (value: number) => {
    if (value > 0) return '↑'
    if (value < 0) return '↓'
    return '→'
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
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar activeTab="dashboard" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
                <p className="text-xs sm:text-sm text-gray-600">Vue d'ensemble des métriques clés</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as '7d' | '30d')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
              </select>
              <button
                onClick={loadMetrics}
                disabled={loadingMetrics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {loadingMetrics ? 'Chargement...' : 'Actualiser'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {loadingMetrics && !metrics ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des métriques...</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Utilisateurs totaux */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                      <Tooltip content="Nombre total d'utilisateurs ayant créé un compte sur la plateforme, toutes périodes confondues.">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-200">?</span>
                      </Tooltip>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{metrics?.totalUsers.toLocaleString() || 0}</p>
                </div>

                {/* Nouveaux utilisateurs */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">Nouveaux ({range})</p>
                      <Tooltip content={`Nombre d'utilisateurs ayant créé un compte dans les ${range === '7d' ? '7 derniers jours' : '30 derniers jours'}. Le pourcentage indique l'évolution par rapport à la période précédente.`}>
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-200">?</span>
                      </Tooltip>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getVariationColor(metrics?.variations.newUsers30d || 0)} bg-opacity-10`}>
                      {getVariationIcon(metrics?.variations.newUsers30d || 0)} {Math.abs(metrics?.variations.newUsers30d || 0)}%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {range === '7d' ? metrics?.newUsers7d.toLocaleString() : metrics?.newUsers30d.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">24h: <span className="font-semibold text-gray-700">{metrics?.newUsers24h || 0}</span></p>
                </div>

                {/* Email validé */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">Email validé</p>
                      <Tooltip content="Nombre d'utilisateurs ayant vérifié leur adresse email. Un email vérifié est nécessaire pour accéder aux fonctionnalités premium.">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-200">?</span>
                      </Tooltip>
                    </div>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{metrics?.emailVerifiedCount.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatPercent(metrics?.emailVerifiedRate || 0)} du total</p>
                </div>

                {/* Abonnements actifs */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">Abonnements actifs</p>
                      <Tooltip content="Nombre d'abonnements actuellement actifs (statut 'active' ou 'trialing') ou en période de grâce (past_due avec grace_until valide). Ces utilisateurs ont accès aux fonctionnalités premium.">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-200">?</span>
                      </Tooltip>
                    </div>
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{metrics?.activeSubscriptions.toLocaleString() || 0}</p>
                </div>

                {/* MRR */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">MRR</p>
                      <Tooltip content="Monthly Recurring Revenue (Revenu récurrent mensuel) : montant total des revenus mensuels générés par tous les abonnements actifs à l'instant présent. Inclut les abonnements 'active', 'trialing' et 'past_due' avec période de grâce valide. C'est un indicateur clé de la santé financière de l'entreprise. Le pourcentage indique l'évolution par rapport à la même période du mois précédent.">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-200">?</span>
                      </Tooltip>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getVariationColor(metrics?.variations.mrr || 0)} bg-opacity-10`}>
                      {getVariationIcon(metrics?.variations.mrr || 0)} {Math.abs(metrics?.variations.mrr || 0)}%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{formatCurrency(metrics?.mrr || 0)}</p>
                </div>

                {/* Revenus du mois */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">Revenus ({range})</p>
                      <Tooltip content={`Montant total des revenus générés sur les ${range === '7d' ? '7 derniers jours' : '30 derniers jours'}, incluant les abonnements et les achats ponctuels (capsules, analyses, etc.).`}>
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-200">?</span>
                      </Tooltip>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getVariationColor(metrics?.variations.revenueMonth || 0)} bg-opacity-10`}>
                      {getVariationIcon(metrics?.variations.revenueMonth || 0)} {Math.abs(metrics?.variations.revenueMonth || 0)}%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{formatCurrency(metrics?.revenueMonth || 0)}</p>
                </div>

                {/* Paiements */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">Paiements ({range})</p>
                      <Tooltip content={`Nombre total de transactions réussies sur les ${range === '7d' ? '7 derniers jours' : '30 derniers jours'}, incluant les abonnements, capsules, analyses financières et autres produits.`}>
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-200">?</span>
                      </Tooltip>
                    </div>
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{metrics?.paymentsCount.toLocaleString() || 0}</p>
                </div>

                {/* Utilisateurs actifs */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">Actifs ({range})</p>
                      <Tooltip content={`Nombre d'utilisateurs ayant eu une activité sur la plateforme dans les ${range === '7d' ? '7 derniers jours' : '30 derniers jours'}. Un utilisateur est considéré actif s'il a utilisé au moins un outil (Budget, Debt Free, Jeûne Financier) ou interagi avec le panier.`}>
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full text-xs cursor-help hover:bg-gray-200">?</span>
                      </Tooltip>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getVariationColor(metrics?.variations.activeUsers30d || 0)} bg-opacity-10`}>
                      {getVariationIcon(metrics?.variations.activeUsers30d || 0)} {Math.abs(metrics?.variations.activeUsers30d || 0)}%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-indigo-600">
                    {range === '7d' ? metrics?.activeUsers7d.toLocaleString() : metrics?.activeUsers30d.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">7j: <span className="font-semibold text-gray-700">{metrics?.activeUsers7d || 0}</span></p>
                </div>
              </div>

              {/* Section Métriques - Usage des abonnés actifs */}
              {paidUsageMetrics && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Usage des outils et panier</h2>
                  
                  {/* Outils - Abonnés actifs */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Usage des abonnés (30j)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Budget */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-600">Budget & Suivi</p>
                          <Tooltip content="Nombre d'abonnés actifs ayant utilisé l'outil Budget & Suivi sur 30 jours. Les actions comptent les sauvegardes de budget et ajouts de dépenses. Les sessions représentent les visites distinctes de l'outil.">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-600 rounded-full text-xs cursor-help hover:bg-blue-200">?</span>
                          </Tooltip>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {paidUsageMetrics.tools.budget.paidUsersUsed} / {paidUsageMetrics.tools.budget.totalActive}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {paidUsageMetrics.tools.budget.sessions} sessions • {paidUsageMetrics.tools.budget.coreActions} actions
                        </p>
                        {paidUsageMetrics.tools.budget.lastActivity && (
                          <p className="text-xs text-gray-400 mt-1">
                            Dernière activité: {new Date(paidUsageMetrics.tools.budget.lastActivity).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      {/* Debt Free */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-600">Debt Free</p>
                          <Tooltip content="Nombre d'abonnés actifs ayant utilisé l'outil Debt Free sur 30 jours. Les actions comptent les ajouts de dettes et paiements de dettes enregistrés dans le budget. Les sessions représentent les visites distinctes de l'outil.">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full text-xs cursor-help hover:bg-green-200">?</span>
                          </Tooltip>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {paidUsageMetrics.tools.debt_free.paidUsersUsed} / {paidUsageMetrics.tools.debt_free.totalActive}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {paidUsageMetrics.tools.debt_free.sessions} sessions • {paidUsageMetrics.tools.debt_free.coreActions} actions
                        </p>
                        {paidUsageMetrics.tools.debt_free.lastActivity && (
                          <p className="text-xs text-gray-400 mt-1">
                            Dernière activité: {new Date(paidUsageMetrics.tools.debt_free.lastActivity).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      {/* Fast */}
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-600">Jeûne Financier</p>
                          <Tooltip content="Nombre d'abonnés actifs ayant utilisé l'outil Jeûne Financier sur 30 jours. Les actions comptent les démarrages de jeûne et les jours logués (marqués comme respectés ou non). Les sessions représentent les visites distinctes de l'outil.">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-purple-100 text-purple-600 rounded-full text-xs cursor-help hover:bg-purple-200">?</span>
                          </Tooltip>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          {paidUsageMetrics.tools.fast.paidUsersUsed} / {paidUsageMetrics.tools.fast.totalActive}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {paidUsageMetrics.tools.fast.sessions} sessions • {paidUsageMetrics.tools.fast.coreActions} actions
                        </p>
                        {paidUsageMetrics.tools.fast.lastActivity && (
                          <p className="text-xs text-gray-400 mt-1">
                            Dernière activité: {new Date(paidUsageMetrics.tools.fast.lastActivity).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panier */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Activité panier ({range})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-600">Paniers ouverts</p>
                          <Tooltip content="Nombre de fois où un utilisateur a ouvert son panier d'achat (clic sur l'icône panier). Un panier est considéré ouvert même s'il est vide.">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-xs cursor-help hover:bg-gray-300">?</span>
                          </Tooltip>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{paidUsageMetrics.cart.cartsOpened}</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-600">Checkouts démarrés</p>
                          <Tooltip content="Nombre d'utilisateurs ayant cliqué sur 'Passer la commande' pour démarrer le processus de paiement. C'est l'étape après l'ouverture du panier.">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-yellow-100 text-yellow-700 rounded-full text-xs cursor-help hover:bg-yellow-200">?</span>
                          </Tooltip>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{paidUsageMetrics.cart.checkoutsStarted}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-600">Achats complétés</p>
                          <Tooltip content="Nombre de transactions réussies et finalisées. Un achat est complété lorsque le paiement est validé et que la commande est confirmée.">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-700 rounded-full text-xs cursor-help hover:bg-green-200">?</span>
                          </Tooltip>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{paidUsageMetrics.cart.purchasesCompleted}</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-600">Paniers abandonnés</p>
                          <Tooltip content="Nombre de paniers où un checkout a été démarré mais l'achat n'a pas été complété. Un panier abandonné = checkout démarré mais pas d'achat complété.">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-red-100 text-red-700 rounded-full text-xs cursor-help hover:bg-red-200">?</span>
                          </Tooltip>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{paidUsageMetrics.cart.abandoned}</p>
                      </div>
                    </div>
                    {paidUsageMetrics.cart.cartsOpened > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Taux de conversion:</span>{' '}
                            {paidUsageMetrics.cart.conversionRate}%
                          </p>
                          <Tooltip content="Pourcentage de paniers ouverts qui se sont transformés en achats complétés. Calcul: (Achats complétés / Paniers ouverts) × 100. Un taux élevé indique une bonne conversion.">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-700 rounded-full text-xs cursor-help hover:bg-blue-200">?</span>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section Impact géographique - Lazy loaded */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Impact géographique</h2>
                  {geoModuleVisible ? (
                    <select
                      value={geoRange}
                      onChange={(e) => setGeoRange(e.target.value as '7d' | '30d' | '90d' | '365d')}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
                    >
                      <option value="7d">7 derniers jours</option>
                      <option value="30d">30 derniers jours</option>
                      <option value="90d">90 derniers jours</option>
                      <option value="365d">12 derniers mois</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => setGeoModuleVisible(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto whitespace-nowrap"
                    >
                      Charger les données géographiques
                    </button>
                  )}
                </div>

                {loadingGeo ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des données géographiques...</p>
                  </div>
                ) : geoMetrics ? (
                  <>

                  {/* A) Répartition utilisateurs */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">A) Répartition utilisateurs (Impact brut)</h3>
                    
                    {/* KPI Inconnu */}
                    {geoMetrics.unknownShare.percent > 0 && (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-yellow-800">Localisation inconnue</p>
                            <p className="text-xs text-yellow-600 mt-1">{geoMetrics.unknownShare.unknownUsers} utilisateurs ({formatPercent(geoMetrics.unknownShare.percent)})</p>
                          </div>
                          <span className="text-2xl font-bold text-yellow-600">{formatPercent(geoMetrics.unknownShare.percent)}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Répartition par région */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Par région (Top 6)</h4>
                        <div className="space-y-2">
                          {geoMetrics.regionsBreakdown.slice(0, 6).map((region, index) => (
                            <div key={region.region} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-blue-100 text-blue-700">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-gray-900">{region.region}</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{region.users}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top 5 pays avec graphique bar */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top 5 pays</h4>
                        {/* Graphique bar simple */}
                        <div className="space-y-3 mb-3">
                          {geoMetrics.countriesTopUsers.slice(0, 5).map((country) => {
                            const maxUsers = geoMetrics.countriesTopUsers[0]?.users || 1
                            const percentage = (country.users / maxUsers) * 100
                            return (
                              <div key={country.country} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-gray-700">{country.country}</span>
                                  <span className="font-semibold text-gray-900">{country.users}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {/* Liste détaillée */}
                        <div className="space-y-2 mt-4">
                          {geoMetrics.countriesTopUsers.slice(0, 5).map((country, index) => (
                            <div key={country.country} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold bg-green-100 text-green-700">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-gray-900">{country.country}</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{country.users}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top 5 villes */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top 5 villes</h4>
                        <div className="space-y-2">
                          {geoMetrics.citiesTopUsers.slice(0, 5).map((city) => (
                            <div key={`${city.city}-${city.country}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-medium text-gray-900">{city.city}</span>
                                  <span className="text-xs text-gray-500 ml-1">({city.country})</span>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{city.users}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* B) Performance business par pays */}
                  <div className="mb-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">B) Performance business par pays</h3>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Top 5 par revenu */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top 5 pays par revenu</h4>
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                            <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Pays</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Users</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Actifs 30j</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Revenu</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Conv.</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {[...geoMetrics.countriesTopUsers]
                                .sort((a, b) => b.revenue30d - a.revenue30d)
                                .slice(0, 5)
                                .map((country) => (
                                  <tr key={country.country} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{country.country}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{country.users}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{country.active30d}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-emerald-600">{formatCurrency(country.revenue30d)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        country.conversionRate > 20 ? 'bg-green-100 text-green-800' :
                                        country.conversionRate > 10 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {formatPercent(country.conversionRate)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Top 5 par conversion */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top 5 pays par conversion</h4>
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                            <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Pays</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Users</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Actifs 30j</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Paid</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Conv.</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {[...geoMetrics.countriesTopUsers]
                                .filter(c => c.users >= 3)
                                .sort((a, b) => b.conversionRate - a.conversionRate)
                                .slice(0, 5)
                                .map((country) => (
                                  <tr key={country.country} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{country.country}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{country.users}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{country.active30d}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{country.paidUsers}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        country.conversionRate > 20 ? 'bg-green-100 text-green-800' :
                                        country.conversionRate > 10 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {formatPercent(country.conversionRate)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* C) Décision opérationnelle */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">C) Décision opérationnelle (Recommandations)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Top 3 pays à fort potentiel */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3">🎯 Top 3 pays à fort potentiel</h4>
                        <p className="text-xs text-blue-600 mb-3">Beaucoup d'utilisateurs + faible conversion = opportunité marketing</p>
                        <div className="space-y-2">
                          {geoMetrics.recommendations.highPotentialCountries.length > 0 ? (
                            geoMetrics.recommendations.highPotentialCountries.map((country, index) => (
                              <div key={country.country} className="p-2 bg-white rounded border border-blue-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">{index + 1}. {country.country}</span>
                                  <span className="text-xs text-gray-600">{country.users} users</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Conversion: {formatPercent(country.conversionRate)}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">Aucune donnée disponible</p>
                          )}
                        </div>
                      </div>

                      {/* Top 3 pays à forte performance */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-800 mb-3">🚀 Top 3 pays à forte performance</h4>
                        <p className="text-xs text-green-600 mb-3">Conversion + actifs élevés = pays à scaler / ambassador</p>
                        <div className="space-y-2">
                          {geoMetrics.recommendations.highPerformanceCountries.length > 0 ? (
                            geoMetrics.recommendations.highPerformanceCountries.map((country, index) => (
                              <div key={country.country} className="p-2 bg-white rounded border border-green-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">{index + 1}. {country.country}</span>
                                  <span className="text-xs text-gray-600">{country.users} users</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Conv: {formatPercent(country.conversionRate)} | Actifs: {formatPercent(country.activeRate)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">Aucune donnée disponible</p>
                          )}
                        </div>
                      </div>

                      {/* Top 3 villes pour événement */}
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-purple-800 mb-3">📍 Top 3 villes pour événement</h4>
                        <p className="text-xs text-purple-600 mb-3">Concentration utilisateurs + actifs 30j élevés</p>
                        <div className="space-y-2">
                          {geoMetrics.recommendations.topCitiesForEvents.length > 0 ? (
                            geoMetrics.recommendations.topCitiesForEvents.map((city, index) => (
                              <div key={`${city.city}-${city.country}`} className="p-2 bg-white rounded border border-purple-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">{index + 1}. {city.city}</span>
                                  <span className="text-xs text-gray-600">{city.users} users</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {city.country} | Actifs: {city.active30d}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">Aucune donnée disponible</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  </>
                ) : geoModuleVisible ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-2">Données en cours de collecte</p>
                    <p className="text-sm text-gray-500">
                      Les données géographiques ne sont pas encore disponibles. Vérifiez que les utilisateurs ont renseigné leur localisation.
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
