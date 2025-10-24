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

    const { filePath, bucket } = await request.json()
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Chemin du fichier manquant' },
        { status: 400 }
      )
    }

    console.log('📥 Génération URL signée pour:', filePath)
    
    // Générer l'URL signée avec permissions admin
    const { data, error } = await supabaseAdmin.storage
      .from(bucket || 'releves')
      .createSignedUrl(filePath, 60 * 60) // 1h
    
    if (error) {
      console.error('❌ Erreur génération URL:', error)
      return NextResponse.json(
        { error: `Erreur génération URL: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ URL signée générée:', data.signedUrl)
    
    return NextResponse.json({ downloadUrl: data.signedUrl })
    
  } catch (error) {
    console.error('❌ Erreur API download:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
