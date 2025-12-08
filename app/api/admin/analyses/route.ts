import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Récupérer toutes les analyses avec supabaseAdmin (bypass RLS)
    const { data: analyses, error } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des analyses:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analyses: analyses || []
    })

  } catch (error) {
    console.error('Erreur API admin analyses:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { analysisId, progress, status } = await request.json()

    if (!analysisId) {
      return NextResponse.json(
        { error: 'ID d\'analyse requis' },
        { status: 400 }
      )
    }

    // Mettre à jour l'analyse avec supabaseAdmin
    const updateData: any = { progress }
    if (status) updateData.status = status

    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .update(updateData)
      .eq('id', analysisId)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Erreur API admin update:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
