'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'
import AdminPdfUploadModal from '@/components/AdminPdfUploadModal'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const paymentsRef = useRef<any[]>([])
  const [formations, setFormations] = useState<any[]>([])
  const [paymentStats, setPaymentStats] = useState<any>({})
  const [activeSubscriptions, setActiveSubscriptions] = useState<number>(0)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)
  const [searchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refreshingOverview, setRefreshingOverview] = useState(false)

  useEffect(() => {
    const checkAdminSession = () => {
      const adminSessionData = localStorage.getItem('admin_session')
      const adminEmail = localStorage.getItem('admin_email')
      const adminRole = localStorage.getItem('admin_role')
      
      if (adminSessionData === 'true' && adminEmail) {
        setAdminSession({ isAdmin: true, email: adminEmail, role: adminRole as 'admin' | 'commercial' })
        // Rediriger les commerciaux vers leur page
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

  const loadAllAnalyses = async () => {
    try {
      const response = await fetch('/api/admin/analyses')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      if (data.success) {
        setAnalyses(data.analyses || [])
      } else {
        console.error('Erreur lors du chargement des analyses:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error)
    }
  }

  const loadAllUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users || [])
      } else {
        console.error('Erreur lors du chargement des utilisateurs:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/admin/paiements')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      if (data.success) {
        console.log(`[ADMIN DASHBOARD] ${data.payments?.length || 0} paiements chargés`)
        const paymentsData = data.payments || []
        setPayments(paymentsData)
        paymentsRef.current = paymentsData
        setPaymentStats(data.stats || {})
        
        // Log spécifique pour les abonnements
        const subscriptions = paymentsData.filter((p: any) => 
          p.payment_type === 'abonnement' || 
          p.payment_type === 'subscription' || 
          p.product_id === 'abonnement' ||
          p.type_label?.toLowerCase().includes('abonnement')
        )
        console.log(`[ADMIN DASHBOARD] ${subscriptions.length} abonnement(s) dans les paiements chargés`)
      } else {
        console.error('Erreur lors du chargement des paiements:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error)
    }
  }

  const loadActiveSubscriptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscriptions?status=active')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      if (data.success) {
        const activeCount = data.subscriptions?.filter((sub: any) => 
          sub.status === 'active' || sub.status === 'trialing'
        ).length || 0
        setActiveSubscriptions(activeCount)
        console.log(`[ADMIN DASHBOARD] ${activeCount} abonnement(s) actif(s)`)
      } else {
        console.error('Erreur lors du chargement des abonnements actifs:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des abonnements actifs:', error)
      // Fallback: compter depuis les paiements si l'API subscriptions n'est pas disponible
      // Utilisation de paymentsRef pour éviter la dépendance qui cause la boucle infinie
      const activeFromPayments = paymentsRef.current.filter((p: any) => 
        (p.payment_type === 'abonnement' || p.product_id === 'abonnement') &&
        (p.status === 'paid' || p.status === 'active' || p.status === 'success')
      ).length
      if (activeFromPayments > 0) {
        setActiveSubscriptions(activeFromPayments)
      }
    }
  }, [])

  const loadFormations = async () => {
    try {
      const response = await fetch('/api/admin/formations')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      if (data.success) {
        setFormations(data.formations || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error)
    }
  }

  useEffect(() => {
    if (adminSession?.isAdmin) {
      // Charger les données de façon séquentielle pour éviter la surcharge
      const loadData = async () => {
        await loadAllAnalyses()
        await loadAllUsers()
        await loadPayments()
        await loadFormations()
        await loadActiveSubscriptions()
      }
      loadData()
      
      // Actualisation automatique toutes les 5 minutes
      const interval = setInterval(() => {
        console.log('[ADMIN DASHBOARD] Actualisation automatique des données...')
        loadData()
      }, 5 * 60 * 1000) // 5 minutes
      
      return () => clearInterval(interval)
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

  const handleRefreshOverview = async () => {
    setRefreshingOverview(true)
    try {
      await Promise.all([loadAllAnalyses(), loadAllUsers(), loadPayments(), loadFormations()])
    } catch (error) {
      console.error('Erreur lors de l’actualisation du dashboard admin:', error)
    } finally {
      setRefreshingOverview(false)
    }
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-800'
      case 'en_analyse':
        return 'bg-blue-100 text-blue-800'
      case 'terminee':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (email?: string) => {
    if (!email) return 'A'
    const parts = email.split('@')[0]
    return parts.substring(0, 2).toUpperCase()
  }

  const handlePdfUploadSuccess = () => {
    loadAllAnalyses()
  }

  // Fonction pour déduire le pays à partir de la ville
  const getCountryFromCity = (city: string): string => {
    if (!city) return 'Non renseigné'
    const cityLower = city.toLowerCase().trim()
    
    // Mapping des villes vers les pays/régions
    const cityToCountry: { [key: string]: string } = {
      // France
      'paris': 'France', 'lyon': 'France', 'marseille': 'France', 'toulouse': 'France', 'nice': 'France',
      'nantes': 'France', 'strasbourg': 'France', 'montpellier': 'France', 'bordeaux': 'France', 'lille': 'France',
      'rennes': 'France', 'reims': 'France', 'saint-étienne': 'France', 'toulon': 'France', 'grenoble': 'France',
      'dijon': 'France', 'angers': 'France', 'nîmes': 'France', 'villeurbanne': 'France', 'saint-denis': 'France',
      // Côte d'Ivoire
      'abidjan': 'Côte d\'Ivoire', 'yamoussoukro': 'Côte d\'Ivoire', 'bouaké': 'Côte d\'Ivoire', 'daloa': 'Côte d\'Ivoire',
      'san-pédro': 'Côte d\'Ivoire', 'korhogo': 'Côte d\'Ivoire', 'man': 'Côte d\'Ivoire',
      // Sénégal
      'dakar': 'Sénégal', 'thiès': 'Sénégal', 'rufisque': 'Sénégal', 'kaolack': 'Sénégal', 'ziguinchor': 'Sénégal',
      'saint-louis': 'Sénégal', 'touba': 'Sénégal', 'mbour': 'Sénégal',
      // Cameroun
      'douala': 'Cameroun', 'yaoundé': 'Cameroun', 'garoua': 'Cameroun', 'bafoussam': 'Cameroun', 'bamenda': 'Cameroun',
      // Gabon
      'libreville': 'Gabon', 'port-gentil': 'Gabon', 'franceville': 'Gabon',
      // Burkina Faso
      'ouagadougou': 'Burkina Faso', 'bobo-dioulasso': 'Burkina Faso',
      // Mali
      'bamako': 'Mali', 'sikasso': 'Mali', 'mopti': 'Mali',
      // Bénin
      'cotonou': 'Bénin', 'porto-novo': 'Bénin',
      // Togo
      'lomé': 'Togo',
      // Guinée
      'conakry': 'Guinée',
      // Niger
      'niamey': 'Niger',
      // Tchad
      'n\'djamena': 'Tchad',
      // République Centrafricaine
      'bangui': 'République Centrafricaine',
      // Congo
      'brazzaville': 'Congo', 'pointe-noire': 'Congo',
      // RD Congo
      'kinshasa': 'RD Congo', 'lubumbashi': 'RD Congo', 'mbuji-mayi': 'RD Congo',
      // Autres pays
      'casablanca': 'Maroc', 'rabat': 'Maroc', 'marrakech': 'Maroc', 'fès': 'Maroc', 'tanger': 'Maroc',
      'tunis': 'Tunisie', 'sfax': 'Tunisie',
      'alger': 'Algérie', 'oran': 'Algérie', 'constantine': 'Algérie',
      'bruxelles': 'Belgique', 'anvers': 'Belgique', 'gand': 'Belgique',
      'genève': 'Suisse', 'zurich': 'Suisse', 'bâle': 'Suisse',
      'montréal': 'Canada', 'toronto': 'Canada', 'vancouver': 'Canada',
      'new york': 'États-Unis', 'los angeles': 'États-Unis', 'chicago': 'États-Unis', 'houston': 'États-Unis',
      'londres': 'Royaume-Uni', 'manchester': 'Royaume-Uni', 'birmingham': 'Royaume-Uni',
      'madrid': 'Espagne', 'barcelone': 'Espagne', 'valence': 'Espagne',
      'rome': 'Italie', 'milan': 'Italie', 'naples': 'Italie',
      'lisbonne': 'Portugal', 'porto': 'Portugal',
      'pékin': 'Chine', 'shanghai': 'Chine', 'guangzhou': 'Chine', 'shenzhen': 'Chine'
    }
    
    // Vérifier les correspondances exactes
    if (cityToCountry[cityLower]) {
      return cityToCountry[cityLower]
    }
    
    // Vérifier les correspondances partielles
    for (const [key, country] of Object.entries(cityToCountry)) {
      if (cityLower.includes(key) || key.includes(cityLower)) {
        return country
      }
    }
    
    // Si la ville contient des mots-clés de pays
    if (cityLower.includes('france') || cityLower.includes('français')) return 'France'
    if (cityLower.includes('belgique') || cityLower.includes('belge')) return 'Belgique'
    if (cityLower.includes('suisse') || cityLower.includes('swiss')) return 'Suisse'
    if (cityLower.includes('canada') || cityLower.includes('canadian')) return 'Canada'
    if (cityLower.includes('usa') || cityLower.includes('united states')) return 'États-Unis'
    if (cityLower.includes('uk') || cityLower.includes('britain')) return 'Royaume-Uni'
    if (cityLower.includes('espagne') || cityLower.includes('spain')) return 'Espagne'
    if (cityLower.includes('italie') || cityLower.includes('italy')) return 'Italie'
    if (cityLower.includes('portugal')) return 'Portugal'
    if (cityLower.includes('chine') || cityLower.includes('china')) return 'Chine'
    
    // Détecter les pays d'Afrique de l'Ouest/Centrale par patterns communs
    if (cityLower.match(/abidjan|yamoussoukro|bouaké|daloa/i)) return 'Côte d\'Ivoire'
    if (cityLower.match(/dakar|thiès|rufisque|kaolack/i)) return 'Sénégal'
    if (cityLower.match(/douala|yaoundé|garoua|bafoussam/i)) return 'Cameroun'
    if (cityLower.match(/libreville|port-gentil|franceville/i)) return 'Gabon'
    if (cityLower.match(/ouagadougou|bobo-dioulasso/i)) return 'Burkina Faso'
    if (cityLower.match(/bamako|sikasso|mopti/i)) return 'Mali'
    if (cityLower.match(/cotonou|porto-novo/i)) return 'Bénin'
    if (cityLower.match(/lomé/i)) return 'Togo'
    if (cityLower.match(/conakry/i)) return 'Guinée'
    if (cityLower.match(/niamey/i)) return 'Niger'
    if (cityLower.match(/n\'djamena/i)) return 'Tchad'
    if (cityLower.match(/bangui/i)) return 'République Centrafricaine'
    if (cityLower.match(/kinshasa|lubumbashi|mbuji-mayi/i)) return 'RD Congo'
    if (cityLower.match(/brazzaville|pointe-noire/i)) return 'Congo'
    
    return 'Non renseigné'
  }

  // Analyser les données géographiques (doit être avant les retours conditionnels)
  const geographicAnalysis = useMemo(() => {
    const cityCount: { [key: string]: number } = {}
    const countryCount: { [key: string]: number } = {}
    const regionCount: { [key: string]: number } = {}
    
    // Mapping des pays vers les régions
    const countryToRegion: { [key: string]: string } = {
      'France': 'Europe',
      'Belgique': 'Europe',
      'Suisse': 'Europe',
      'Espagne': 'Europe',
      'Italie': 'Europe',
      'Portugal': 'Europe',
      'Royaume-Uni': 'Europe',
      'Côte d\'Ivoire': 'Afrique de l\'Ouest',
      'Sénégal': 'Afrique de l\'Ouest',
      'Burkina Faso': 'Afrique de l\'Ouest',
      'Mali': 'Afrique de l\'Ouest',
      'Bénin': 'Afrique de l\'Ouest',
      'Togo': 'Afrique de l\'Ouest',
      'Guinée': 'Afrique de l\'Ouest',
      'Niger': 'Afrique de l\'Ouest',
      'Cameroun': 'Afrique Centrale',
      'Gabon': 'Afrique Centrale',
      'Tchad': 'Afrique Centrale',
      'République Centrafricaine': 'Afrique Centrale',
      'Congo': 'Afrique Centrale',
      'RD Congo': 'Afrique Centrale',
      'Maroc': 'Afrique du Nord',
      'Tunisie': 'Afrique du Nord',
      'Algérie': 'Afrique du Nord',
      'Canada': 'Amérique du Nord',
      'États-Unis': 'Amérique du Nord',
      'Chine': 'Asie'
    }
    
    users.forEach((user: any) => {
      const city = user.user_metadata?.city || ''
      if (city) {
        cityCount[city] = (cityCount[city] || 0) + 1
        const country = getCountryFromCity(city)
        countryCount[country] = (countryCount[country] || 0) + 1
        const region = countryToRegion[country] || 'Autre'
        regionCount[region] = (regionCount[region] || 0) + 1
      }
    })
    
    return {
      cities: Object.entries(cityCount)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      countries: Object.entries(countryCount)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      regions: Object.entries(regionCount)
        .map(([region, count]) => ({ region, count }))
        .sort((a, b) => b.count - a.count)
    }
  }, [users])

  // Analyser les professions
  const professionAnalysis = useMemo(() => {
    const professionCount: { [key: string]: number } = {}
    
    users.forEach((user: any) => {
      const profession = user.user_metadata?.profession || ''
      if (profession) {
        professionCount[profession] = (professionCount[profession] || 0) + 1
      }
    })
    
    return Object.entries(professionCount)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  }, [users])

  // Composant pour afficher un graphique en barres
  const BarChart = ({ data, maxValue, color = 'bg-[#00A1C6]' }: { data: Array<{ [key: string]: any, count: number }>, maxValue: number, color?: string }) => {
    return (
      <div className="space-y-2 sm:space-y-3">
        {data.map((item, index) => {
          const label = item.city || item.country || item.region || item.profession || 'Inconnu'
          const percentage = maxValue > 0 ? (item.count / maxValue) * 100 : 0
          return (
            <div key={index} className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{label}</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 flex-shrink-0">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5 sm:h-6 overflow-hidden">
                  <div
                    className={`${color} h-5 sm:h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-1 sm:pr-2`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 20 && (
                      <span className="text-xs font-medium text-white">{item.count}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const filteredAnalyses = analyses.filter(analysis => {
    if (searchTerm && 
        !analysis.client_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !analysis.client_email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !analysis.ticket.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const recentAnalyses = filteredAnalyses
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  // Calculer les KPIs
  const totalUsers = users.length
  const usersWithEmailValidated = useMemo(() => {
    return users.filter((user: any) => user.email_confirmed_at !== null && user.email_confirmed_at !== undefined).length
  }, [users])
  const usersWithoutEmailValidated = useMemo(() => {
    return users.filter((user: any) => !user.email_confirmed_at || user.email_confirmed_at === null).length
  }, [users])
  
  // Récupérer le dernier paiement
  const lastPayment = useMemo(() => {
    if (!payments || payments.length === 0) return null
    // Les paiements sont déjà triés par date décroissante dans l'API
    const last = payments[0]
    return {
      userName: last.user_name || last.userName || 'Utilisateur inconnu',
      userEmail: last.user_email || last.userEmail || '',
      createdAt: last.created_at || last.createdAt || null,
      amount: last.amount || 0,
      typeLabel: last.type_label || last.product_name || last.productName || 'Produit non spécifié'
    }
  }, [payments])

  const revenuesThisMonth = paymentStats.monthlyRevenue || 0

  // Récupérer les 5 derniers utilisateurs inscrits (triés par date de création décroissante)
  const latestUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [users])

  // Compter les nouveaux utilisateurs aujourd'hui
  const newUsersToday = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return users.filter((user: any) => {
      const userDate = new Date(user.created_at || 0)
      userDate.setHours(0, 0, 0, 0)
      return userDate.getTime() === today.getTime()
    }).length
  }, [users])

  // Fonction pour formater la date d'inscription
  const formatRegistrationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60))
        return diffMinutes <= 1 ? 'À l\'instant' : `Il y a ${diffMinutes} min`
      }
      return `Il y a ${diffHours}h`
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  }

  // Calculer les alertes dynamiquement
  const pendingAnalysesCount = analyses.filter(a => a.status === 'en_cours' || a.status === 'en_analyse').length
  const failedPayments = payments.filter(p => p.status === 'failed')
  const todayFormations = formations.filter(f => {
    const formationDate = new Date(f.date_scheduled)
    const today = new Date()
    return formationDate.toDateString() === today.toDateString()
  })

  // Statistiques du jour
  const statsToday = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const paymentsToday = payments.filter((p: any) => {
      const paymentDate = new Date(p.created_at)
      paymentDate.setHours(0, 0, 0, 0)
      return paymentDate.getTime() === today.getTime()
    })
    
    const revenueToday = paymentsToday
      .filter((p: any) => ['paid', 'completed', 'succeeded', 'success'].includes(p.status))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    
    const analysesToday = analyses.filter((a: any) => {
      const analysisDate = new Date(a.created_at)
      analysisDate.setHours(0, 0, 0, 0)
      return analysisDate.getTime() === today.getTime()
    }).length

    return {
      newUsers: newUsersToday,
      payments: paymentsToday.length,
      revenue: revenueToday,
      analyses: analysesToday
    }
  }, [payments, analyses, newUsersToday])

  // Paiements récents (7 derniers jours)
  const recentPayments = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    return payments
      .filter((p: any) => new Date(p.created_at) >= sevenDaysAgo)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [payments])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
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
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <AdminSidebar activeTab="overview" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              <div className="flex-shrink-0 ml-2 sm:ml-4 md:ml-16 mt-2 sm:mt-4">
                <button
                  onClick={() => router.push('/')}
                  className="cursor-pointer"
                >
                  <Image
                    src="/images/logo/logofinal.png"
                    alt="Cash360"
                    width={540}
                    height={540}
                    className="h-12 sm:h-16 md:h-32 w-auto hover:opacity-80 transition-opacity duration-200"
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

        {/* Main Dashboard Content */}
        <main className="p-4 sm:p-6">
          {/* Page Title */}
          <div className="mb-6 sm:mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#012F4E] mb-2">Overview (Admin)</h2>
              <p className="text-sm sm:text-base text-gray-600">Vue d'ensemble de l'activité Cash360.</p>
            </div>
            <button
              type="button"
              onClick={handleRefreshOverview}
              disabled={refreshingOverview}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition disabled:opacity-60"
            >
              {refreshingOverview ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
                <span className="text-green-500 text-xs sm:text-sm font-medium">+12%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#012F4E] mb-2">{totalUsers.toLocaleString()}</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3">Utilisateurs inscrits</p>
              <div className="flex items-center gap-3 sm:gap-4 pt-2 border-t border-gray-100">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Email validé</p>
                  <p className="text-base sm:text-lg font-semibold text-green-600">{usersWithEmailValidated.toLocaleString()}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Email non validé</p>
                  <p className="text-base sm:text-lg font-semibold text-orange-600">{usersWithoutEmailValidated.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              {lastPayment ? (
                <>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2">Dernier paiement</p>
                  <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1 truncate">{lastPayment.userName}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1 truncate">{lastPayment.typeLabel}</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {lastPayment.createdAt ? new Date(lastPayment.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Date inconnue'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2">Dernier paiement</p>
                  <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1">Aucun paiement</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Aucun paiement enregistré</p>
                </>
              )}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267zM10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"/>
                  </svg>
                </div>
                <span className="text-green-500 text-xs sm:text-sm font-medium">+15%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#012F4E] mb-1">{revenuesThisMonth.toLocaleString()} €</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Revenus (mois)</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00A1C6]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A1C6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
                <span className="text-red-500 text-xs sm:text-sm font-medium">-3%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#012F4E] mb-1">{activeSubscriptions}</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Abonnements actifs</p>
            </div>
          </div>

          {/* Section: Derniers utilisateurs inscrits */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1">Derniers utilisateurs inscrits</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {newUsersToday > 0 
                    ? `${newUsersToday} nouveau${newUsersToday > 1 ? 'x' : ''} utilisateur${newUsersToday > 1 ? 's' : ''} aujourd'hui`
                    : 'Aucun nouvel utilisateur aujourd\'hui'}
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/users')}
                className="text-xs sm:text-sm text-[#00A1C6] hover:text-[#012F4E] font-medium flex items-center gap-2 self-start sm:self-auto"
              >
                Voir tous
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {latestUsers.length > 0 ? (
              <div className="space-y-3">
                {latestUsers.map((user: any, index: number) => {
                  const isNewToday = () => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const userDate = new Date(user.created_at || 0)
                    userDate.setHours(0, 0, 0, 0)
                    return userDate.getTime() === today.getTime()
                  }
                  
                  return (
                    <div
                      key={user.id || index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push('/admin/users')}
                    >
                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00A1C6] rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                          {user.name 
                            ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                            : getInitials(user.email)
                          }
                        </div>
                        
                        {/* Informations utilisateur */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {user.name || user.email?.split('@')[0] || 'Utilisateur'}
                            </p>
                            {isNewToday() && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex-shrink-0">
                                Nouveau
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        
                        {/* Date d'inscription - masqué sur mobile */}
                        <div className="text-right hidden sm:block">
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatRegistrationDate(user.created_at)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(user.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        {/* Statut email */}
                        <div className="ml-2 sm:ml-4 flex-shrink-0">
                          {user.email_confirmed_at ? (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              <span className="hidden sm:inline">Confirmé</span>
                              <span className="sm:hidden">✓</span>
                            </span>
                          ) : (
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              <span className="hidden sm:inline">En attente</span>
                              <span className="sm:hidden">!</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun utilisateur inscrit</p>
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-4 sm:mb-6">Activité récente</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-600">Date</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-600">Type</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-600 hidden sm:table-cell">Utilisateur</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-600">Statut</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentAnalyses.map((analysis) => (
                          <tr key={analysis.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                              {new Date(analysis.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <span className="bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">Analyse</span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 hidden sm:table-cell truncate max-w-xs">{analysis.client_name}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs ${getStatusBadgeColor(analysis.status)}`}>
                                <span className="hidden sm:inline">{getStatusLabel(analysis.status)}</span>
                                <span className="sm:hidden">{getStatusLabel(analysis.status).substring(0, 3)}</span>
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <button 
                                onClick={() => router.push(`/admin/analyses`)}
                                className="text-[#00A1C6] cursor-pointer hover:text-[#012F4E]"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu de l'activité */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-4 sm:mb-6">Aperçu de l'activité</h3>
              
              {/* Statistiques du jour */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Nouveaux utilisateurs</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#012F4E]">{statsToday.newUsers}</p>
                      <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Paiements</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#012F4E]">{statsToday.payments}</p>
                      <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Revenus</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#012F4E] truncate">{statsToday.revenue.toLocaleString()} €</p>
                      <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Nouvelles analyses</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#012F4E]">{statsToday.analyses}</p>
                      <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alertes importantes */}
              {(pendingAnalysesCount > 0 || failedPayments.length > 0 || todayFormations.length > 0) && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Alertes importantes</h4>
                  <div className="space-y-3">
                    {pendingAnalysesCount > 0 && (
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-orange-800 text-sm">{pendingAnalysesCount} {pendingAnalysesCount === 1 ? 'analyse' : 'analyses'} en attente</p>
                          </div>
                          <button onClick={() => router.push('/admin/analyses')} className="text-orange-600 hover:text-orange-800 text-xs font-medium">Voir →</button>
                        </div>
                      </div>
                    )}

                    {failedPayments.length > 0 && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-red-800 text-sm">{failedPayments.length} {failedPayments.length === 1 ? 'paiement' : 'paiements'} échoué{failedPayments.length > 1 ? 's' : ''}</p>
                          </div>
                          <button onClick={() => router.push('/admin/paiements')} className="text-red-600 hover:text-red-800 text-xs font-medium">Gérer →</button>
                        </div>
                      </div>
                    )}

                    {todayFormations.map(formation => (
                      <div key={formation.id} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-800 text-sm">Formation aujourd'hui {formation.time}</p>
                            <p className="text-xs text-blue-600 mt-1">{formation.session_name || formation.title}</p>
                          </div>
                          <button onClick={() => router.push('/admin/formations')} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Voir →</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paiements récents */}
              {recentPayments.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Paiements récents (7 derniers jours)</h4>
                    <button onClick={() => router.push('/admin/paiements')} className="text-xs text-[#00A1C6] hover:text-[#012F4E] font-medium">Tous →</button>
                  </div>
                  <div className="space-y-2">
                    {recentPayments.slice(0, 3).map((payment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 sm:p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {payment.user_name || payment.userName || 'Utilisateur inconnu'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {payment.type_label || payment.product_name || 'Produit'} • {new Date(payment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <p className="text-xs sm:text-sm font-bold text-[#012F4E] whitespace-nowrap">{payment.amount?.toLocaleString() || 0} €</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Section - Répartition géographique et professionnelle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Répartition par régions */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1">Répartition géographique</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Par région du monde</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {geographicAnalysis.regions.length > 0 ? (
                <BarChart 
                  data={geographicAnalysis.regions} 
                  maxValue={Math.max(...geographicAnalysis.regions.map(r => r.count))}
                  color="bg-blue-600"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune donnée géographique disponible</p>
                </div>
              )}
            </div>

            {/* Répartition par pays */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1">Top 10 pays</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Déduits à partir des villes</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              {geographicAnalysis.countries.length > 0 ? (
                <BarChart 
                  data={geographicAnalysis.countries.slice(0, 10)} 
                  maxValue={Math.max(...geographicAnalysis.countries.slice(0, 10).map(c => c.count))}
                  color="bg-green-600"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune donnée de pays disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Deuxième ligne - Top villes et professions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Top villes */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1">Top 10 villes</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Villes les plus représentées</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              {geographicAnalysis.cities.length > 0 ? (
                <BarChart 
                  data={geographicAnalysis.cities} 
                  maxValue={Math.max(...geographicAnalysis.cities.map(c => c.count))}
                  color="bg-purple-600"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune donnée de ville disponible</p>
                </div>
              )}
            </div>

            {/* Répartition des professions */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1">Top 10 professions</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Métiers les plus représentés</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              {professionAnalysis.length > 0 ? (
                <BarChart 
                  data={professionAnalysis.slice(0, 10)} 
                  maxValue={Math.max(...professionAnalysis.slice(0, 10).map(p => p.count))}
                  color="bg-orange-600"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune donnée de profession disponible</p>
                </div>
              )}
            </div>
          </div>
        </main>

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
    </div>
  )
}

