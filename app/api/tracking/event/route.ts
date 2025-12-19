import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

/**
 * API route pour recevoir les événements de tracking côté client
 * 
 * Sécurisé: récupère user_id depuis le JWT token (pas depuis le body)
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
    const { event_type, payload, session_id } = body
    
    // Récupérer user_id depuis le JWT token (sécurité)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    let authedUserId = null
    if (token) {
      const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token)
      if (!userErr?.message && user) {
        authedUserId = user.id
      }
    }
    
    // Récupérer user_agent depuis les headers et le mettre dans payload
    const userAgent = request.headers.get('user-agent') || null
    
    // Générer session_id si absent (fallback serveur)
    const sid = session_id || `srv_${randomUUID()}`

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
      'tool.opened',
      'budget.saved',
      'budget.expense_added',
      'debt.payment_made',
      'debt.added',
      'fast.started',
      'fast.day_logged',
      'shop.product_viewed',
      'shop.add_to_cart',
      'shop.cart_opened',
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

    // Mettre user_agent dans le payload au lieu d'une colonne séparée
    const enrichedPayload = {
      ...(payload || {}),
      user_agent: userAgent
    }
    
    // Méthode 1: Essayer avec .from() (PostgREST)
    const { error, data } = await supabaseAdmin
      .from('tracking_events')
      .insert({
        event_type,
        user_id: authedUserId,
        payload: enrichedPayload,
        session_id: sid
      })
      .select('id,event_type,created_at')
      .single()

    if (!error && data) {
      // PostgREST fonctionne !
      console.log(`[TRACKING API] ✅ Event tracked via PostgREST: ${event_type}`, {
        id: data.id,
        user_id: authedUserId || 'anonymous'
      })
      return NextResponse.json({ 
        success: true, 
        eventId: data.id, 
        method: 'postgrest',
        session_id: sid // Renvoyer le session_id (généré ou reçu)
      })
    }

    // Méthode 2: Si PostgREST ne fonctionne pas (erreur PGRST2xx), utiliser la fonction SQL directe
    if (error && error.code?.startsWith('PGRST2')) {
      console.warn(`[TRACKING API] ⚠️ PostgREST ne voit pas la table (${error.code}), utilisation fonction SQL directe...`)
      
      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('insert_tracking_event', {
          p_event_type: event_type,
          p_user_id: authedUserId,
          p_payload: enrichedPayload,
          p_session_id: sid
        })

        if (!rpcError && rpcData) {
          console.log(`[TRACKING API] ✅ Event tracked via SQL function: ${event_type}`, {
            id: rpcData,
            user_id: authedUserId || 'anonymous'
          })
          return NextResponse.json({ 
            success: true, 
            eventId: rpcData, 
            method: 'sql_function',
            session_id: sid // Renvoyer le session_id
          })
        }

        if (rpcError) {
          console.error('[TRACKING API] ❌ SQL function error:', rpcError)
          return NextResponse.json(
            { 
              error: 'Erreur lors de l\'enregistrement (fonction SQL)',
              code: rpcError.code,
              message: rpcError.message
            },
            { status: 500 }
          )
        }
      } catch (rpcErr: any) {
        console.error('[TRACKING API] ❌ Exception avec fonction SQL:', rpcErr)
        return NextResponse.json(
          { 
            error: 'Erreur lors de l\'enregistrement',
            code: rpcErr.code,
            message: rpcErr.message
          },
          { status: 500 }
        )
      }
    }

    // Si erreur PostgREST autre que PGRST2xx, log et stop
    console.error('[TRACKING API] ❌ Erreur PostgREST:', {
      code: error?.code,
      message: error?.message,
      event_type
    })
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'enregistrement',
        code: error?.code,
        message: error?.message || 'Erreur PostgREST'
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('[TRACKING API] Fatal error:', error)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
