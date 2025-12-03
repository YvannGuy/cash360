import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClientServer } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover'
})

type SubscriptionAction = 'cancel_period_end' | 'resume' | 'terminate_immediately'

const ACTIONS: SubscriptionAction[] = ['cancel_period_end', 'resume', 'terminate_immediately']

export async function PATCH(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action as SubscriptionAction

    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Action non supportée' }, { status: 400 })
    }

    const supabase = await createClientServer()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, price_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subscriptionError || !subscription) {
      return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 })
    }

    // Terminaison immédiate (pour Mobile Money et Stripe)
    if (action === 'terminate_immediately') {
      // Si c'est un abonnement Stripe, le supprimer immédiatement
      if (subscription.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
        } catch (stripeError: any) {
          console.error('[PATCH /api/subscription/manage] Erreur annulation Stripe:', stripeError)
          // Continuer même si l'annulation Stripe échoue, on mettra quand même à jour la DB
        }
      }

      // Mettre à jour l'abonnement dans la base de données (Mobile Money ou Stripe)
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: false,
          grace_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[PATCH /api/subscription/manage] Erreur mise à jour DB:', updateError)
        return NextResponse.json({ error: 'Impossible de terminer l\'abonnement' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Abonnement terminé immédiatement'
      })
    }

    // Actions pour Stripe uniquement
    if (!subscription.stripe_subscription_id) {
      return NextResponse.json({ error: 'Cette action n\'est disponible que pour les abonnements Stripe' }, { status: 400 })
    }

    const subscriptionId = subscription.stripe_subscription_id
    let updatedSubscription: Stripe.Subscription

    if (action === 'cancel_period_end') {
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    } else {
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false })
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        currentPeriodEnd: (updatedSubscription as any).current_period_end ? new Date((updatedSubscription as any).current_period_end * 1000).toISOString() : null
      }
    })
  } catch (error) {
    console.error('[PATCH /api/subscription/manage] error', error)
    return NextResponse.json({ error: 'Impossible de mettre à jour l’abonnement' }, { status: 500 })
  }
}

