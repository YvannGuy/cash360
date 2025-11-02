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

    // Récupérer tous les fichiers d'analyse
    const { data: files, error } = await supabaseAdmin!
      .from('analysis_files')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des fichiers:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Enrichir les fichiers avec les infos utilisateur depuis les analyses
    const enrichedFiles = await Promise.all(
      (files || []).map(async (file: any) => {
        try {
          // Récupérer l'analyse associée
          const { data: analysis } = await supabaseAdmin!
            .from('analyses')
            .select('client_name, client_email')
            .eq('id', file.analysis_id)
            .single()

          return {
            ...file,
            user_name: analysis?.client_name || 'Unknown',
            user_email: analysis?.client_email || 'Unknown',
            status: 'analysé' // TODO: déterminer le vrai statut
          }
        } catch (err) {
          return {
            ...file,
            user_name: 'Unknown',
            user_email: 'Unknown',
            status: 'non_traite'
          }
        }
      })
    )

    // Calculer les statistiques
    const stats = {
      totalFiles: enrichedFiles.length,
      pendingAnalysis: enrichedFiles.filter((f: any) => f.status === 'en_attente').length,
      analyzed: enrichedFiles.filter((f: any) => f.status === 'analysé').length,
      deleted: 0 // TODO: calculer depuis les fichiers supprimés
    }

    return NextResponse.json({
      success: true,
      files: enrichedFiles,
      stats
    })

  } catch (error) {
    console.error('Erreur API admin fichiers:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { fileId } = await request.json()
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'ID fichier manquant' },
        { status: 400 }
      )
    }

    // Récupérer les infos du fichier pour supprimer aussi dans le storage
    const { data: fileData, error: fileError } = await supabaseAdmin!
      .from('analysis_files')
      .select('file_url, file_name, analysis_id')
      .eq('id', fileId)
      .single()

    if (fileError || !fileData) {
      console.error('Erreur lors de la récupération du fichier:', fileError)
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le fichier du storage Supabase
    const { error: storageError } = await supabaseAdmin!
      .storage
      .from('releves')
      .remove([fileData.file_url])

    if (storageError) {
      console.error('Erreur lors de la suppression du fichier du storage:', storageError)
      // Continue quand même la suppression de la DB
    }

    // Supprimer l'enregistrement de la base de données
    const { error: deleteError } = await supabaseAdmin!
      .from('analysis_files')
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      console.error('Erreur lors de la suppression du fichier:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur API admin fichiers DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

