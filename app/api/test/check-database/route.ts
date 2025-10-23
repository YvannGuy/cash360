import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante',
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      })
    }

    // Vérifier si les tables existent
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['analyses', 'analysis_files'])

    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification des tables',
        details: tablesError.message
      })
    }

    // Vérifier le nombre d'analyses
    const { data: analyses, error: analysesError } = await supabaseAdmin
      .from('analyses')
      .select('count')
      .limit(1)

    if (analysesError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification des analyses',
        details: analysesError.message
      })
    }

    // Vérifier le nombre de fichiers
    const { data: files, error: filesError } = await supabaseAdmin
      .from('analysis_files')
      .select('count')
      .limit(1)

    if (filesError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification des fichiers',
        details: filesError.message
      })
    }

    return NextResponse.json({
      success: true,
      database: {
        tables: tables?.map(t => t.table_name) || [],
        analysesCount: analyses?.length || 0,
        filesCount: files?.length || 0
      },
      configuration: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })

  } catch (error) {
    console.error('Erreur lors de la vérification de la base de données:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}
