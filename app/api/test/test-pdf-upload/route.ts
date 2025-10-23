import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Test PDF Upload ===')
    
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Supabase manquante'
      })
    }

    // Vérifier les buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification des buckets',
        details: bucketsError
      })
    }

    console.log('Buckets disponibles:', buckets?.map(b => b.name))

    const analysesBucket = buckets?.find(bucket => bucket.name === 'analyses')
    
    if (!analysesBucket) {
      return NextResponse.json({
        success: false,
        error: 'Le bucket "analyses" n\'existe pas',
        availableBuckets: buckets?.map(b => b.name),
        suggestion: 'Utilisez le bouton "📁 Storage" dans l\'admin pour créer le bucket'
      })
    }

    // Créer un fichier PDF de test (contenu minimal)
    const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`

    const buffer = Buffer.from(testPdfContent, 'utf8')
    const timestamp = Date.now()
    const fileName = `test-${timestamp}.pdf`
    const filePath = `analyses/${fileName}`

    console.log('Tentative d\'upload du fichier de test:', filePath)

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('analyses')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Erreur upload test:', uploadError)
      return NextResponse.json({
        success: false,
        error: `Erreur lors de l'upload du fichier de test: ${uploadError.message}`,
        details: uploadError
      })
    }

    console.log('Upload test réussi:', uploadData)

    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabaseAdmin.storage
      .from('analyses')
      .getPublicUrl(filePath)

    console.log('URL publique:', urlData.publicUrl)

    // Nettoyer le fichier de test
    const { error: deleteError } = await supabaseAdmin.storage
      .from('analyses')
      .remove([filePath])

    if (deleteError) {
      console.warn('Impossible de supprimer le fichier de test:', deleteError)
    }

    return NextResponse.json({
      success: true,
      message: 'Test PDF upload réussi',
      testFile: {
        path: filePath,
        url: urlData.publicUrl,
        uploaded: uploadData,
        cleaned: !deleteError
      }
    })

  } catch (error) {
    console.error('Erreur test PDF upload:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
