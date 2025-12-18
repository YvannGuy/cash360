import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Normalisation des pays
 */
function normalizeCountry(country: string | null | undefined): string {
  if (!country) return 'Inconnu'
  
  const normalized = country.trim()
  
  // Normaliser les variantes communes
  const countryMap: Record<string, string> = {
    'rdc': 'République démocratique du Congo',
    'congo-kinshasa': 'République démocratique du Congo',
    'congo (rdc)': 'République démocratique du Congo',
    'côte d\'ivoire': 'Côte d\'Ivoire',
    'cote d\'ivoire': 'Côte d\'Ivoire',
    'ivory coast': 'Côte d\'Ivoire',
    'burkina': 'Burkina Faso',
    'cameroun': 'Cameroun',
    'senegal': 'Sénégal',
    'mali': 'Mali',
    'benin': 'Bénin',
    'togo': 'Togo',
    'niger': 'Niger',
    'guinee': 'Guinée',
    'gabon': 'Gabon',
    'congo': 'Congo',
    'tchad': 'Tchad',
    'rca': 'République centrafricaine',
    'centrafrique': 'République centrafricaine',
    'france': 'France',
    'belgique': 'Belgique',
    'suisse': 'Suisse',
    'canada': 'Canada',
    'usa': 'États-Unis',
    'united states': 'États-Unis',
    'non renseigné': 'Inconnu',
    'non renseigne': 'Inconnu',
    '—': 'Inconnu',
    '': 'Inconnu'
  }
  
  const lower = normalized.toLowerCase()
  return countryMap[lower] || normalized
}

/**
 * Normalisation des villes
 */
function normalizeCity(city: string | null | undefined): string {
  if (!city) return 'Inconnu'
  
  const normalized = city.trim()
  
  // Normaliser les valeurs vides
  if (!normalized || normalized === '—' || normalized.toLowerCase() === 'non renseigné' || normalized.toLowerCase() === 'non renseigne') {
    return 'Inconnu'
  }
  
  return normalized
}

/**
 * Attribution des régions géographiques
 */
function getRegion(country: string): string {
  const countryLower = country.toLowerCase()
  
  // Afrique Centrale
  const afriqueCentrale = ['république démocratique du congo', 'rdc', 'cameroun', 'gabon', 'tchad', 'république centrafricaine', 'rca', 'congo', 'guinée équatoriale', 'sao tomé-et-principe']
  if (afriqueCentrale.some(c => countryLower.includes(c))) {
    return 'Afrique Centrale'
  }
  
  // Afrique de l'Ouest
  const afriqueOuest = ['côte d\'ivoire', 'sénégal', 'mali', 'burkina faso', 'bénin', 'togo', 'niger', 'guinée', 'sierra leone', 'libéria', 'gambie', 'guinée-bissau', 'cap-vert', 'mauritanie']
  if (afriqueOuest.some(c => countryLower.includes(c))) {
    return 'Afrique de l\'Ouest'
  }
  
  // Afrique de l'Est
  const afriqueEst = ['kenya', 'tanzanie', 'ouganda', 'rwanda', 'burundi', 'éthiopie', 'somalie', 'djibouti', 'érythrée', 'soudan', 'soudan du sud']
  if (afriqueEst.some(c => countryLower.includes(c))) {
    return 'Afrique de l\'Est'
  }
  
  // Afrique Australe
  const afriqueAustrale = ['afrique du sud', 'zimbabwe', 'zambie', 'malawi', 'mozambique', 'angola', 'namibie', 'botswana', 'lesotho', 'eswatini']
  if (afriqueAustrale.some(c => countryLower.includes(c))) {
    return 'Afrique Australe'
  }
  
  // Afrique du Nord
  const afriqueNord = ['maroc', 'algérie', 'tunisie', 'libye', 'égypte', 'soudan']
  if (afriqueNord.some(c => countryLower.includes(c))) {
    return 'Afrique du Nord'
  }
  
  // Europe
  const europe = ['france', 'belgique', 'suisse', 'espagne', 'italie', 'allemagne', 'portugal', 'royaume-uni', 'uk', 'grande-bretagne', 'pays-bas', 'luxembourg']
  if (europe.some(c => countryLower.includes(c))) {
    return 'Europe'
  }
  
  // Amérique du Nord
  const ameriqueNord = ['canada', 'états-unis', 'usa', 'united states', 'mexique']
  if (ameriqueNord.some(c => countryLower.includes(c))) {
    return 'Amérique du Nord'
  }
  
  // Autres
  return 'Autres'
}

/**
 * GET /api/admin/metrics/geo?range=7d|30d|90d|365d
 * 
 * Retourne les métriques géographiques avec KPI actionnables
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateISO = startDate.toISOString()

    // Récupérer tous les utilisateurs avec pagination
    const MAX_PER_PAGE = 200
    const allUsersList: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: MAX_PER_PAGE
      })

      if (usersError) {
        console.error('[METRICS GEO] Erreur récupération utilisateurs:', usersError)
        break
      }

      if (usersData?.users) {
        allUsersList.push(...usersData.users)
      }

      if (!usersData?.users || usersData.users.length < MAX_PER_PAGE) {
        hasMore = false
      } else {
        page += 1
      }
    }

    // Récupérer les données nécessaires
    const [
      { data: subscriptions },
      { data: payments },
      { data: trackingEvents }
    ] = await Promise.all([
      supabaseAdmin.from('user_subscriptions').select('user_id').in('status', ['active', 'trialing']),
      supabaseAdmin.from('payments').select('user_id, amount, created_at').eq('status', 'success').gte('created_at', startDateISO),
      supabaseAdmin.from('tracking_events').select('user_id, created_at').not('user_id', 'is', null).gte('created_at', startDateISO)
    ])

    // Créer des maps pour accès rapide
    const subscribedUserIds = new Set(subscriptions?.map((s: any) => s.user_id) || [])
    const paidUserIds = new Set(payments?.map((p: any) => p.user_id) || [])
    const activeUserIds = new Set(trackingEvents?.map((e: any) => e.user_id) || [])
    
    // Calculer le revenu par utilisateur
    const revenueByUser = new Map<string, number>()
    payments?.forEach((p: any) => {
      const current = revenueByUser.get(p.user_id) || 0
      revenueByUser.set(p.user_id, current + (parseFloat(p.amount) || 0))
    })

    // Calculer les utilisateurs actifs (fallback sur last_sign_in_at si pas d'événements)
    const active30dUserIds = new Set<string>()
    allUsersList.forEach((user) => {
      const userId = user.id
      // Utiliser tracking_events si disponible
      if (activeUserIds.has(userId)) {
        active30dUserIds.add(userId)
      } else if (user.last_sign_in_at) {
        // Fallback sur last_sign_in_at
        const lastSignIn = new Date(user.last_sign_in_at).getTime()
        if (lastSignIn >= startDate.getTime()) {
          active30dUserIds.add(userId)
        }
      }
    })

    // Agrégation par pays
    const countryStats = new Map<string, {
      users: number
      active30d: number
      paidUsers: number
      revenue30d: number
    }>()

    allUsersList.forEach((user) => {
      const country = normalizeCountry(user.user_metadata?.country)
      const userId = user.id
      
      const stats = countryStats.get(country) || {
        users: 0,
        active30d: 0,
        paidUsers: 0,
        revenue30d: 0
      }
      
      stats.users += 1
      if (active30dUserIds.has(userId)) stats.active30d += 1
      if (subscribedUserIds.has(userId) || paidUserIds.has(userId)) stats.paidUsers += 1
      stats.revenue30d += revenueByUser.get(userId) || 0
      
      countryStats.set(country, stats)
    })

    // Agrégation par ville
    const cityStats = new Map<string, {
      country: string
      users: number
      active30d: number
    }>()

    allUsersList.forEach((user) => {
      const city = normalizeCity(user.user_metadata?.city)
      const country = normalizeCountry(user.user_metadata?.country)
      const userId = user.id
      
      const stats = cityStats.get(`${city}|${country}`) || {
        country,
        users: 0,
        active30d: 0
      }
      
      stats.users += 1
      if (active30dUserIds.has(userId)) stats.active30d += 1
      
      cityStats.set(`${city}|${country}`, stats)
    })

    // Agrégation par région
    const regionStats = new Map<string, {
      users: number
      active30d: number
      paidUsers: number
      revenue30d: number
    }>()

    countryStats.forEach((stats, country) => {
      const region = getRegion(country)
      const regionData = regionStats.get(region) || {
        users: 0,
        active30d: 0,
        paidUsers: 0,
        revenue30d: 0
      }
      
      regionData.users += stats.users
      regionData.active30d += stats.active30d
      regionData.paidUsers += stats.paidUsers
      regionData.revenue30d += stats.revenue30d
      
      regionStats.set(region, regionData)
    })

    // Calculer le pourcentage d'inconnu
    const unknownUsers = countryStats.get('Inconnu')?.users || 0
    const totalUsers = allUsersList.length
    const unknownShare = {
      unknownUsers,
      totalUsers,
      percent: totalUsers > 0 ? (unknownUsers / totalUsers) * 100 : 0
    }

    // Top pays par utilisateurs
    const countriesTopUsers = Array.from(countryStats.entries())
      .map(([country, stats]) => ({
        country,
        users: stats.users,
        active30d: stats.active30d,
        paidUsers: stats.paidUsers,
        revenue30d: stats.revenue30d,
        conversionRate: stats.users > 0 ? (stats.paidUsers / stats.users) * 100 : 0,
        activeRate: stats.users > 0 ? (stats.active30d / stats.users) * 100 : 0
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 10)

    // Top villes
    const citiesTopUsers = Array.from(cityStats.entries())
      .map(([key, stats]) => {
        const [city, country] = key.split('|')
        return {
          city: city || 'Inconnu',
          country: country || stats.country || 'Inconnu',
          users: stats.users,
          active30d: stats.active30d
        }
      })
      .filter(c => c.city !== 'Inconnu')
      .sort((a, b) => b.users - a.users)
      .slice(0, 10)

    // Répartition par région
    const regionsBreakdown = Array.from(regionStats.entries())
      .map(([region, stats]) => ({
        region,
        users: stats.users,
        active30d: stats.active30d,
        paidUsers: stats.paidUsers,
        revenue30d: stats.revenue30d
      }))
      .sort((a, b) => b.users - a.users)

    // Calculer les recommandations
    // Top 3 pays à fort potentiel (beaucoup de users + faible conversion)
    const highPotentialCountries = countriesTopUsers
      .filter(c => c.users >= 5 && c.conversionRate < 20)
      .sort((a, b) => {
        // Score = users * (1 - conversionRate/100)
        const scoreA = a.users * (1 - a.conversionRate / 100)
        const scoreB = b.users * (1 - b.conversionRate / 100)
        return scoreB - scoreA
      })
      .slice(0, 3)

    // Top 3 pays à forte performance (conversion + actifs élevés)
    const highPerformanceCountries = countriesTopUsers
      .filter(c => c.users >= 3)
      .sort((a, b) => {
        // Score = (conversionRate + activeRate) / 2
        const scoreA = (a.conversionRate + a.activeRate) / 2
        const scoreB = (b.conversionRate + b.activeRate) / 2
        return scoreB - scoreA
      })
      .slice(0, 3)

    // Top 3 villes pour événement (concentration utilisateurs + actifs élevés)
    const topCitiesForEvents = citiesTopUsers
      .filter(c => c.city !== 'Inconnu' && c.users >= 3)
      .sort((a, b) => {
        // Score = users * (active30d / users)
        const activeRateA = a.users > 0 ? a.active30d / a.users : 0
        const activeRateB = b.users > 0 ? b.active30d / b.users : 0
        const scoreA = a.users * activeRateA
        const scoreB = b.users * activeRateB
        return scoreB - scoreA
      })
      .slice(0, 3)

    return NextResponse.json({
      success: true,
      geo: {
        regionsBreakdown,
        countriesTopUsers,
        citiesTopUsers,
        unknownShare,
        recommendations: {
          highPotentialCountries,
          highPerformanceCountries,
          topCitiesForEvents
        }
      },
      range,
      computedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[METRICS GEO] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des métriques géographiques', details: error.message },
      { status: 500 }
    )
  }
}
