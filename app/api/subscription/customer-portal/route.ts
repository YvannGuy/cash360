import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClientServer } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover'
})

function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer l'abonnement pour obtenir le stripe_customer_id
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subError) {
      console.error('[CUSTOMER PORTAL] Erreur récupération abonnement:', subError)
      return NextResponse.json(
        { error: 'Impossible de récupérer votre abonnement' },
        { status: 500 }
      )
    }

    if (!subscription || !subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé' },
        { status: 404 }
      )
    }

    const baseUrl = getBaseUrl(request)

    // Créer une session du Customer Portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/dashboard?tab=boutique`,
    })

    return NextResponse.json({
      url: portalSession.url
    })
  } catch (error: any) {
    console.error('[CUSTOMER PORTAL] Erreur:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}

