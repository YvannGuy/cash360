import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Début upload PDF ebook ===')
    
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
    const productId = formData.get('productId') as string

    console.log('Données reçues:', {
      hasFile: !!pdfFile,
      fileName: pdfFile?.name,
      fileSize: pdfFile?.size,
      fileType: pdfFile?.type,
      productId
    })

    if (!pdfFile) {
      console.error('Aucun fichier PDF fourni')
      return NextResponse.json(
        { error: 'Aucun fichier PDF fourni' },
        { status: 400 }
      )
    }

    if (!productId) {
      console.error('ID produit manquant')
      return NextResponse.json(
        { error: 'ID produit manquant' },
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

    // Vérifier la taille du fichier (max 50MB)
    if (pdfFile.size > 50 * 1024 * 1024) {
      console.error('Fichier trop volumineux:', pdfFile.size)
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux (max 50MB)' },
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const bytes = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('Fichier converti en buffer, taille:', buffer.length)

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const fileName = `ebook-${productId}-${timestamp}.pdf`
    const filePath = `ebooks/${fileName}`
    console.log('Chemin du fichier:', filePath)

    // Vérifier d'abord si le bucket "ebooks" existe
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    console.log('Buckets disponibles:', buckets?.map(b => b.name))
    
    if (bucketsError) {
      console.error('Erreur lors de la récupération des buckets:', bucketsError)
      return NextResponse.json(
        { error: 'Erreur de configuration du stockage' },
        { status: 500 }
      )
    }

    // Vérifier si le bucket "ebooks" existe
    let ebooksBucket = buckets?.find(bucket => bucket.name === 'ebooks')
    
    if (!ebooksBucket) {
      // Créer le bucket "ebooks" s'il n'existe pas
      console.log('Création du bucket "ebooks"...')
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('ebooks', {
        public: true, // Rendre le bucket public pour permettre l'accès aux PDFs
        fileSizeLimit: 52428800, // 50MB max
        allowedMimeTypes: ['application/pdf'] // Seulement les PDFs
      })

      if (createError) {
        console.error('Erreur lors de la création du bucket:', createError)
        // Si la création échoue, essayer d'utiliser le bucket "analyses" comme fallback
        ebooksBucket = buckets?.find(bucket => bucket.name === 'analyses')
        if (!ebooksBucket) {
          return NextResponse.json(
            { error: 'Impossible de créer ou trouver un bucket de stockage. Contactez l\'administrateur.' },
            { status: 500 }
          )
        }
        // Utiliser analyses bucket avec un dossier ebooks
        const filePathInAnalyses = `ebooks/${fileName}`
        
        console.log('Tentative d\'upload vers:', filePathInAnalyses)
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('analyses')
          .upload(filePathInAnalyses, buffer, {
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
          .getPublicUrl(filePathInAnalyses)

        return NextResponse.json({
          success: true,
          message: 'PDF uploadé avec succès',
          pdfUrl: urlData.publicUrl
        })
      } else {
        console.log('Bucket "ebooks" créé avec succès:', newBucket)
      }
    }

    // Upload vers le bucket ebooks (maintenant il existe)
    console.log('Tentative d\'upload vers:', filePath)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('ebooks')
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
      .from('ebooks')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      message: 'PDF uploadé avec succès',
      pdfUrl: urlData.publicUrl
    })

  } catch (error) {
    console.error('Erreur upload PDF ebook:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
