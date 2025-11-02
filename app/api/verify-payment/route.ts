import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId, items } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID manquant' },
        { status: 400 }
      )
    }

    // Vérifier la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Paiement non complété' },
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

    // Vérifier si le paiement a déjà été traité
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', sessionId)
      .eq('status', 'success')
      .limit(1)

    if (existingPayments && existingPayments.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Paiement déjà traité'
      })
    }

    // Récupérer les produits depuis la DB
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', items.map((item: any) => item.id))

    if (!products) {
      return NextResponse.json(
        { error: 'Produits non trouvés' },
        { status: 400 }
      )
    }

    // Créer les paiements
    const paymentEntries = await Promise.all(
      items.map(async (item: any) => {
        const product = products.find(p => p.id === item.id)
        const paymentType = product?.is_pack ? 'pack' : 'capsule'
        
        return {
          user_id: user.id,
          product_id: item.id,
          payment_type: paymentType,
          amount: parseFloat(product.price) * item.quantity,
          currency: 'EUR',
          status: 'success',
          method: 'Stripe',
          transaction_id: sessionId,
          created_at: new Date().toISOString()
        }
      })
    )

    // Insérer les paiements
    await supabase.from('payments').insert(paymentEntries)

    // Créer les capsules achetées (user_capsules)
    const capsuleEntries = []
    for (const item of items) {
      const product = products.find(p => p.id === item.id)
      
      // Si c'est un pack, on ajoute toutes les capsules individuelles
      if (product?.is_pack) {
        const { data: allCapsules } = await supabase
          .from('products')
          .select('id')
          .eq('is_pack', false)
        
        if (allCapsules && allCapsules.length > 0) {
          for (const capsule of allCapsules) {
            capsuleEntries.push({
              user_id: user.id,
              capsule_id: capsule.id,
              created_at: new Date().toISOString()
            })
          }
        }
      } else {
        // Sinon, on ajoute juste la capsule achetée
        capsuleEntries.push({
          user_id: user.id,
          capsule_id: item.id,
          created_at: new Date().toISOString()
        })
      }
    }

    // Insérer les capsules achetées
    if (capsuleEntries.length > 0) {
      await supabase.from('user_capsules').insert(capsuleEntries)
    }

    return NextResponse.json({
      success: true,
      message: 'Paiement vérifié et capsules créées'
    })

  } catch (error: any) {
    console.error('Erreur vérification paiement:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

