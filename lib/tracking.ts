/**
 * Tracking d'événements pour analytics
 * 
 * Événements supportés:
 * - auth.signup
 * - auth.email_verified
 * - subscription.started
 * - subscription.renewed
 * - subscription.canceled
 * - payment.succeeded
 * - payment.failed
 * - content.capsule_viewed
 * - content.capsule_progress
 * - tool.used
 * - shop.product_viewed
 * - shop.add_to_cart
 * - shop.checkout_started
 * - shop.purchase_completed
 */

import { createClientBrowser } from './supabase'

export interface TrackingEvent {
  event_type: string
  payload?: Record<string, any>
  session_id?: string
}

const MAX_PAYLOAD_SIZE = 10000 // 10KB max pour éviter l'explosion de la base

/**
 * Track un événement
 * 
 * @param eventType - Type d'événement (ex: 'auth.signup', 'shop.product_viewed')
 * @param payload - Données additionnelles (sans données sensibles)
 */
export async function trackEvent(
  eventType: string,
  payload?: Record<string, any>
): Promise<void> {
  try {
    // Nettoyer le payload (enlever données sensibles, limiter taille)
    const cleanPayload = sanitizePayload(payload || {})

    // Récupérer ou créer un session_id (valide 30 min)
    let sessionId: string | undefined
    if (typeof window !== 'undefined') {
      sessionId = getOrCreateSessionId()
    }

    const event: TrackingEvent = {
      event_type: eventType,
      payload: cleanPayload,
      session_id: sessionId
    }

    // Envoyer l'événement via API route (plus sécurisé)
    if (typeof window !== 'undefined') {
      // Récupérer le token JWT pour l'authentification
      const supabase = createClientBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : undefined

      // Côté client: utiliser API route
      const response = await fetch('/api/tracking/event', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader })
        },
        body: JSON.stringify(event),
        keepalive: true // Important pour ne pas perdre les events si la page se ferme
      }).catch((error) => {
        // Ne pas bloquer l'UI en cas d'erreur de tracking
        console.warn('[TRACKING] Failed to send event:', error)
        return null
      })

      // Si le serveur a généré un session_id, le stocker
      if (response) {
        try {
          const result = await response.json()
          if (result.success && result.session_id && typeof window !== 'undefined') {
            storeSessionId(result.session_id)
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
    } else {
      // Côté serveur: insérer directement dans la base
      const { supabaseAdmin } = await import('./supabase')
      if (supabaseAdmin) {
        try {
          await supabaseAdmin
            .from('tracking_events')
            .insert({
              event_type: event.event_type,
              payload: event.payload,
              session_id: event.session_id
            })
        } catch (error) {
          console.warn('[TRACKING] Failed to insert event:', error)
        }
      }
    }
  } catch (error) {
    // Ne jamais faire échouer l'application à cause du tracking
    console.warn('[TRACKING] Error tracking event:', error)
  }
}

/**
 * Nettoie le payload pour enlever les données sensibles et limiter la taille
 */
function sanitizePayload(payload: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'card', 'cvv', 'ssn', 'credit']
  const cleaned: Record<string, any> = {}

  for (const [key, value] of Object.entries(payload)) {
    // Ignorer les clés sensibles
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      continue
    }

    // Limiter la profondeur et la taille
    if (typeof value === 'object' && value !== null) {
      const stringified = JSON.stringify(value)
      if (stringified.length > MAX_PAYLOAD_SIZE) {
        cleaned[key] = '[payload too large]'
      } else {
        cleaned[key] = value
      }
    } else {
      cleaned[key] = value
    }
  }

  // Vérifier la taille totale
  const totalSize = JSON.stringify(cleaned).length
  if (totalSize > MAX_PAYLOAD_SIZE) {
    return { _truncated: true, _original_size: totalSize }
  }

  return cleaned
}

/**
 * Génère ou récupère un session_id unique pour cette session (valide 30 min)
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  const storageKey = 'cash360_session_id'
  const expiryKey = 'cash360_session_expiry'
  
  const storedId = sessionStorage.getItem(storageKey)
  const storedExpiry = sessionStorage.getItem(expiryKey)
  
  // Vérifier si le session_id existe et est encore valide (30 min)
  if (storedId && storedExpiry) {
    const expiry = parseInt(storedExpiry, 10)
    if (Date.now() < expiry) {
      return storedId
    }
    // Expiré, on nettoie
    sessionStorage.removeItem(storageKey)
    sessionStorage.removeItem(expiryKey)
  }
  
  // Créer un nouveau session_id
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const expiry = Date.now() + (30 * 60 * 1000) // 30 minutes
  
  sessionStorage.setItem(storageKey, sessionId)
  sessionStorage.setItem(expiryKey, expiry.toString())
  
  return sessionId
}

/**
 * Stocke un session_id retourné par le serveur (valide 30 min)
 */
function storeSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return
  
  const storageKey = 'cash360_session_id'
  const expiryKey = 'cash360_session_expiry'
  const expiry = Date.now() + (30 * 60 * 1000) // 30 minutes
  
  sessionStorage.setItem(storageKey, sessionId)
  sessionStorage.setItem(expiryKey, expiry.toString())
}

/**
 * Helpers pour les événements courants
 */
export const tracking = {
  // Auth
  signup: (userId: string, metadata?: Record<string, any>) => 
    trackEvent('auth.signup', { userId, ...metadata }),
  
  emailVerified: (userId: string) => 
    trackEvent('auth.email_verified', { userId }),
  
  // Subscription
  subscriptionStarted: (userId: string, planId: string, amount?: number) => 
    trackEvent('subscription.started', { userId, planId, amount }),
  
  subscriptionRenewed: (userId: string, planId: string, amount?: number) => 
    trackEvent('subscription.renewed', { userId, planId, amount }),
  
  subscriptionCanceled: (userId: string, planId: string, reason?: string) => 
    trackEvent('subscription.canceled', { userId, planId, reason }),
  
  // Payment
  paymentSucceeded: (userId: string, amount: number, currency: string, productId?: string) => 
    trackEvent('payment.succeeded', { userId, amount, currency, productId }),
  
  paymentFailed: (userId: string, amount: number, currency: string, reason?: string) => 
    trackEvent('payment.failed', { userId, amount, currency, reason }),
  
  // Content
  capsuleViewed: (capsuleId: string) => 
    trackEvent('content.capsule_viewed', { capsuleId }),
  
  capsuleProgress: (capsuleId: string, percent: number) => 
    trackEvent('content.capsule_progress', { capsuleId, percent }),
  
  // Tools
  toolUsed: (toolKey: string, context?: Record<string, any>) => 
    trackEvent('tool.used', { toolKey, ...context }),
  
  toolOpened: (tool: 'budget' | 'debt_free' | 'fast', page?: string, context?: Record<string, any>) => 
    trackEvent('tool.opened', { tool, page, ...context }),
  
  // Budget core actions
  budgetSaved: (monthlyIncome: number, expenseCount: number, totalExpenses: number) =>
    trackEvent('budget.saved', { tool: 'budget', monthlyIncome, expenseCount, totalExpenses }),
  
  budgetExpenseAdded: (category: string, amount: number) =>
    trackEvent('budget.expense_added', { tool: 'budget', category, amount }),
  
  // Debt core actions
  debtPaymentMade: (amount: number, debtId?: string) =>
    trackEvent('debt.payment_made', { tool: 'debt_free', amount, debtId }),
  
  debtAdded: (monthlyPayment: number, totalAmount?: number) =>
    trackEvent('debt.added', { tool: 'debt_free', monthlyPayment, totalAmount }),
  
  // Fast core actions
  fastStarted: (categoryCount: number, estimatedMonthlySpend: number) =>
    trackEvent('fast.started', { tool: 'fast', categoryCount, estimatedMonthlySpend }),
  
  fastDayLogged: (dayIndex: number, respected: boolean) =>
    trackEvent('fast.day_logged', { tool: 'fast', dayIndex, respected }),
  
  // Shop
  productViewed: (productId: string) => 
    trackEvent('shop.product_viewed', { productId }),
  
  addToCart: (productId: string, quantity: number, price: number) => 
    trackEvent('shop.add_to_cart', { productId, quantity, price }),
  
  cartOpened: (itemCount: number) =>
    trackEvent('shop.cart_opened', { itemCount }),
  
  checkoutStarted: (cartValue: number, itemCount: number) => 
    trackEvent('shop.checkout_started', { cartValue, itemCount }),
  
  purchaseCompleted: (orderId: string, value: number, currency: string, items: any[]) => 
    trackEvent('shop.purchase_completed', { orderId, value, currency, items })
}
