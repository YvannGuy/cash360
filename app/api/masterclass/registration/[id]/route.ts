import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier que supabaseAdmin est disponible
    if (!supabaseAdmin) {
      console.error('[MASTERCLASS-REGISTRATION] Supabase Admin non configuré')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur. Veuillez contacter le support.' },
        { status: 500 }
      )
    }

    const { id } = await params

    const { data: registration, error } = await supabaseAdmin
      .from('masterclass_registrations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !registration) {
      return NextResponse.json(
        { error: 'Inscription introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      registration
    })
  } catch (error: any) {
    console.error('[MASTERCLASS-REGISTRATION] Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

