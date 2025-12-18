import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mail'

/**
 * POST /api/sponsors/request
 * 
 * Reçoit les demandes de partenariat/sponsoring
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validation des champs obligatoires
    const missingFields: string[] = []
    
    if (!data.organizationName || data.organizationName.trim() === '') missingFields.push('Nom de l\'organisation')
    if (!data.legalForm || data.legalForm.trim() === '') missingFields.push('Forme juridique')
    if (!data.registrationNumber || data.registrationNumber.trim() === '') missingFields.push('Numéro d\'immatriculation')
    if (!data.organizationAddress || data.organizationAddress.trim() === '') missingFields.push('Adresse de l\'organisation')
    if (!data.contactName || data.contactName.trim() === '') missingFields.push('Nom du contact')
    if (!data.contactFunction || data.contactFunction.trim() === '') missingFields.push('Fonction du contact')
    if (!data.contactEmail || data.contactEmail.trim() === '') missingFields.push('Email du contact')
    if (!data.contactPhone || data.contactPhone.trim() === '') missingFields.push('Téléphone du contact')
    if (!data.partnershipType || data.partnershipType.trim() === '') missingFields.push('Type de partenariat')
    if (!data.budgetRange || data.budgetRange.trim() === '') missingFields.push('Budget envisagé')
    if (!data.termsAccepted) missingFields.push('Acceptation des conditions')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Champs manquants',
          missingFields 
        },
        { status: 400 }
      )
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.contactEmail)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      )
    }

    // Envoyer l'email de notification
    try {
      await sendMail({
        to: 'myriamkonan@cash360.finance',
        subject: `Nouvelle demande de partenariat/sponsoring - ${data.organizationName}`,
        html: `
          <h2>Nouvelle demande de partenariat/sponsoring</h2>
          
          <h3>Informations sur l'organisation</h3>
          <ul>
            <li><strong>Nom :</strong> ${data.organizationName}</li>
            <li><strong>Forme juridique :</strong> ${data.legalForm}</li>
            <li><strong>Numéro d'immatriculation :</strong> ${data.registrationNumber}</li>
            <li><strong>Adresse :</strong> ${data.organizationAddress}</li>
            ${data.organizationWebsite ? `<li><strong>Site web :</strong> ${data.organizationWebsite}</li>` : ''}
          </ul>

          <h3>Contact principal</h3>
          <ul>
            <li><strong>Nom :</strong> ${data.contactName}</li>
            <li><strong>Fonction :</strong> ${data.contactFunction}</li>
            <li><strong>Email :</strong> ${data.contactEmail}</li>
            <li><strong>Téléphone :</strong> ${data.contactPhone}</li>
          </ul>

          <h3>Détails du partenariat</h3>
          <ul>
            <li><strong>Type :</strong> ${data.partnershipType}</li>
            <li><strong>Budget envisagé :</strong> ${data.budgetRange}</li>
            ${data.targetAudience ? `<li><strong>Public cible :</strong> ${data.targetAudience}</li>` : ''}
          </ul>

          <p><em>Demande reçue le ${new Date().toLocaleString('fr-FR')}</em></p>
        `
      })
    } catch (emailError) {
      console.error('[SPONSORS REQUEST] Erreur envoi email:', emailError)
      // Ne pas bloquer la soumission si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Demande de partenariat envoyée avec succès'
    })
  } catch (error: any) {
    console.error('[SPONSORS REQUEST] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la demande' },
      { status: 500 }
    )
  }
}
