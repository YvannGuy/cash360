import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, consent, meta, source } = body

    // Validation
    if (!email || !consent) {
      return NextResponse.json(
        { error: 'Email et consentement requis' },
        { status: 400 }
      )
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      )
    }

    // Enregistrer dans Supabase
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert([
        {
          email,
          source: source || 'simulation',
          meta: meta || {},
        },
      ])
      .select()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du lead' },
        { status: 500 }
      )
    }

    console.log('Lead enregistré dans Supabase:', data)

    return NextResponse.json({
      ok: true,
      message: 'Lead enregistré avec succès',
      data,
    })
  } catch (error) {
    console.error('Erreur API leads:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
