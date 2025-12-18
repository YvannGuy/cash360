import { NextResponse } from 'next/server'

// Import dynamique de pdfkit pour éviter les problèmes avec Next.js
const getPDFKit = async () => {
  const pdfkit = await import('pdfkit')
  return pdfkit.default || pdfkit
}

/**
 * GET /api/sponsors/contrat-pdf
 * 
 * Génère et télécharge le PDF du contrat de sponsoring Cash360
 */
export async function GET() {
  try {
    // Importer pdfkit dynamiquement
    const PDFDocument = await getPDFKit()
    
    // Créer un nouveau document PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    })

    // Buffer pour collecter les chunks du PDF
    const buffers: Buffer[] = []

    // Promesse pour attendre la fin du stream
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      // Collecter les chunks du PDF
      doc.on('data', (chunk: Buffer) => {
        buffers.push(chunk)
      })
      
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      
      doc.on('error', (err: Error) => {
        reject(err)
      })
    })

    // En-tête
    doc.fontSize(20)
      .font('Helvetica-Bold')
      .text('CONTRAT DE SPONSORING', { align: 'center' })
      .moveDown(0.5)
    
    doc.fontSize(16)
      .font('Helvetica-Bold')
      .text('Partenariat Cash360', { align: 'center' })
      .moveDown(1)

    // Entre les soussignés
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .text('ENTRE LES SOUSSIGNÉS')
      .moveDown(0.5)

    doc.font('Helvetica-Bold')
      .text('Cash360 Finance')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .text('Entreprise individuelle')
      .moveDown(0.3)
      .text('Représentée par Madame Myriam KONAN,')
      .moveDown(0.3)
      .text('Siège social : 229 rue Saint-Honoré, 75001 Paris, France,')
      .moveDown(0.3)
      .text('Immatriculée sous le SIREN 993 331 404 – SIRET 993 331 404 00018,')
      .moveDown(0.3)
      .text('Ci-après dénommée « Cash360 »,')
      .moveDown(0.5)

    doc.font('Helvetica-Bold')
      .text('D\'une part,')
      .moveDown(1)

    doc.font('Helvetica-Bold')
      .text('ET')
      .moveDown(0.5)

    doc.font('Helvetica-Bold')
      .text('[Nom de la structure sponsor]')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .text('[Forme juridique]')
      .moveDown(0.3)
      .text('[Adresse du siège]')
      .moveDown(0.3)
      .text('Immatriculée sous le numéro [SIREN / RCCM / équivalent],')
      .moveDown(0.3)
      .text('Représentée par [Nom, prénom], en qualité de [Fonction],')
      .moveDown(0.3)
      .text('Ci-après dénommée « le Sponsor »,')
      .moveDown(0.5)

    doc.font('Helvetica-Bold')
      .text('D\'autre part,')
      .moveDown(1)

    // ARTICLE 1
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 1 — OBJET DU CONTRAT')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le présent contrat a pour objet de définir les conditions dans lesquelles le Sponsor soutient financièrement et/ou matériellement les actions de Cash360, notamment dans le cadre de masterclass, événements éducatifs ou programmes à impact.')
      .moveDown(1)

    // ARTICLE 2
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 2 — NATURE DU SPONSORING')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le sponsoring accordé par le Sponsor vise exclusivement :')
      .moveDown(0.3)
      .text('• le soutien à des actions éducatives et pédagogiques,')
      .moveDown(0.2)
      .text('• la promotion de l\'éducation financière,')
      .moveDown(0.2)
      .text('• le développement de projets à impact durable.')
      .moveDown(0.3)
      .text('Aucune promesse de rendement financier ou de retour sur investissement n\'est associée au présent partenariat.')
      .moveDown(1)

    // ARTICLE 3
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 3 — ENGAGEMENTS DE CASH360')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Cash360 s\'engage à :')
      .moveDown(0.3)
      .text('• organiser les actions prévues avec professionnalisme,')
      .moveDown(0.2)
      .text('• assurer une visibilité du Sponsor selon le niveau de partenariat convenu,')
      .moveDown(0.2)
      .text('• respecter l\'image, la réputation et les valeurs du Sponsor,')
      .moveDown(0.2)
      .text('• fournir un bilan de visibilité ou d\'impact à l\'issue de l\'événement (si prévu).')
      .moveDown(1)

    // ARTICLE 4
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 4 — ENGAGEMENTS DU SPONSOR')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le Sponsor s\'engage à :')
      .moveDown(0.3)
      .text('• verser la contribution financière définie à l\'article 5,')
      .moveDown(0.2)
      .text('• respecter le cadre éthique et éducatif de Cash360,')
      .moveDown(0.2)
      .text('• ne pas utiliser l\'image de Cash360 sans autorisation écrite préalable.')
      .moveDown(1)

    // ARTICLE 5
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 5 — CONDITIONS FINANCIÈRES')
      .moveDown(0.3)
    
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('5.1 Contribution sponsor')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le Sponsor s\'engage à verser à Cash360 une contribution d\'un montant de :')
      .moveDown(0.3)
      .text('[Montant] € / $ / devise locale')
      .moveDown(0.5)

    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('5.2 Modalités de paiement')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le paiement sera effectué sur le compte de Cash360 Finance, selon les modalités suivantes :')
      .moveDown(0.3)
      .text('☐ Paiement unique')
      .moveDown(0.2)
      .text('☐ Paiement échelonné (à préciser)')
      .moveDown(1)

    // ARTICLE 6
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 6 — VISIBILITÉ & COMMUNICATION')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Les contreparties accordées au Sponsor peuvent inclure :')
      .moveDown(0.3)
      .text('• présence du logo sur supports de communication,')
      .moveDown(0.2)
      .text('• mention lors des événements,')
      .moveDown(0.2)
      .text('• visibilité digitale,')
      .moveDown(0.2)
      .text('• présence lors des temps de networking.')
      .moveDown(0.3)
      .text('Les modalités exactes sont précisées en annexe ou par écrit entre les parties.')
      .moveDown(1)

    // ARTICLE 7
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 7 — DROITS À L\'IMAGE')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Cash360 est autorisée à utiliser le nom et le logo du Sponsor à des fins de communication liées au partenariat.')
      .moveDown(0.3)
      .text('Toute autre utilisation devra faire l\'objet d\'un accord écrit préalable.')
      .moveDown(1)

    // ARTICLE 8
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 8 — RESPONSABILITÉ')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le Sponsor reconnaît que les activités de Cash360 ont une vocation strictement éducative.')
      .moveDown(0.3)
      .text('Cash360 ne saurait être tenue responsable des décisions financières prises par les participants.')
      .moveDown(1)

    // ARTICLE 9
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 9 — DURÉE DU CONTRAT')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le présent contrat est conclu pour une durée de :')
      .moveDown(0.3)
      .text('[Durée], à compter de la date de signature.')
      .moveDown(1)

    // ARTICLE 10
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 10 — RÉSILIATION')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Chaque partie peut mettre fin au présent contrat en cas de manquement grave de l\'autre partie, après mise en demeure restée sans effet.')
      .moveDown(1)

    // ARTICLE 11
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 11 — CONFIDENTIALITÉ')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Les informations échangées dans le cadre du présent contrat sont strictement confidentielles.')
      .moveDown(1)

    // ARTICLE 12
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 12 — DROIT APPLICABLE ET JURIDICTION')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le présent contrat est soumis au droit français.')
      .moveDown(0.3)
      .text('Tout litige relèvera de la compétence exclusive des tribunaux de Paris.')
      .moveDown(1)

    // ARTICLE 13
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('ARTICLE 13 — DISPOSITIONS FINALES')
      .moveDown(0.3)
    
    doc.font('Helvetica')
      .fontSize(11)
      .text('Le présent contrat constitue l\'intégralité de l\'accord entre les parties.')
      .moveDown(0.3)
      .text('Toute modification devra faire l\'objet d\'un avenant écrit et signé.')
      .moveDown(2)

    // Signatures
    doc.font('Helvetica')
      .fontSize(11)
      .text('Fait à : ____________________')
      .moveDown(0.5)
      .text('Le : _______________________')
      .moveDown(1.5)

    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('Pour Cash360')
      .moveDown(0.5)

    doc.font('Helvetica')
      .fontSize(11)
      .text('Nom : Myriam KONAN')
      .moveDown(1)
      .text('Signature :')
      .moveDown(2)

    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('Pour le Sponsor')
      .moveDown(0.5)

    doc.font('Helvetica')
      .fontSize(11)
      .text('Nom : ____________________')
      .moveDown(0.3)
      .text('Fonction : ________________')
      .moveDown(1)
      .text('Signature :')

    // Finaliser le document
    doc.end()

    // Attendre que le PDF soit complètement généré
    const pdfBuffer = await pdfPromise

    // Vérifier que le buffer n'est pas vide
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Le PDF généré est vide')
    }

    // Vérifier que le PDF commence par le header PDF standard
    const pdfHeader = pdfBuffer.slice(0, 4).toString()
    if (pdfHeader !== '%PDF') {
      console.error('[SPONSORS CONTRAT PDF] PDF invalide, header:', pdfHeader)
      throw new Error('Le PDF généré n\'est pas valide')
    }

    // Créer les headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', 'attachment; filename="contrat-sponsoring-cash360.pdf"')
    headers.set('Content-Length', pdfBuffer.length.toString())
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    // Retourner le PDF en téléchargement avec Response native
    return new Response(new Uint8Array(pdfBuffer), { headers })
  } catch (error: any) {
    console.error('[SPONSORS CONTRAT PDF] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du contrat PDF: ' + (error.message || 'Erreur inconnue') },
      { status: 500 }
    )
  }
}
