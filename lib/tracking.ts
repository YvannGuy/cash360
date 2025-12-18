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
  user_id?: string
  payload?: Record<string, any>
  session_id?: string
  ip_address?: string
  user_agent?: string
}

const MAX_PAYLOAD_SIZE = 10000 // 10KB max pour éviter l'explosion de la base

/**
 * Track un événement
 * 
 * @param eventType - Type d'événement (ex: 'auth.signup', 'shop.product_viewed')
 * @param payload - Données additionnelles (sans données sensibles)
 * @param userId - ID utilisateur (optionnel, récupéré automatiquement si non fourni)
 */
export async function trackEvent(
  eventType: string,
  payload?: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    // Ne pas tracker en développement sauf si explicitement activé
    // Note: NEXT_PUBLIC_ est requis pour les variables d'environnement côté client
    const enableTracking = process.env.NEXT_PUBLIC_ENABLE_TRACKING === 'true' || process.env.ENABLE_TRACKING === 'true'
    if (process.env.NODE_ENV === 'development' && !enableTracking) {
      return
    }

    // Nettoyer le payload (enlever données sensibles, limiter taille)
    const cleanPayload = sanitizePayload(payload || {})
    
    // Récupérer l'utilisateur si non fourni (côté client uniquement)
    let finalUserId = userId
    if (!finalUserId && typeof window !== 'undefined') {
      try {
        const supabase = createClientBrowser()
        const { data: { user } } = await supabase.auth.getUser()
        finalUserId = user?.id
      } catch (error) {
        // Ignorer les erreurs d'auth silencieusement
      }
    }

    // Générer un session_id côté client
    let sessionId: string | undefined
    if (typeof window !== 'undefined') {
      sessionId = getOrCreateSessionId()
    }

    const event: TrackingEvent = {
      event_type: eventType,
      user_id: finalUserId,
      payload: cleanPayload,
      session_id: sessionId,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    }

    // Envoyer l'événement via API route (plus sécurisé)
    if (typeof window !== 'undefined') {
      // Côté client: utiliser API route
      fetch('/api/tracking/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true // Important pour ne pas perdre les events si la page se ferme
      }).catch((error) => {
        // Ne pas bloquer l'UI en cas d'erreur de tracking
        console.warn('[TRACKING] Failed to send event:', error)
      })
    } else {
      // Côté serveur: insérer directement dans la base
      const { supabaseAdmin } = await import('./supabase')
      if (supabaseAdmin) {
        try {
          await supabaseAdmin
            .from('tracking_events')
            .insert({
              event_type: event.event_type,
              user_id: event.user_id,
              payload: event.payload,
              session_id: event.session_id,
              user_agent: event.user_agent,
              created_at: new Date().toISOString()
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
 * Génère ou récupère un session_id unique pour cette session
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  const storageKey = 'cash360_session_id'
  let sessionId = sessionStorage.getItem(storageKey)
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(storageKey, sessionId)
  }
  
  return sessionId
}

/**
 * Helpers pour les événements courants
 */
export const tracking = {
  // Auth
  signup: (userId: string, metadata?: Record<string, any>) => 
    trackEvent('auth.signup', { userId, ...metadata }, userId),
  
  emailVerified: (userId: string) => 
    trackEvent('auth.email_verified', { userId }, userId),
  
  // Subscription
  subscriptionStarted: (userId: string, planId: string, amount?: number) => 
    trackEvent('subscription.started', { userId, planId, amount }, userId),
  
  subscriptionRenewed: (userId: string, planId: string, amount?: number) => 
    trackEvent('subscription.renewed', { userId, planId, amount }, userId),
  
  subscriptionCanceled: (userId: string, planId: string, reason?: string) => 
    trackEvent('subscription.canceled', { userId, planId, reason }, userId),
  
  // Payment
  paymentSucceeded: (userId: string, amount: number, currency: string, productId?: string) => 
    trackEvent('payment.succeeded', { userId, amount, currency, productId }, userId),
  
  paymentFailed: (userId: string, amount: number, currency: string, reason?: string) => 
    trackEvent('payment.failed', { userId, amount, currency, reason }, userId),
  
  // Content
  capsuleViewed: (capsuleId: string, userId?: string) => 
    trackEvent('content.capsule_viewed', { capsuleId }, userId),
  
  capsuleProgress: (capsuleId: string, percent: number, userId?: string) => 
    trackEvent('content.capsule_progress', { capsuleId, percent }, userId),
  
  // Tools
  toolUsed: (toolKey: string, context?: Record<string, any>, userId?: string) => 
    trackEvent('tool.used', { toolKey, ...context }, userId),
  
  // Shop
  productViewed: (productId: string, userId?: string) => 
    trackEvent('shop.product_viewed', { productId }, userId),
  
  addToCart: (productId: string, quantity: number, price: number, userId?: string) => 
    trackEvent('shop.add_to_cart', { productId, quantity, price }, userId),
  
  checkoutStarted: (cartValue: number, itemCount: number, userId?: string) => 
    trackEvent('shop.checkout_started', { cartValue, itemCount }, userId),
  
  purchaseCompleted: (orderId: string, value: number, currency: string, items: any[], userId?: string) => 
    trackEvent('shop.purchase_completed', { orderId, value, currency, items }, userId)
}
