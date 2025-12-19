import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Normalisation des pays avec mapping vers noms canoniques
 * Retourne le nom canonique du pays (pas d'ISO2 pour garder la compatibilité)
 */
function normalizeCountry(country: string | null | undefined): string {
  if (!country) return 'Inconnu'
  
  const normalized = country.trim()
  if (!normalized || normalized === '—' || normalized === '') return 'Inconnu'
  
  // Mapping exhaustif des variantes vers noms canoniques
  const countryMap: Record<string, string> = {
    // RDC - toutes les variantes
    'rdc': 'République démocratique du Congo',
    'congo-kinshasa': 'République démocratique du Congo',
    'congo (rdc)': 'République démocratique du Congo',
    'congo-k': 'République démocratique du Congo',
    'drc': 'République démocratique du Congo',
    'democratic republic of congo': 'République démocratique du Congo',
    'république démocratique du congo': 'République démocratique du Congo',
    
    // Côte d'Ivoire - toutes les variations possibles
    'côte d\'ivoire': 'Côte d\'Ivoire',
    'cote d\'ivoire': 'Côte d\'Ivoire',
    'côte d ivoire': 'Côte d\'Ivoire', // sans apostrophe
    'cote d ivoire': 'Côte d\'Ivoire', // sans apostrophe
    'côte d’ivoire': 'Côte d\'Ivoire', // apostrophe typographique
    'côte d`ivoire': 'Côte d\'Ivoire', // backtick
    'ivory coast': 'Côte d\'Ivoire',
    'ci': 'Côte d\'Ivoire',
    
    // Congo (Brazzaville)
    'congo': 'Congo',
    'congo-brazzaville': 'Congo',
    'république du congo': 'Congo',
    'republic of congo': 'Congo',
    
    // Autres pays africains
    'burkina': 'Burkina Faso',
    'burkina faso': 'Burkina Faso',
    'cameroun': 'Cameroun',
    'cameroon': 'Cameroun',
    'senegal': 'Sénégal',
    'mali': 'Mali',
    'benin': 'Bénin',
    'togo': 'Togo',
    'niger': 'Niger',
    'guinee': 'Guinée',
    'guinée': 'Guinée',
    'guinea': 'Guinée',
    'gabon': 'Gabon',
    'tchad': 'Tchad',
    'chad': 'Tchad',
    'rca': 'République centrafricaine',
    'centrafrique': 'République centrafricaine',
    'central african republic': 'République centrafricaine',
    
    // Europe
    'france': 'France',
    'fr': 'France',
    'belgique': 'Belgique',
    'belgium': 'Belgique',
    'be': 'Belgique',
    'suisse': 'Suisse',
    'switzerland': 'Suisse',
    'ch': 'Suisse',
    
    // Amérique du Nord
    'canada': 'Canada',
    'ca': 'Canada',
    'usa': 'États-Unis',
    'united states': 'États-Unis',
    'us': 'États-Unis',
    'états-unis': 'États-Unis',
    
    // Valeurs inconnues
    'non renseigné': 'Inconnu',
    'non renseigne': 'Inconnu',
    'unknown': 'Inconnu',
    'autre': 'Autres',
    'others': 'Autres'
  }
  
  // Normaliser en lowercase AVANT de chercher dans le map pour éviter les problèmes de casse
  let lower = normalized.toLowerCase().trim()
  // Normaliser les espaces multiples
  lower = lower.replace(/\s+/g, ' ')
  // Normaliser TOUS les types d'apostrophes vers une apostrophe droite simple
  lower = lower.replace(/[''`´]/g, "'")
  
  // Chercher dans le map avec la version nettoyée
  let mapped = countryMap[lower]
  
  // Si pas trouvé, essayer avec la version originale (au cas où le map aurait des clés non normalisées)
  if (!mapped) {
    mapped = countryMap[normalized.toLowerCase().trim()]
  }
  
  if (mapped) {
    return mapped // Retourner TOUJOURS la valeur canonique du map (ex: "Côte d'Ivoire")
  }
  
  // Si pas trouvé dans le map, retourner la version originale (pour les pays non mappés)
  // Mais on normalise quand même la casse pour éviter les variations
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

/**
 * Normalisation des villes
 * Détecte si la ville est en fait un nom de pays et le corrige
 */
function normalizeCity(city: string | null | undefined, country?: string | null): string {
  if (!city) return 'Inconnu'
  
  const normalized = city.trim()
  
  // Normaliser les valeurs vides
  if (!normalized || normalized === '—' || normalized.toLowerCase() === 'non renseigné' || normalized.toLowerCase() === 'non renseigne') {
    return 'Inconnu'
  }
  
  // Détecter si la "ville" est en fait un nom de pays (cas fréquent d'erreur de saisie)
  const countryNames = [
    'république démocratique du congo', 'rdc', 'congo', 'côte d\'ivoire', 'cote d\'ivoire',
    'france', 'belgique', 'suisse', 'canada', 'états-unis', 'états unis', 'usa',
    'cameroun', 'sénégal', 'senegal', 'mali', 'burkina faso', 'burkina',
    'bénin', 'benin', 'togo', 'niger', 'guinée', 'guinee', 'gabon', 'tchad', 'chad'
  ]
  const normalizedLower = normalized.toLowerCase().trim()
  
  // Vérifier si la ville correspond exactement à un nom de pays
  if (countryNames.some(cn => {
    const cnLower = cn.toLowerCase()
    return normalizedLower === cnLower || 
           normalizedLower === cnLower.replace(/\s+/g, ' ') ||
           (normalizedLower.length > 5 && cnLower.includes(normalizedLower)) ||
           (cnLower.length > 5 && normalizedLower.includes(cnLower))
  })) {
    // Si la ville ressemble à un pays, on la considère comme inconnue
    return 'Inconnu'
  }
  
  // Normaliser quelques variantes communes de villes
  const cityMap: Record<string, string> = {
    'kinshasa': 'Kinshasa',
    'kinsasa': 'Kinshasa',
    'kinshasa (autre)': 'Kinshasa',
    'kinshasa(autre)': 'Kinshasa',
    'kinshasa (autres)': 'Kinshasa',
    'kinshasa(autres)': 'Kinshasa',
    'paris': 'Paris',
    'bruxelles': 'Bruxelles',
    'brussels': 'Bruxelles',
    'dakar': 'Dakar',
    'abidjan': 'Abidjan',
    'yaounde': 'Yaoundé',
    'yaoundé': 'Yaoundé',
    'douala': 'Douala',
    'lubumbashi': 'Lubumbashi',
    'kinshasa (unknown)': 'Kinshasa',
    'kinshasa(unknown)': 'Kinshasa'
  }
  
  const lower = normalized.toLowerCase()
  return cityMap[lower] || normalized
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
    
    // Log pour vérification des dates calculées
    console.log('[METRICS GEO] Calcul des dates:', {
      range,
      days,
      startDate: startDateISO,
      startDateLocal: startDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      now: new Date().toISOString(),
      nowLocal: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
    })

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
      { data: trackingEvents },
      { data: trackingEventsWithType }
    ] = await Promise.all([
      supabaseAdmin.from('user_subscriptions').select('user_id').in('status', ['active', 'trialing']),
      supabaseAdmin.from('payments').select('user_id, amount, created_at').eq('status', 'success').gte('created_at', startDateISO),
      supabaseAdmin.from('tracking_events').select('user_id, created_at').not('user_id', 'is', null).gte('created_at', startDateISO),
      supabaseAdmin.from('tracking_events').select('user_id, event_type, created_at').not('user_id', 'is', null).gte('created_at', startDateISO)
    ])

    // Core events pour calculer Active Core
    const CORE_EVENT_TYPES = new Set([
      'budget.saved',
      'budget.expense_added',
      'debt.payment_made',
      'debt.added',
      'fast.day_logged',
      'fast.started'
    ])

    // Calculer les utilisateurs Active Core (30j)
    const activeCoreUserIds = new Set<string>()
    trackingEventsWithType?.forEach((event: any) => {
      if (event?.user_id && CORE_EVENT_TYPES.has(event.event_type)) {
        activeCoreUserIds.add(event.user_id)
      }
    })

    // Créer des maps pour accès rapide
    const subscribedUserIds = new Set(subscriptions?.map((s: any) => s.user_id) || [])
    const paidUserIds = new Set(payments?.map((p: any) => p.user_id) || [])
    const activeUserIds = new Set(trackingEvents?.map((e: any) => e.user_id) || [])
    
    // Calculer le revenu par utilisateur
    const revenueByUser = new Map<string, number>()
    const totalRevenue30d = payments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0) || 0
    payments?.forEach((p: any) => {
      const current = revenueByUser.get(p.user_id) || 0
      revenueByUser.set(p.user_id, current + (parseFloat(p.amount) || 0))
    })
    
    // Log pour vérification des revenus dans geo
    console.log('[METRICS GEO] Calcul des revenus (30j):', {
      periode: {
        startDate: startDateISO,
        startDateLocal: startDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        endDate: new Date().toISOString(),
        jours: days
      },
      paiements: {
        total: payments?.length || 0,
        avecMontant: payments?.filter((p: any) => parseFloat(p.amount || 0) > 0).length || 0
      },
      revenuTotal30j: totalRevenue30d,
      utilisateursAvecRevenu: revenueByUser.size
    })

    // Calculer les utilisateurs actifs ANY (fallback sur last_sign_in_at si pas d'événements)
    const activeAny30dUserIds = new Set<string>()
    allUsersList.forEach((user) => {
      const userId = user.id
      // Utiliser tracking_events si disponible
      if (activeUserIds.has(userId)) {
        activeAny30dUserIds.add(userId)
      } else if (user.last_sign_in_at) {
        // Fallback sur last_sign_in_at
        const lastSignIn = new Date(user.last_sign_in_at).getTime()
        if (lastSignIn >= startDate.getTime()) {
          activeAny30dUserIds.add(userId)
        }
      }
    })

    // Log pour vérification
    console.log('[METRICS GEO] Active Core vs Active Any:', {
      activeAny: activeAny30dUserIds.size,
      activeCore: activeCoreUserIds.size,
      diff: activeAny30dUserIds.size - activeCoreUserIds.size
    })

    // Agrégation par pays avec Active Any et Active Core
    const countryStats = new Map<string, {
      users: number
      activeAny30j: number
      activeCore30j: number
      paidUsers: number
      revenue30d: number
    }>()

    // Collecter les valeurs brutes pour la qualité des données
    const rawCountryValues = new Map<string, number>()
    const rawCityValues = new Map<string, number>()

    allUsersList.forEach((user) => {
      const rawCountry = user.user_metadata?.country || null
      const rawCity = user.user_metadata?.city || null
      
      // Collecter les valeurs brutes
      if (rawCountry) {
        const normalizedRaw = rawCountry.trim().toLowerCase()
        rawCountryValues.set(normalizedRaw, (rawCountryValues.get(normalizedRaw) || 0) + 1)
      }
      if (rawCity) {
        const normalizedRaw = rawCity.trim().toLowerCase()
        rawCityValues.set(normalizedRaw, (rawCityValues.get(normalizedRaw) || 0) + 1)
      }

      const country = normalizeCountry(rawCountry)
      const userId = user.id
      
      const stats = countryStats.get(country) || {
        users: 0,
        activeAny30j: 0,
        activeCore30j: 0,
        paidUsers: 0,
        revenue30d: 0
      }
      
      stats.users += 1
      if (activeAny30dUserIds.has(userId)) stats.activeAny30j += 1
      if (activeCoreUserIds.has(userId)) stats.activeCore30j += 1
      if (subscribedUserIds.has(userId) || paidUserIds.has(userId)) stats.paidUsers += 1
      stats.revenue30d += revenueByUser.get(userId) || 0
      
      countryStats.set(country, stats)
    })

    // Agrégation par ville
    const cityStats = new Map<string, {
      country: string
      users: number
      activeAny30j: number
      activeCore30j: number
    }>()

    allUsersList.forEach((user) => {
      const rawCountry = user.user_metadata?.country
      const rawCity = user.user_metadata?.city
      const country = normalizeCountry(rawCountry)
      const city = normalizeCity(rawCity, rawCountry)
      const userId = user.id
      
      // Si la ville a été détectée comme étant un nom de pays, on l'exclut
      if (city === 'Inconnu') {
        return // Skip cette entrée
      }
      
      // Si le pays est "Autres" ou "Inconnu", on essaie de déduire le pays depuis la ville
      // Sinon, on garde la ville avec pays "Unknown" pour éviter "Kinshasa(Autres)"
      let displayCountry = country
      if ((country === 'Autres' || country === 'Inconnu') && city !== 'Inconnu') {
        // Mapping villes → pays (pour les cas où le pays n'est pas renseigné mais la ville est connue)
        const cityToCountryMap: Record<string, string> = {
          'kinshasa': 'République démocratique du Congo',
          'lubumbashi': 'République démocratique du Congo',
          'abidjan': 'Côte d\'Ivoire',
          'yaoundé': 'Cameroun',
          'yaounde': 'Cameroun',
          'douala': 'Cameroun',
          'dakar': 'Sénégal',
          'paris': 'France',
          'bruxelles': 'Belgique',
          'brussels': 'Belgique'
        }
        const cityLower = city.toLowerCase()
        const deducedCountry = cityToCountryMap[cityLower] || 'Unknown'
        // Normaliser le pays déduit pour éviter les variations
        displayCountry = deducedCountry === 'Unknown' ? 'Unknown' : normalizeCountry(deducedCountry)
      } else if (country === 'Inconnu' && city !== 'Inconnu') {
        displayCountry = 'Unknown'
      } else {
        // Normaliser le pays même s'il n'est pas "Autres/Inconnu" pour éviter les doublons
        displayCountry = normalizeCountry(displayCountry)
      }
      
      // Normaliser une dernière fois pour s'assurer de la cohérence (gère les cas où normalizeCountry retourne des variations)
      displayCountry = normalizeCountry(displayCountry)
      
      // S'assurer que displayCountry utilise toujours la valeur canonique du map
      // (normalizeCountry devrait déjà le faire, mais on double-vérifie)
      const countryLower = displayCountry.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[''`´]/g, "'")
      const canonicalCountry = normalizeCountry(countryLower) || displayCountry
      
      // Utiliser une clé normalisée pour éviter les doublons dus à des variations subtiles
      const normalizedCityKey = city.toLowerCase().trim()
      const normalizedCountryKey = canonicalCountry.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[''`´]/g, "'")
      const cityKey = `${normalizedCityKey}|${normalizedCountryKey}`
      
      const stats = cityStats.get(cityKey) || {
        country: canonicalCountry, // Toujours utiliser la version canonique
        users: 0,
        activeAny30j: 0,
        activeCore30j: 0
      }
      
      stats.users += 1
      if (activeAny30dUserIds.has(userId)) stats.activeAny30j += 1
      if (activeCoreUserIds.has(userId)) stats.activeCore30j += 1
      
      cityStats.set(cityKey, stats)
    })

    // Agrégation par région
    const regionStats = new Map<string, {
      users: number
      activeAny30j: number
      activeCore30j: number
      paidUsers: number
      revenue30d: number
    }>()

    countryStats.forEach((stats, country) => {
      const region = getRegion(country)
      const regionData = regionStats.get(region) || {
        users: 0,
        activeAny30j: 0,
        activeCore30j: 0,
        paidUsers: 0,
        revenue30d: 0
      }
      
      regionData.users += stats.users
      regionData.activeAny30j += stats.activeAny30j
      regionData.activeCore30j += stats.activeCore30j
      regionData.paidUsers += stats.paidUsers
      regionData.revenue30d += stats.revenue30d
      
      regionStats.set(region, regionData)
    })

    // Calculer la qualité des données géographiques
    const unknownCountryUsers = countryStats.get('Inconnu')?.users || 0
    const unknownCityCount = Array.from(cityStats.values()).filter(c => c.city === 'Inconnu').reduce((sum, c) => sum + c.users, 0)
    const totalUsers = allUsersList.length
    
    // Top valeurs non normalisées rencontrées
    const topRawCountries = Array.from(rawCountryValues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }))
    
    const topRawCities = Array.from(rawCityValues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }))

    const dataQuality = {
      countryUnknown: {
        count: unknownCountryUsers,
        percent: totalUsers > 0 ? (unknownCountryUsers / totalUsers) * 100 : 0
      },
      cityUnknown: {
        count: unknownCityCount,
        percent: totalUsers > 0 ? (unknownCityCount / totalUsers) * 100 : 0
      },
      topRawCountries,
      topRawCities
    }

    // Top pays par utilisateurs (avec Active Any et Active Core)
    // EXCLURE "Autres" et "Inconnu" des top pays pour avoir des données actionnables
    const countriesTopUsers = Array.from(countryStats.entries())
      .filter(([country]) => country !== 'Autres' && country !== 'Inconnu' && country !== 'Unknown')
      .map(([country, stats]) => ({
        country,
        users: stats.users, // Compatibilité dashboard
        users_total: stats.users, // Nouveau format
        active30d: stats.activeAny30j, // Compatibilité dashboard (alias)
        active_any_30j: stats.activeAny30j, // Nouveau format
        active_core_30j: stats.activeCore30j, // Nouveau format
        paidUsers: stats.paidUsers, // Compatibilité dashboard
        paid_count: stats.paidUsers, // Nouveau format
        revenue30d: stats.revenue30d, // Compatibilité dashboard
        revenue_30j: stats.revenue30d, // Nouveau format
        conversionRate: stats.users > 0 ? (stats.paidUsers / stats.users) * 100 : 0, // Compatibilité dashboard
        conversion: stats.users > 0 ? (stats.paidUsers / stats.users) * 100 : 0, // Nouveau format
        activeRate: stats.users > 0 ? (stats.activeAny30j / stats.users) * 100 : 0,
        activeCoreRate: stats.users > 0 ? (stats.activeCore30j / stats.users) * 100 : 0
      }))
      .sort((a, b) => b.users_total - a.users_total)
      .slice(0, 10)
    
    // Ajouter "Autres" et "Inconnu" séparément pour information (mais pas dans le top)
    const othersStats = countryStats.get('Autres')
    const unknownStats = countryStats.get('Inconnu')
    
    // Créer une section séparée pour les pays non identifiés
    const unidentifiedCountries = []
    if (othersStats) {
      unidentifiedCountries.push({
        country: 'Autres',
        users: othersStats.users,
        users_total: othersStats.users,
        active30d: othersStats.activeAny30j,
        active_any_30j: othersStats.activeAny30j,
        active_core_30j: othersStats.activeCore30j,
        paidUsers: othersStats.paidUsers,
        paid_count: othersStats.paidUsers,
        revenue30d: othersStats.revenue30d,
        revenue_30j: othersStats.revenue30d,
        conversionRate: othersStats.users > 0 ? (othersStats.paidUsers / othersStats.users) * 100 : 0,
        conversion: othersStats.users > 0 ? (othersStats.paidUsers / othersStats.users) * 100 : 0,
        activeRate: othersStats.users > 0 ? (othersStats.activeAny30j / othersStats.users) * 100 : 0,
        activeCoreRate: othersStats.users > 0 ? (othersStats.activeCore30j / othersStats.users) * 100 : 0
      })
    }
    if (unknownStats) {
      unidentifiedCountries.push({
        country: 'Inconnu',
        users: unknownStats.users,
        users_total: unknownStats.users,
        active30d: unknownStats.activeAny30j,
        active_any_30j: unknownStats.activeAny30j,
        active_core_30j: unknownStats.activeCore30j,
        paidUsers: unknownStats.paidUsers,
        paid_count: unknownStats.paidUsers,
        revenue30d: unknownStats.revenue30d,
        revenue_30j: unknownStats.revenue30d,
        conversionRate: unknownStats.users > 0 ? (unknownStats.paidUsers / unknownStats.users) * 100 : 0,
        conversion: unknownStats.users > 0 ? (unknownStats.paidUsers / unknownStats.users) * 100 : 0,
        activeRate: unknownStats.users > 0 ? (unknownStats.activeAny30j / unknownStats.users) * 100 : 0,
        activeCoreRate: unknownStats.users > 0 ? (unknownStats.activeCore30j / unknownStats.users) * 100 : 0
      })
    }

    // Top villes - EXCLURE les villes avec pays "Autres/Inconnu/Unknown" et les villes qui sont des noms de pays
    // Fusionner les doublons (même ville, pays normalisé différemment)
    const cityMap = new Map<string, {
      city: string
      country: string
      users: number
      activeAny30j: number
      activeCore30j: number
    }>()
    
    // Debug: collecter les pays non normalisés pour voir les variations
    const countryVariations = new Map<string, Set<string>>()
    
    Array.from(cityStats.entries()).forEach(([key, stats]) => {
      // La clé vient de cityStats qui utilise déjà une clé normalisée
      // Mais stats.country peut avoir des variations, donc on le normalise à nouveau
      const [city, country] = key.split('|')
      const displayCity = city || 'Inconnu'
      // Utiliser stats.country qui est déjà normalisé, mais le re-normaliser pour être sûr
      const rawCountry = stats.country || country || 'Inconnu'
      
      // Filtrer les villes invalides
      if (displayCity === 'Inconnu' || 
          rawCountry === 'Autres' || 
          rawCountry === 'Inconnu' || 
          rawCountry === 'Unknown' ||
          displayCity.toLowerCase() === rawCountry.toLowerCase()) {
        return
      }
      
      // Normaliser le pays AVANT de créer la clé de fusion pour éviter les doublons
      // Double normalisation pour garantir la cohérence absolue
      const normalizedCountry = normalizeCountry(normalizeCountry(rawCountry))
      
      // Debug: collecter les variations
      if (!countryVariations.has(normalizedCountry)) {
        countryVariations.set(normalizedCountry, new Set())
      }
      countryVariations.get(normalizedCountry)!.add(rawCountry)
      
      // Clé de fusion : ville en lowercase + pays normalisé (en lowercase, trim, et normaliser espaces)
      // CRITIQUE: Utiliser EXACTEMENT la même logique que dans cityStats (même regex pour apostrophes)
      const normalizedCityKey = displayCity.toLowerCase().trim()
      const normalizedCountryKey = normalizedCountry.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[''`´]/g, "'")
      const fusionKey = `${normalizedCityKey}|${normalizedCountryKey}`
      
      // Debug: log si on trouve un doublon potentiel (même clé mais pays différent)
      if (cityMap.has(fusionKey)) {
        const existing = cityMap.get(fusionKey)!
        if (existing.country.toLowerCase().trim() !== normalizedCountry.toLowerCase().trim()) {
          console.log(`[GEO DEBUG] Doublon détecté pour ${displayCity}:`, {
            existingCountry: existing.country,
            newCountry: normalizedCountry,
            fusionKey,
            existingKey: `${existing.city.toLowerCase()}|${existing.country.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[''`´]/g, "'")}`
          })
        }
      }
      const existing = cityMap.get(fusionKey)
      
      if (existing) {
        // Fusionner les stats (cas où même ville/pays mais écrit différemment)
        existing.users += stats.users
        existing.activeAny30j += stats.activeAny30j
        existing.activeCore30j += stats.activeCore30j
      } else {
        cityMap.set(fusionKey, {
          city: displayCity, // Garder la casse originale de la ville
          country: normalizedCountry, // Pays normalisé
          users: stats.users,
          activeAny30j: stats.activeAny30j,
          activeCore30j: stats.activeCore30j
        })
      }
    })
    
    // Log des variations de pays détectées pour debug
    const variationsLog: Record<string, string[]> = {}
    countryVariations.forEach((variations, normalized) => {
      if (variations.size > 1) {
        variationsLog[normalized] = Array.from(variations)
      }
    })
    if (Object.keys(variationsLog).length > 0) {
      console.log('[METRICS GEO] Variations de pays détectées:', variationsLog)
    }
    
    const citiesTopUsers = Array.from(cityMap.values())
      .sort((a, b) => b.users - a.users)
      .slice(0, 10)
      .map(c => ({
        city: c.city,
        country: c.country,
        users: c.users,
        active30d: c.activeAny30j, // Compatibilité dashboard (alias)
        activeAny30j: c.activeAny30j, // Nouveau format
        activeCore30j: c.activeCore30j // Nouveau format
      }))

    // Répartition par région
    const regionsBreakdown = Array.from(regionStats.entries())
      .map(([region, stats]) => ({
        region,
        users: stats.users,
        active30d: stats.activeAny30j, // Compatibilité dashboard (alias)
        activeAny30j: stats.activeAny30j, // Nouveau format
        activeCore30j: stats.activeCore30j, // Nouveau format
        paidUsers: stats.paidUsers,
        revenue30d: stats.revenue30d
      }))
      .sort((a, b) => b.users - a.users)

    // Calculer les recommandations (EXCLURE "Autres" et "Inconnu")
    const validCountries = countriesTopUsers.filter(c => 
      c.country !== 'Autres' && 
      c.country !== 'Inconnu' && 
      c.country !== 'Unknown'
    )
    
    const validCities = citiesTopUsers.filter(c => 
      c.city !== 'Inconnu' && 
      c.country !== 'Autres' && 
      c.country !== 'Inconnu' && 
      c.country !== 'Unknown'
    )

    // Top 3 pays à fort potentiel (beaucoup de users + faible conversion OU conversion = 0%)
    // L'opportunité marketing est justement là où il y a beaucoup d'utilisateurs mais peu/pas de conversion
    const highPotentialCountries = validCountries
      .filter(c => c.users_total >= 5 && c.conversion < 20) // Inclure même conversion = 0%
      .sort((a, b) => {
        // Score = users * (1 - conversion/100) pour favoriser beaucoup d'users avec faible conversion
        // Pour conversion = 0%, le score est simplement users_total
        const scoreA = a.users_total * (1 - a.conversion / 100)
        const scoreB = b.users_total * (1 - b.conversion / 100)
        return scoreB - scoreA
      })
      .slice(0, 3)
      .map(c => ({
        country: c.country,
        users: c.users_total, // Compatibilité dashboard
        users_total: c.users_total, // Nouveau format
        conversionRate: c.conversion, // Compatibilité dashboard
        conversion: c.conversion // Nouveau format
      }))

    // Top 3 pays à forte performance (conversion élevée OU Active Core élevé OU beaucoup d'utilisateurs actifs)
    // Stratégie : inclure les pays avec activité significative, même si conversion = 0%
    // Si moins de 3 pays avec conversion > 0%, compléter avec les pays les plus actifs
    
    // D'abord, prendre les pays avec conversion > 0% (priorité aux revenus)
    const countriesWithConversion = validCountries
      .filter(c => c.users_total >= 3 && c.conversion > 0)
      .sort((a, b) => {
        // Score = conversion + activeCoreRate
        const scoreA = (a.conversion * 0.6) + (a.activeCoreRate * 0.4)
        const scoreB = (b.conversion * 0.6) + (b.activeCoreRate * 0.4)
        return scoreB - scoreA
      })
    
    // Ensuite, prendre les pays avec activité élevée même sans conversion
    const countriesWithActivity = validCountries
      .filter(c => {
        // Exclure ceux déjà dans countriesWithConversion
        const alreadyIncluded = countriesWithConversion.some(cc => cc.country === c.country)
        if (alreadyIncluded) return false
        
        // Inclure si : activeCoreRate >= 3% OU (beaucoup d'utilisateurs >= 8 avec activité)
        return c.users_total >= 3 && (
          c.activeCoreRate >= 3 || 
          (c.users_total >= 8 && c.activeRate > 0)
        )
      })
      .sort((a, b) => {
        // Score basé sur activeCoreRate et nombre d'utilisateurs
        const scoreA = (a.activeCoreRate * 0.6) + (Math.min(a.activeRate, 100) * 0.4)
        const scoreB = (b.activeCoreRate * 0.6) + (Math.min(b.activeRate, 100) * 0.4)
        
        // Si scores égaux, favoriser les pays avec plus d'utilisateurs
        if (Math.abs(scoreA - scoreB) < 0.1) {
          return b.users_total - a.users_total
        }
        
        return scoreB - scoreA
      })
    
    // Combiner et prendre les top 3
    const highPerformanceCountries = [
      ...countriesWithConversion,
      ...countriesWithActivity
    ]
      .slice(0, 3)
      .map(c => ({
        country: c.country,
        users: c.users_total, // Compatibilité dashboard
        users_total: c.users_total, // Nouveau format
        conversionRate: c.conversion, // Compatibilité dashboard
        conversion: c.conversion, // Nouveau format
        activeRate: c.activeRate, // Compatibilité dashboard
        activeCoreRate: c.activeCoreRate // Nouveau format
      }))

    // Top 3 villes pour événement (concentration utilisateurs + Active Core élevés)
    const topCitiesForEvents = validCities
      .filter(c => c.users >= 3)
      .sort((a, b) => {
        // Score = users * (activeCore30j / users)
        const activeCoreRateA = a.users > 0 ? a.activeCore30j / a.users : 0
        const activeCoreRateB = b.users > 0 ? b.activeCore30j / b.users : 0
        const scoreA = a.users * activeCoreRateA
        const scoreB = b.users * activeCoreRateB
        return scoreB - scoreA
      })
      .slice(0, 3)
      .map(c => ({
        city: c.city,
        country: c.country,
        users: c.users,
        active30d: c.activeAny30j, // Compatibilité dashboard (alias)
        activeAny30j: c.activeAny30j, // Nouveau format
        activeCore30j: c.activeCore30j // Nouveau format
      }))

    return NextResponse.json({
      success: true,
      geo: {
        regionsBreakdown,
        countriesTopUsers, // Top pays (EXCLUT "Autres" et "Inconnu")
        unidentifiedCountries, // "Autres" et "Inconnu" séparés pour information
        citiesTopUsers, // Top villes (EXCLUT pays "Autres/Inconnu" et villes = noms de pays)
        unknownShare: { // Compatibilité dashboard (alias vers dataQuality)
          unknownUsers: dataQuality.countryUnknown.count,
          totalUsers: totalUsers,
          percent: dataQuality.countryUnknown.percent
        },
        dataQuality, // Nouvelle section qualité des données
        recommendations: {
          highPotentialCountries, // EXCLUT "Autres" et "Inconnu"
          highPerformanceCountries, // EXCLUT "Autres" et "Inconnu"
          topCitiesForEvents // EXCLUT villes avec pays "Autres/Inconnu"
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
