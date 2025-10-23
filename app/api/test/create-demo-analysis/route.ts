import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Créer une analyse de démonstration
    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .insert({
        ticket: 'CASH-DEMO-001',
        client_name: 'Utilisateur Démo',
        client_email: 'demo@example.com',
        status: 'en_cours',
        progress: 25,
        mode_paiement: 'paypal',
        message: 'Analyse de démonstration',
        user_id: null // Pour l'instant, on laisse null
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de l\'analyse de démo:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
      message: 'Analyse de démonstration créée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création de l\'analyse de démo:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
