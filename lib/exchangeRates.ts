// Service pour gérer les taux de change avec cache
// Solution hybride : taux fixes pour XOF/XAF, API pour les autres

const CACHE_KEY = 'exchange_rates_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 heures en millisecondes

// Taux fixes pour les devises stables
const FIXED_RATES: Record<string, number> = {
  EUR: 1.0,
  XOF: 655,  // FCFA Ouest (UEMOA) - taux fixe
  XAF: 655,  // FCFA Centrale (CEMAC) - taux fixe
}

interface ExchangeRatesCache {
  rates: Record<string, number>
  timestamp: number
  base: string
}

/**
 * Charge les taux de change depuis l'API exchangerate-api.com
 * Utilise un cache de 24h pour éviter trop de requêtes
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des taux de change')
    }
    
    const data = await response.json()
    return data.rates || {}
  } catch (error) {
    console.error('Erreur fetchExchangeRates:', error)
    // Retourner les taux par défaut en cas d'erreur
    return getDefaultRates()
  }
}

/**
 * Récupère les taux par défaut (fallback)
 */
function getDefaultRates(): Record<string, number> {
  return {
    USD: 1.10,
    CNY: 7.8,
    MXN: 20.0,
    GBP: 0.85,
    CAD: 1.50,
    AUD: 1.65,
    JPY: 165.0,
    BRL: 5.50,
    INR: 92.0,
    ZAR: 20.0,
    ...FIXED_RATES,
  }
}

/**
 * Charge les taux de change avec cache
 * - Vérifie d'abord le cache localStorage
 * - Si cache valide (< 24h), utilise les taux en cache
 * - Sinon, charge depuis l'API et met à jour le cache
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  // Toujours inclure les taux fixes
  const rates: Record<string, number> = { ...FIXED_RATES }

  // Vérifier le cache côté client uniquement
  if (typeof window === 'undefined') {
    // Côté serveur : retourner les taux par défaut
    return { ...rates, ...getDefaultRates() }
  }

  try {
    // Vérifier le cache localStorage
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const cacheData: ExchangeRatesCache = JSON.parse(cached)
      const now = Date.now()
      
      // Si le cache est encore valide (< 24h)
      if (now - cacheData.timestamp < CACHE_DURATION && cacheData.rates) {
        console.log('[EXCHANGE_RATES] Utilisation du cache')
        return { ...rates, ...cacheData.rates }
      }
    }

    // Cache expiré ou inexistant : charger depuis l'API
    console.log('[EXCHANGE_RATES] Chargement depuis l\'API')
    const apiRates = await fetchExchangeRates()
    
    // Fusionner avec les taux fixes (les taux fixes ont priorité)
    const mergedRates = { ...apiRates, ...rates }
    
    // Sauvegarder dans le cache
    const cacheData: ExchangeRatesCache = {
      rates: apiRates,
      timestamp: Date.now(),
      base: 'EUR',
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    
    return mergedRates
  } catch (error) {
    console.error('Erreur getExchangeRates:', error)
    // En cas d'erreur, utiliser les taux par défaut
    return { ...rates, ...getDefaultRates() }
  }
}

/**
 * Récupère un taux de change spécifique
 */
export async function getExchangeRate(currency: string): Promise<number> {
  const rates = await getExchangeRates()
  return rates[currency] || 1.0
}

/**
 * Force le rafraîchissement du cache (recharge depuis l'API)
 */
export async function refreshExchangeRates(): Promise<Record<string, number>> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY)
  }
  return getExchangeRates()
}

/**
 * Initialise les taux de change (à appeler au démarrage de l'app)
 * Charge les taux en arrière-plan pour les avoir prêts
 */
export function initializeExchangeRates(): void {
  if (typeof window !== 'undefined') {
    // Charger les taux en arrière-plan
    getExchangeRates().catch(console.error)
  }
}

