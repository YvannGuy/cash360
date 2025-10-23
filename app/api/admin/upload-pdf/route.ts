import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Début upload PDF ===')
    
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      console.error('Configuration Supabase manquante')
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const analysisId = formData.get('analysisId') as string

    console.log('Données reçues:', {
      hasFile: !!pdfFile,
      fileName: pdfFile?.name,
      fileSize: pdfFile?.size,
      fileType: pdfFile?.type,
      analysisId
    })

    if (!pdfFile) {
      console.error('Aucun fichier PDF fourni')
      return NextResponse.json(
        { error: 'Aucun fichier PDF fourni' },
        { status: 400 }
      )
    }

    if (!analysisId) {
      console.error('ID d\'analyse manquant')
      return NextResponse.json(
        { error: 'ID d\'analyse manquant' },
        { status: 400 }
      )
    }

    // Vérifier que le fichier est un PDF
    if (pdfFile.type !== 'application/pdf') {
      console.error('Type de fichier invalide:', pdfFile.type)
      return NextResponse.json(
        { error: 'Le fichier doit être un PDF' },
        { status: 400 }
      )
    }

    // Vérifier la taille du fichier (max 10MB)
    if (pdfFile.size > 10 * 1024 * 1024) {
      console.error('Fichier trop volumineux:', pdfFile.size)
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux (max 10MB)' },
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const bytes = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('Fichier converti en buffer, taille:', buffer.length)

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const fileName = `analysis-${analysisId}-${timestamp}.pdf`
    const filePath = `analyses/${fileName}`
    console.log('Chemin du fichier:', filePath)

    // Vérifier d'abord si le bucket existe
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    console.log('Buckets disponibles:', buckets?.map(b => b.name))
    
    if (bucketsError) {
      console.error('Erreur lors de la récupération des buckets:', bucketsError)
      return NextResponse.json(
        { error: 'Erreur de configuration du stockage' },
        { status: 500 }
      )
    }

    const analysesBucket = buckets?.find(bucket => bucket.name === 'analyses')
    if (!analysesBucket) {
      console.error('Le bucket "analyses" n\'existe pas')
      return NextResponse.json(
        { error: 'Le bucket de stockage "analyses" n\'existe pas. Contactez l\'administrateur.' },
        { status: 500 }
      )
    }

    // Upload vers Supabase Storage
    console.log('Tentative d\'upload vers:', filePath)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('analyses')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Erreur upload storage:', uploadError)
      return NextResponse.json(
        { error: `Erreur lors de l'upload du fichier: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('Upload réussi:', uploadData)

    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabaseAdmin.storage
      .from('analyses')
      .getPublicUrl(filePath)

    // Mettre à jour l'analyse avec l'URL du PDF
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('analyses')
      .update({
        pdf_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .select()

    if (updateError) {
      console.error('Erreur mise à jour analyse:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'analyse' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'PDF uploadé avec succès',
      pdfUrl: urlData.publicUrl,
      analysis: updateData[0]
    })

  } catch (error) {
    console.error('Erreur upload PDF:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
