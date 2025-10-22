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

    const { path } = await request.json()
    
    if (!path) {
      return NextResponse.json(
        { error: 'Chemin du fichier manquant' },
        { status: 400 }
      )
    }

    console.log('📥 Génération URL signée pour:', path)
    
    // Générer l'URL signée avec permissions admin
    const { data, error } = await supabaseAdmin.storage
      .from('releves')
      .createSignedUrl(path, 60 * 60) // 1h
    
    if (error) {
      console.error('❌ Erreur génération URL:', error)
      return NextResponse.json(
        { error: `Erreur génération URL: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ URL signée générée:', data.signedUrl)
    
    return NextResponse.json({ signedUrl: data.signedUrl })
    
  } catch (error) {
    console.error('❌ Erreur API download:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
