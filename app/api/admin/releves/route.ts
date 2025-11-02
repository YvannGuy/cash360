import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ticket = searchParams.get('ticket')
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket manquant' },
        { status: 400 }
      )
    }

    console.log('🔍 Recherche des relevés pour le ticket:', ticket)
    
    // Récupérer l'analyse correspondant au ticket
    const { data: analysis } = await supabaseAdmin!
      .from('analyses')
      .select('id')
      .eq('ticket', ticket)
      .single()
    
    if (!analysis) {
      return NextResponse.json({ success: true, files: [] })
    }
    
    // Récupérer les fichiers depuis analysis_files
    const { data: files, error } = await supabaseAdmin!
      .from('analysis_files')
      .select('*')
      .eq('analysis_id', analysis.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erreur lors de la récupération des fichiers:', error)
      return NextResponse.json({ success: true, files: [] })
    }
    
    // Transformer les fichiers pour correspondre au format attendu
    const releveFiles = (files || []).map(file => ({
      name: file.file_name,
      path: file.file_url,
      size: file.file_size,
      created_at: file.created_at
    }))
    
    console.log('📄 Fichiers de relevés pour', ticket, ':', releveFiles)
    
    return NextResponse.json({ success: true, files: releveFiles })
    
  } catch (error) {
    console.error('Erreur API releves:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}