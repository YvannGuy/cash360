import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante'
      })
    }

    // Récupérer toutes les analyses pour diagnostic
    const { data: allAnalyses, error: allError } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des analyses',
        details: allError.message
      })
    }

    // Récupérer les analyses avec user_id null
    const { data: nullUserAnalyses, error: nullError } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false })

    if (nullError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des analyses sans user_id',
        details: nullError.message
      })
    }

    // Récupérer les analyses avec user_id non null
    const { data: userAnalyses, error: userError } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des analyses avec user_id',
        details: userError.message
      })
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalAnalyses: allAnalyses?.length || 0,
        analysesWithUserId: userAnalyses?.length || 0,
        analysesWithoutUserId: nullUserAnalyses?.length || 0
      },
      allAnalyses: allAnalyses?.map(a => ({
        id: a.id,
        ticket: a.ticket,
        client_name: a.client_name,
        client_email: a.client_email,
        user_id: a.user_id,
        status: a.status,
        created_at: a.created_at
      })) || [],
      nullUserAnalyses: nullUserAnalyses?.map(a => ({
        id: a.id,
        ticket: a.ticket,
        client_name: a.client_name,
        client_email: a.client_email,
        user_id: a.user_id,
        status: a.status,
        created_at: a.created_at
      })) || []
    })

  } catch (error) {
    console.error('Erreur lors du diagnostic du dashboard:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}
