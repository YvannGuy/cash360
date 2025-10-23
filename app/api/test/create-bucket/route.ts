import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante'
      })
    }

    // Vérifier si le bucket existe déjà
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification des buckets',
        details: bucketsError
      })
    }

    const analysesBucket = buckets.find(bucket => bucket.name === 'analyses')

    if (analysesBucket) {
      return NextResponse.json({
        success: true,
        message: 'Le bucket "analyses" existe déjà',
        bucket: analysesBucket
      })
    }

    // Créer le bucket "analyses"
    const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('analyses', {
      public: true,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    })

    if (createError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création du bucket',
        details: createError
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Bucket "analyses" créé avec succès',
      bucket: newBucket
    })

  } catch (error) {
    console.error('Erreur création bucket:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
