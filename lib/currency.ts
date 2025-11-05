// Taux de change par défaut (fallback si API indisponible)
// Les taux fixes pour XOF/XAF sont toujours utilisés
// Les autres devises sont chargées depuis l'API avec cache
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  EUR: 1.0,
  XOF: 655,  // FCFA Ouest (UEMOA) - toujours fixe
  XAF: 655,  // FCFA Centrale (CEMAC) - toujours fixe
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
}

// Pour compatibilité, garder EXCHANGE_RATES comme alias
export const EXCHANGE_RATES = DEFAULT_EXCHANGE_RATES

// Mapping pays → devise (ISO 3166-1 alpha-2)
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Afrique de l'Ouest (UEMOA) - XOF
  'SN': 'XOF', // Sénégal
  'CI': 'XOF', // Côte d'Ivoire
  'BF': 'XOF', // Burkina Faso
  'BJ': 'XOF', // Bénin
  'ML': 'XOF', // Mali
  'NE': 'XOF', // Niger
  'TG': 'XOF', // Togo
  'GW': 'XOF', // Guinée-Bissau

  // Afrique Centrale (CEMAC) - XAF
  'CM': 'XAF', // Cameroun
  'TD': 'XAF', // Tchad
  'CF': 'XAF', // Centrafrique
  'CG': 'XAF', // Congo
  'GA': 'XAF', // Gabon
  'GQ': 'XAF', // Guinée équatoriale

  // Autres pays
  'US': 'USD', // États-Unis
  'CN': 'CNY', // Chine
  'MX': 'MXN', // Mexique
  'GB': 'GBP', // Royaume-Uni
  'CA': 'CAD', // Canada
  'AU': 'AUD', // Australie
  'JP': 'JPY', // Japon
  'BR': 'BRL', // Brésil
  'IN': 'INR', // Inde
  'ZA': 'ZAR', // Afrique du Sud

  // Europe (EUR)
  'FR': 'EUR',
  'DE': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'BE': 'EUR',
  'NL': 'EUR',
  'PT': 'EUR',
  'IE': 'EUR',
  'GR': 'EUR',
  'AT': 'EUR',
  'FI': 'EUR',
  'LU': 'EUR',
  'MT': 'EUR',
  'CY': 'EUR',
  'SK': 'EUR',
  'SI': 'EUR',
  'EE': 'EUR',
  'LV': 'EUR',
  'LT': 'EUR',
}

// Symboles de devises
export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  XOF: 'FCFA',
  XAF: 'FCFA',
  USD: '$',
  CNY: '¥',
  MXN: '$',
  GBP: '£',
  CAD: '$',
  AUD: '$',
  JPY: '¥',
  BRL: 'R$',
  INR: '₹',
  ZAR: 'R',
}

// Formats de nombre par locale
export const CURRENCY_LOCALES: Record<string, string> = {
  EUR: 'fr-FR',
  XOF: 'fr-FR',
  XAF: 'fr-FR',
  USD: 'en-US',
  CNY: 'zh-CN',
  MXN: 'es-MX',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP',
  BRL: 'pt-BR',
  INR: 'en-IN',
  ZAR: 'en-ZA',
}

/**
 * Convertit un prix en EUR vers une devise cible
 * Utilise les taux dynamiques si disponibles, sinon les taux par défaut
 */
export function convertPrice(priceEUR: number, targetCurrency: string, rates?: Record<string, number>): number {
  const exchangeRates = rates || DEFAULT_EXCHANGE_RATES
  const rate = exchangeRates[targetCurrency] || 1.0
  return priceEUR * rate
}

/**
 * Formate un prix selon la devise
 */
export function formatPrice(price: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  const locale = CURRENCY_LOCALES[currency] || 'fr-FR'
  
  // Pour FCFA, afficher sans décimales et avec espacement
  if (currency === 'XOF' || currency === 'XAF') {
    return `${Math.round(price).toLocaleString('fr-FR')} ${symbol}`
  }
  
  // Pour JPY, pas de décimales
  if (currency === 'JPY') {
    return `${Math.round(price).toLocaleString('ja-JP')} ${symbol}`
  }
  
  // Pour les autres devises, utiliser Intl.NumberFormat
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
    
    // Si la devise n'est pas reconnue par Intl, format manuel
    if (formatted.includes('NaN') || !formatted) {
      return `${price.toFixed(2)} ${symbol}`
    }
    
    return formatted
  } catch (error) {
    // Fallback si Intl.NumberFormat échoue
    return `${price.toFixed(2)} ${symbol}`
  }
}

/**
 * Détecte la devise depuis un code pays
 */
export function getCurrencyFromCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode] || 'EUR'
}

/**
 * Détecte le pays depuis les headers Vercel Edge
 */
export function detectCountryFromHeaders(headers: Headers): string | null {
  // Vercel Edge fournit ces headers
  const country = headers.get('x-vercel-ip-country') || 
                  headers.get('cf-ipcountry') || 
                  headers.get('x-country-code')
  return country || null
}

