import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante'
      })
    }

    // Vérifier les buckets disponibles
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des buckets',
        details: bucketsError
      })
    }

    // Vérifier si le bucket 'analyses' existe
    const analysesBucket = buckets.find(bucket => bucket.name === 'analyses')

    if (!analysesBucket) {
      return NextResponse.json({
        success: false,
        error: 'Le bucket "analyses" n\'existe pas',
        buckets: buckets.map(b => b.name),
        filesInAnalyses: []
      })
    }

    // Lister les fichiers dans le bucket analyses
    const { data: files, error: filesError } = await supabaseAdmin.storage
      .from('analyses')
      .list()

    return NextResponse.json({
      success: true,
      message: 'Configuration Storage OK',
      buckets: buckets.map(b => ({
        name: b.name,
        public: b.public,
        created_at: b.created_at
      })),
      analysesBucket: {
        name: analysesBucket.name,
        public: analysesBucket.public,
        created_at: analysesBucket.created_at
      },
      filesInAnalyses: files || [],
      filesError: filesError
    })

  } catch (error) {
    console.error('Erreur diagnostic storage:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
