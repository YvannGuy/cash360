import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * API route pour recevoir les événements de tracking côté client
 * 
 * Sécurisé: vérifie que l'utilisateur est authentifié (optionnel pour certains events)
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Tracking non configuré' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { event_type, user_id, payload, session_id, user_agent } = body

    if (!event_type || typeof event_type !== 'string') {
      return NextResponse.json(
        { error: 'event_type requis' },
        { status: 400 }
      )
    }

    // Valider le type d'événement (whitelist)
    const allowedEventTypes = [
      'auth.signup',
      'auth.email_verified',
      'subscription.started',
      'subscription.renewed',
      'subscription.canceled',
      'payment.succeeded',
      'payment.failed',
      'content.capsule_viewed',
      'content.capsule_progress',
      'tool.used',
      'shop.product_viewed',
      'shop.add_to_cart',
      'shop.checkout_started',
      'shop.purchase_completed'
    ]

    if (!allowedEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: 'Type d\'événement non autorisé' },
        { status: 400 }
      )
    }

    // Limiter la taille du payload
    if (payload && JSON.stringify(payload).length > 10000) {
      return NextResponse.json(
        { error: 'Payload trop volumineux' },
        { status: 400 }
      )
    }

    // Insérer l'événement
    const { error, data } = await supabaseAdmin
      .from('tracking_events')
      .insert({
        event_type,
        user_id: user_id || null,
        payload: payload || {},
        session_id: session_id || null,
        user_agent: user_agent || null,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('[TRACKING API] Error inserting event:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[TRACKING API] Fatal error:', error)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
