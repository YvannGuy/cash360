import { NextRequest, NextResponse } from 'next/server'
import { createClientBrowser } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticket = searchParams.get('ticket')

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket manquant' },
        { status: 400 }
      )
    }

    const supabase = createClientBrowser()

    // Récupérer l'analyse avec le PDF
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        *,
        analysis_files (*)
      `)
      .eq('ticket', ticket)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que l'analyse est terminée
    if (analysis.status !== 'terminee') {
      return NextResponse.json(
        { error: 'L\'analyse n\'est pas encore terminée' },
        { status: 400 }
      )
    }

    // Trouver le fichier PDF
    const pdfFile = analysis.analysis_files?.find((file: any) => file.file_type === 'pdf')
    
    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF non disponible' },
        { status: 404 }
      )
    }

    // Ici, vous devriez récupérer le fichier depuis votre service de stockage
    // Pour l'instant, on simule le téléchargement
    
    // Créer un PDF factice pour la démonstration
    const pdfContent = `%PDF-1.4
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
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
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
(Analyse financiere ${ticket}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000368 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
465
%%EOF`

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="analyse-${ticket}.pdf"`,
        'Content-Length': pdfContent.length.toString(),
      },
    })

  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
