import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

// Fonction pour obtenir l'URL de base selon l'environnement
function getBaseUrl(request: NextRequest): string {
  // En production ou si NEXT_PUBLIC_SITE_URL est défini, utiliser celui-ci
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // Sinon, construire l'URL depuis la requête (localhost en dev)
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer les items du panier depuis la requête
    const { items, total, source } = await request.json()
    
    const baseUrl = getBaseUrl(request)
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Panier vide ou invalide' },
        { status: 400 }
      )
    }

    // Créer un client Supabase avec les cookies
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
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Valider que les produits existent dans la DB
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

    // Calculer le montant total depuis les produits DB (sécurité)
    const calculatedTotal = items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.id)
      return sum + (parseFloat(product?.price) || 0) * item.quantity
    }, 0)

    if (Math.abs(calculatedTotal - total) > 0.01) {
      return NextResponse.json(
        { error: 'Montant total invalide' },
        { status: 400 }
      )
    }

    // Créer les line items pour Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      const product = products.find(p => p.id === item.id)
      const productData: any = {
        name: product.name,
      }
      // Ajouter la description seulement si elle existe et n'est pas vide
      if (item.blurb && item.blurb.trim() !== '') {
        productData.description = item.blurb
      }
      
      return {
        price_data: {
          currency: 'eur',
          product_data: productData,
          unit_amount: Math.round(parseFloat(product.price) * 100), // Stripe utilise les centimes
        },
        quantity: item.quantity,
      }
    })

    // Créer la session Checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: source === 'analysis' 
        ? `${baseUrl}/analyse-financiere`
        : `${baseUrl}/dashboard?tab=boutique`,
      metadata: {
        user_id: user.id,
        items: JSON.stringify(items),
        source: source || 'boutique',
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error: any) {
    console.error('Erreur création session Stripe:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

