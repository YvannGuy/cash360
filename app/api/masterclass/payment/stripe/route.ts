import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export async function POST(request: NextRequest) {
  try {
    // Vérifier que supabaseAdmin est disponible
    if (!supabaseAdmin) {
      console.error('[MASTERCLASS-PAYMENT-STRIPE] Supabase Admin non configuré')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur. Veuillez contacter le support.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { registrationId, amount, currency } = body

    if (!registrationId) {
      return NextResponse.json(
        { error: 'ID d\'inscription manquant' },
        { status: 400 }
      )
    }

    // Récupérer l'inscription
    const { data: registration, error: regError } = await supabaseAdmin
      .from('masterclass_registrations')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Inscription introuvable' },
        { status: 404 }
      )
    }

    if (registration.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Cette inscription est déjà payée' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Créer une session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'usd',
            product_data: {
              name: 'Masterclass Edition 2026 - CASH360',
              description: `Inscription ${registration.registration_type === 'pitch' ? 'Pitch Entrepreneur' : 'Participant'}`,
            },
            unit_amount: Math.round((amount || 15) * 100), // Convertir en cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/masterclass/confirmation?registrationId=${registrationId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/masterclass/paiement?registrationId=${registrationId}`,
      customer_email: registration.email,
      metadata: {
        registration_id: registrationId,
        registration_type: registration.registration_type,
        masterclass_edition: '2026'
      },
    })

    // Mettre à jour l'inscription avec la référence de paiement
    await supabaseAdmin
      .from('masterclass_registrations')
      .update({
        payment_reference: session.id,
        payment_method: 'stripe',
        order_id: session.id
      })
      .eq('id', registrationId)

    return NextResponse.json({
      success: true,
      url: session.url
    })
  } catch (error: any) {
    console.error('[MASTERCLASS-PAYMENT-STRIPE] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}

