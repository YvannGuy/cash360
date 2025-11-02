import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { items, total } = await request.json()
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Panier vide ou invalide' },
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
              // Ignore
            }
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Valider produits
    const productIds = items.map(item => item.id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
    
    if (productsError || !products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Produits invalides' },
        { status: 400 }
      )
    }

    // Calculer montant
    const calculatedTotal = items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.id)
      return sum + (parseFloat(product.price) * 100) * item.quantity
    }, 0)

    // Créer PaymentIntent pour Stripe Elements
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculatedTotal,
      currency: 'eur',
      metadata: {
        user_id: user.id,
        items: JSON.stringify(items),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })

  } catch (error: any) {
    console.error('Erreur création PaymentIntent:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

