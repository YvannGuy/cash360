import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasActiveSubscription, SubscriptionRecord } from '@/lib/subscriptionAccess'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover'
})

const SALOMON_PRICE_ID = process.env.STRIPE_SALOMON_PRICE_ID || 'price_1SZwvXFv4a9jSj8cgdjfzaYd'
const SUBSCRIPTION_PLAN_CODE = 'sagesse-salomon'

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
    if (!SALOMON_PRICE_ID) {
      return NextResponse.json(
        { error: 'Stripe price ID manquant' },
        { status: 500 }
      )
    }

    const { productId } = await request.json()
    if (!productId) {
      return NextResponse.json(
        { error: 'Produit requis' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // noop
            }
          }
        }
      }
    )

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, category, name')
      .eq('id', productId)
      .maybeSingle()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    if (product.category !== 'abonnement') {
      return NextResponse.json(
        { error: 'Produit non éligible à l’abonnement' },
        { status: 400 }
      )
    }

    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('status, grace_until, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (hasActiveSubscription(existingSub as SubscriptionRecord | null)) {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif.' },
        { status: 400 }
      )
    }

    const baseUrl = getBaseUrl(request)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: SALOMON_PRICE_ID,
          quantity: 1
        }
      ],
      customer: existingSub?.stripe_customer_id || undefined,
      customer_email: existingSub?.stripe_customer_id ? undefined : user.email || undefined,
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?tab=boutique`,
      metadata: {
        user_id: user.id,
        plan: SUBSCRIPTION_PLAN_CODE,
        items: JSON.stringify([{ id: productId, quantity: 1 }])
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          product_id: productId,
          plan: SUBSCRIPTION_PLAN_CODE
        }
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[SUBSCRIPTION CHECKOUT] error', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur interne' },
      { status: 500 }
    )
  }
}

