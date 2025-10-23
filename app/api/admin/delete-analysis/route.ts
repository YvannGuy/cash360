import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== Début suppression analyse ===')
    
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      console.error('Configuration Supabase manquante')
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { analysisId } = await request.json()

    if (!analysisId) {
      console.error('ID d\'analyse manquant')
      return NextResponse.json(
        { error: 'ID d\'analyse manquant' },
        { status: 400 }
      )
    }

    console.log('Suppression de l\'analyse:', analysisId)

    // Récupérer l'analyse pour obtenir l'URL du PDF si elle existe
    const { data: analysis, error: fetchError } = await supabaseAdmin
      .from('analyses')
      .select('pdf_url')
      .eq('id', analysisId)
      .single()

    if (fetchError) {
      console.error('Erreur lors de la récupération de l\'analyse:', fetchError)
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer le PDF du storage si il existe
    if (analysis.pdf_url) {
      try {
        // Extraire le nom du fichier depuis l'URL
        const url = new URL(analysis.pdf_url)
        const pathParts = url.pathname.split('/')
        const fileName = pathParts[pathParts.length - 1]
        
        if (fileName) {
          console.log('Suppression du PDF:', fileName)
          const { error: deleteFileError } = await supabaseAdmin.storage
            .from('analyses')
            .remove([`analyses/${fileName}`])

          if (deleteFileError) {
            console.warn('Erreur lors de la suppression du fichier PDF:', deleteFileError)
            // On continue même si la suppression du fichier échoue
          }
        }
      } catch (error) {
        console.warn('Erreur lors de l\'extraction du nom de fichier:', error)
      }
    }

    // Supprimer l'analyse de la base de données
    const { error: deleteError } = await supabaseAdmin
      .from('analyses')
      .delete()
      .eq('id', analysisId)

    if (deleteError) {
      console.error('Erreur lors de la suppression de l\'analyse:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'analyse' },
        { status: 500 }
      )
    }

    console.log('Analyse supprimée avec succès:', analysisId)

    return NextResponse.json({
      success: true,
      message: 'Analyse supprimée avec succès',
      deletedAnalysisId: analysisId
    })

  } catch (error) {
    console.error('Erreur suppression analyse:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
