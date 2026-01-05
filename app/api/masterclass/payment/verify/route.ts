import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, sessionId } = body

    if (!registrationId || !sessionId) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Vérifier la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      // Mettre à jour l'inscription
      const { error: updateError } = await supabaseAdmin
        .from('masterclass_registrations')
        .update({
          payment_status: 'paid',
          payment_reference: sessionId
        })
        .eq('id', registrationId)

      if (updateError) {
        console.error('[MASTERCLASS-PAYMENT-VERIFY] Erreur:', updateError)
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour' },
          { status: 500 }
        )
      }

      // TODO: Envoyer un email de confirmation

      return NextResponse.json({
        success: true,
        paid: true
      })
    }

    return NextResponse.json({
      success: true,
      paid: false
    })
  } catch (error: any) {
    console.error('[MASTERCLASS-PAYMENT-VERIFY] Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

