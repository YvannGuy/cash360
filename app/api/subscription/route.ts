import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'
import { hasActiveSubscription } from '@/lib/subscriptionAccess'

export async function GET() {
  try {
    const supabase = await createClientServer()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(
        `status,
         grace_until,
         current_period_end,
         current_period_start,
         cancel_at_period_end,
         stripe_subscription_id,
         stripe_customer_id,
         plan_id,
         price_id,
         created_at,
         updated_at`
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[SUBSCRIPTION] GET error', error)
      return NextResponse.json({ error: 'Impossible de récupérer l’abonnement' }, { status: 500 })
    }

    return NextResponse.json({
      subscription,
      hasAccess: hasActiveSubscription(subscription)
    })
  } catch (error) {
    console.error('[SUBSCRIPTION] GET fatal error', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

