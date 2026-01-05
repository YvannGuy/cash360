import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que supabaseAdmin est disponible
    if (!supabaseAdmin) {
      console.error('[MASTERCLASS-PAYMENT-MOBILE] Supabase Admin non configuré')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur. Veuillez contacter le support.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { registrationId, orderId } = body

    if (!registrationId || !orderId) {
      return NextResponse.json(
        { error: 'ID d\'inscription ou de commande manquant' },
        { status: 400 }
      )
    }

    // Mettre à jour l'inscription avec les informations de paiement Mobile Money
    const { error: updateError } = await supabaseAdmin
      .from('masterclass_registrations')
      .update({
        payment_method: 'mobile_money',
        order_id: orderId,
        payment_status: 'pending' // Sera validé manuellement
      })
      .eq('id', registrationId)

    if (updateError) {
      console.error('[MASTERCLASS-PAYMENT-MOBILE] Erreur:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'inscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Paiement Mobile Money enregistré. Votre inscription sera validée sous 24h après vérification de la preuve de paiement.'
    })
  } catch (error: any) {
    console.error('[MASTERCLASS-PAYMENT-MOBILE] Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

