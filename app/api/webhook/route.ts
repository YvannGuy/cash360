import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

// Désactiver le body parser pour Stripe webhook
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Gérer les événements de paiement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      // Récupérer les métadonnées
      const userId = session.metadata?.user_id
      const itemsJson = session.metadata?.items

      if (!userId || !itemsJson) {
        console.error('Metadata manquante dans la session Stripe')
        return NextResponse.json({ received: true })
      }

      const items = JSON.parse(itemsJson)

      if (!supabaseAdmin) {
        console.error('supabaseAdmin not initialized')
        return NextResponse.json({ received: true })
      }

      // Récupérer les produits depuis la DB
      const productIds = items.map((item: any) => item.id)
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('*')
        .in('id', productIds)

      if (!products) {
        console.error('Produits non trouvés')
        return NextResponse.json({ received: true })
      }

      // Créer les paiements
      const paymentEntries = await Promise.all(
        items.map(async (item: any) => {
          const product = products.find(p => p.id === item.id)
          const paymentType = product?.is_pack ? 'pack' : 'capsule'
          
          return {
            user_id: userId,
            product_id: item.id,
            payment_type: paymentType,
            amount: parseFloat(product.price) * item.quantity,
            currency: 'EUR',
            status: 'success',
            method: 'Stripe',
            transaction_id: session.id,
            created_at: new Date().toISOString()
          }
        })
      )

      // Insérer les paiements
      await supabaseAdmin.from('payments').insert(paymentEntries)

      // Créer les capsules achetées (user_capsules)
      const capsuleEntries = []
      for (const item of items) {
        const product = products.find(p => p.id === item.id)
        
        // Si c'est un pack, on ajoute toutes les capsules individuelles
        if (product?.is_pack) {
          const { data: allCapsules } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('is_pack', false)
          
          if (allCapsules && allCapsules.length > 0) {
            for (const capsule of allCapsules) {
              capsuleEntries.push({
                user_id: userId,
                capsule_id: capsule.id,
                created_at: new Date().toISOString()
              })
            }
          }
        } else {
          // Sinon, on ajoute juste la capsule achetée
          capsuleEntries.push({
            user_id: userId,
            capsule_id: item.id,
            created_at: new Date().toISOString()
          })
        }
      }

      // Insérer les capsules achetées
      if (capsuleEntries.length > 0) {
        await supabaseAdmin.from('user_capsules').insert(capsuleEntries)
      }

      console.log(`✅ Paiement Stripe réussi pour l'utilisateur ${userId}`)
    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error)
    }
  }

  return NextResponse.json({ received: true })
}

