import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

// GET: Récupérer tous les abonnements avec les informations utilisateur
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    let query = supabaseAdmin!
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('[SUBSCRIPTIONS API] Erreur:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Récupérer tous les utilisateurs pour enrichir les abonnements avec email et nom
    const MAX_PER_PAGE = 200
    const allUsersList: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: usersData, error: usersError } = await supabaseAdmin!.auth.admin.listUsers({
        page,
        perPage: MAX_PER_PAGE
      })

      if (usersError) {
        console.error('[SUBSCRIPTIONS API] Erreur récupération utilisateurs:', usersError)
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

    const userMap = new Map<string, { email: string, name?: string }>()
    
    allUsersList.forEach((user) => {
      const firstName = user.user_metadata?.first_name || ''
      const lastName = user.user_metadata?.last_name || ''
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
      const name = fullName || user.user_metadata?.full_name || user.user_metadata?.name || undefined
      
      userMap.set(user.id, {
        email: user.email || '',
        name: name
      })
    })

    // Enrichir les abonnements avec les informations utilisateur
    const enrichedSubscriptions = (subscriptions || []).map((sub: any) => {
      const userInfo = userMap.get(sub.user_id)
      const email = userInfo?.email || null
      const name = userInfo?.name || (email ? email.split('@')[0] : null)
      
      return {
        ...sub,
        user_email: email,
        user_name: name
      }
    })

    // Calculer les statistiques
    const stats = {
      total: enrichedSubscriptions.length,
      active: enrichedSubscriptions.filter((s: any) => s.status === 'active').length,
      canceled: enrichedSubscriptions.filter((s: any) => s.status === 'canceled').length,
      pastDue: enrichedSubscriptions.filter((s: any) => s.status === 'past_due').length,
      trialing: enrichedSubscriptions.filter((s: any) => s.status === 'trialing').length,
      mobileMoney: enrichedSubscriptions.filter((s: any) => !s.stripe_subscription_id || s.price_id === 'mobile_money_manual').length,
      stripe: enrichedSubscriptions.filter((s: any) => s.stripe_subscription_id && s.price_id !== 'mobile_money_manual').length
    }

    return NextResponse.json({
      success: true,
      subscriptions: enrichedSubscriptions,
      stats
    })

  } catch (error: any) {
    console.error('Erreur API admin subscriptions GET:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PATCH: Terminer un abonnement immédiatement
export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { subscriptionId, userId } = body

    if (!subscriptionId && !userId) {
      return NextResponse.json(
        { error: 'subscriptionId ou userId requis' },
        { status: 400 }
      )
    }

    // Récupérer l'abonnement
    let query = supabaseAdmin!
      .from('user_subscriptions')
      .select('*')
    
    if (subscriptionId) {
      query = query.eq('id', subscriptionId)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data: subscription, error: fetchError } = await query.maybeSingle()

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      )
    }

    // Si c'est un abonnement Stripe, l'annuler via Stripe
    if (subscription.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-10-29.clover'
        })
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
      } catch (stripeError: any) {
        console.error('[ADMIN/SUBSCRIPTIONS] Erreur annulation Stripe:', stripeError)
        // Continuer même si l'annulation Stripe échoue
      }
    }

    // Mettre à jour l'abonnement dans la base de données
    // Ajouter un marqueur pour indiquer que c'est une terminaison manuelle par l'admin
    const { data: updatedSubscription, error: updateError } = await supabaseAdmin!
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: false,
        grace_until: null,
        // Stocker dans metadata que c'est une terminaison manuelle
        metadata: { manually_terminated_by_admin: true, terminated_at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('[ADMIN/SUBSCRIPTIONS] Erreur mise à jour:', updateError)
      return NextResponse.json(
        { error: 'Impossible de terminer l\'abonnement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Abonnement terminé avec succès',
      subscription: updatedSubscription
    })

  } catch (error: any) {
    console.error('Erreur API admin subscriptions PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

