import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extraire les données du formulaire
    const data = {
      // 1. Informations sur la structure organisatrice
      structureName: formData.get('structureName') as string,
      legalForm: formData.get('legalForm') as string,
      registrationNumber: formData.get('registrationNumber') as string,
      structureAddress: formData.get('structureAddress') as string,
      structureWebsite: formData.get('structureWebsite') as string || null,
      
      // 2. Responsable de l'événement
      responsibleName: formData.get('responsibleName') as string,
      responsibleFunction: formData.get('responsibleFunction') as string,
      responsibleEmail: formData.get('responsibleEmail') as string,
      responsiblePhone: formData.get('responsiblePhone') as string,
      
      // 3. Informations générales sur l'événement
      city: formData.get('city') as string,
      country: formData.get('country') as string,
      proposedDate: formData.get('proposedDate') as string,
      eventType: formData.get('eventType') as string,
      
      // 4. Public visé
      targetAudience: formData.get('targetAudience') as string,
      estimatedParticipants: formData.get('estimatedParticipants') as string,
      
      // 5. Format souhaité
      standardFormat: formData.get('standardFormat') as string,
      customFormat: formData.get('customFormat') as string || null,
      pitchEntrepreneurial: formData.get('pitchEntrepreneurial') as string,
      pitchDetails: formData.get('pitchDetails') as string || null,
      
      // 6. Logistique & organisation
      venueIdentified: formData.get('venueIdentified') as string,
      venueCapacity: formData.get('venueCapacity') as string || null,
      transport: formData.get('transport') === 'true',
      accommodation: formData.get('accommodation') === 'true',
      logistics: formData.get('logistics') === 'true',
      
      // 7. Conditions financières
      proposedFee: formData.get('proposedFee') as string,
      percentageOnTickets: formData.get('percentageOnTickets') as string,
      percentageDetails: formData.get('percentageDetails') as string || null,
      
      // 8. Communication & visibilité
      communicationChannels: formData.get('communicationChannels') ? JSON.parse(formData.get('communicationChannels') as string) : [],
      sponsors: formData.get('sponsors') as string,
      
      // 9. Documents requis
      structureDocument: (formData.get('structureDocument') as File) || null,
      identityDocument: (formData.get('identityDocument') as File) || null,
      eventPresentation: (formData.get('eventPresentation') as File) || null,
      
      // 10. Engagement & validation
      frameworkAcknowledged: formData.get('frameworkAcknowledged') === 'true',
      contractAccepted: formData.get('contractAccepted') === 'true',
      writtenAgreementAccepted: formData.get('writtenAgreementAccepted') === 'true',
      
      createdAt: new Date().toISOString()
    }

    // Validation des champs obligatoires
    const missingFields: string[] = []
    
    if (!data.structureName || data.structureName.trim() === '') missingFields.push('Nom de la structure')
    if (!data.legalForm || data.legalForm.trim() === '') missingFields.push('Forme juridique')
    if (!data.registrationNumber || data.registrationNumber.trim() === '') missingFields.push('Numéro d\'immatriculation')
    if (!data.structureAddress || data.structureAddress.trim() === '') missingFields.push('Adresse de la structure')
    if (!data.responsibleName || data.responsibleName.trim() === '') missingFields.push('Nom du responsable')
    if (!data.responsibleFunction || data.responsibleFunction.trim() === '') missingFields.push('Fonction du responsable')
    if (!data.responsibleEmail || data.responsibleEmail.trim() === '') missingFields.push('Email du responsable')
    if (!data.responsiblePhone || data.responsiblePhone.trim() === '') missingFields.push('Téléphone du responsable')
    if (!data.city || data.city.trim() === '') missingFields.push('Ville')
    if (!data.country || data.country.trim() === '') missingFields.push('Pays')
    if (!data.proposedDate || data.proposedDate.trim() === '') missingFields.push('Date(s) souhaitée(s)')
    if (!data.eventType || data.eventType.trim() === '') missingFields.push('Type d\'événement')
    if (!data.targetAudience || data.targetAudience.trim() === '') missingFields.push('Public visé')
    if (!data.estimatedParticipants || data.estimatedParticipants.trim() === '') missingFields.push('Nombre de participants estimé')
    if (!data.standardFormat || data.standardFormat.trim() === '') missingFields.push('Format standard')
    if (!data.venueIdentified || data.venueIdentified.trim() === '') missingFields.push('Salle identifiée')
    if (!data.proposedFee || data.proposedFee.trim() === '') missingFields.push('Cachet proposé')
    
    // Vérification des fichiers
    const structureDoc = formData.get('structureDocument')
    const identityDoc = formData.get('identityDocument')
    
    if (!structureDoc || !(structureDoc instanceof File) || structureDoc.size === 0) {
      missingFields.push('Document de la structure')
    }
    if (!identityDoc || !(identityDoc instanceof File) || identityDoc.size === 0) {
      missingFields.push('Pièce d\'identité du responsable')
    }
    
    if (!data.frameworkAcknowledged) missingFields.push('Cadre officiel (case à cocher)')
    if (!data.contractAccepted) missingFields.push('Acceptation du contrat (case à cocher)')
    if (!data.writtenAgreementAccepted) missingFields.push('Acceptation de l\'accord écrit (case à cocher)')
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Champs obligatoires manquants',
          missingFields: missingFields
        },
        { status: 400 }
      )
    }

    // Stocker les fichiers dans Supabase Storage si disponibles
    let structureDocumentUrl = null
    let identityDocumentUrl = null
    let eventPresentationUrl = null

    if (supabaseAdmin && data.structureDocument) {
      try {
        const fileExt = data.structureDocument.name.split('.').pop()
        const fileName = `masterclass/${Date.now()}_structure_${data.structureName.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('masterclass-documents')
          .upload(fileName, data.structureDocument, {
            contentType: data.structureDocument.type,
            upsert: false
          })
        
        if (!uploadError && uploadData) {
          const { data: urlData } = supabaseAdmin.storage
            .from('masterclass-documents')
            .getPublicUrl(fileName)
          structureDocumentUrl = urlData.publicUrl
        }
      } catch (error) {
        console.error('Erreur upload document structure:', error)
      }
    }

    if (supabaseAdmin && data.identityDocument) {
      try {
        const fileExt = data.identityDocument.name.split('.').pop()
        const fileName = `masterclass/${Date.now()}_identity_${data.responsibleName.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('masterclass-documents')
          .upload(fileName, data.identityDocument, {
            contentType: data.identityDocument.type,
            upsert: false
          })
        
        if (!uploadError && uploadData) {
          const { data: urlData } = supabaseAdmin.storage
            .from('masterclass-documents')
            .getPublicUrl(fileName)
          identityDocumentUrl = urlData.publicUrl
        }
      } catch (error) {
        console.error('Erreur upload document identité:', error)
      }
    }

    if (supabaseAdmin && data.eventPresentation) {
      try {
        const fileExt = data.eventPresentation.name.split('.').pop()
        const fileName = `masterclass/${Date.now()}_presentation_${data.structureName.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('masterclass-documents')
          .upload(fileName, data.eventPresentation, {
            contentType: data.eventPresentation.type,
            upsert: false
          })
        
        if (!uploadError && uploadData) {
          const { data: urlData } = supabaseAdmin.storage
            .from('masterclass-documents')
            .getPublicUrl(fileName)
          eventPresentationUrl = urlData.publicUrl
        }
      } catch (error) {
        console.error('Erreur upload présentation:', error)
      }
    }

    // Stocker les données dans Supabase (si disponible)
    if (supabaseAdmin) {
      try {
        const { error: insertError } = await supabaseAdmin
          .from('masterclass_requests')
          .insert({
            structure_name: data.structureName,
            legal_form: data.legalForm,
            registration_number: data.registrationNumber,
            structure_address: data.structureAddress,
            structure_website: data.structureWebsite,
            responsible_name: data.responsibleName,
            responsible_function: data.responsibleFunction,
            responsible_email: data.responsibleEmail,
            responsible_phone: data.responsiblePhone,
            city: data.city,
            country: data.country,
            proposed_date: data.proposedDate,
            event_type: data.eventType,
            target_audience: data.targetAudience,
            estimated_participants: parseInt(data.estimatedParticipants) || null,
            standard_format: data.standardFormat,
            custom_format: data.customFormat,
            pitch_entrepreneurial: data.pitchEntrepreneurial,
            pitch_details: data.pitchDetails,
            venue_identified: data.venueIdentified,
            venue_capacity: parseInt(data.venueCapacity || '0') || null,
            transport: data.transport,
            accommodation: data.accommodation,
            logistics: data.logistics,
            proposed_fee: data.proposedFee,
            percentage_on_tickets: data.percentageOnTickets,
            percentage_details: data.percentageDetails,
            communication_channels: data.communicationChannels,
            sponsors: data.sponsors,
            structure_document_url: structureDocumentUrl,
            identity_document_url: identityDocumentUrl,
            event_presentation_url: eventPresentationUrl,
            framework_acknowledged: data.frameworkAcknowledged,
            contract_accepted: data.contractAccepted,
            written_agreement_accepted: data.writtenAgreementAccepted,
            created_at: data.createdAt
          })

        // Si la table n'existe pas, on continue quand même (on enverra juste l'email)
        if (insertError) {
          console.error('Erreur insertion Supabase (table peut-être inexistante):', insertError)
        }
      } catch (dbError) {
        console.error('Erreur base de données (on continue avec l\'envoi email):', dbError)
      }
    }

    // Générer le HTML de l'email pour Cash360
    const adminEmailHtml = generateAdminEmailHtml(data, {
      structureDocumentUrl,
      identityDocumentUrl,
      eventPresentationUrl
    })

    // Envoyer l'email à Cash360 avec les documents en pièces jointes si disponibles
    const adminAttachments = []
    if (structureDocumentUrl) {
      // Note: Les URLs Supabase sont publiques, on pourrait télécharger et joindre
      // Mais pour l'instant, on laisse juste les liens dans l'email
    }
    
    await sendMail({
      to: 'myriamkonan@cash360.finance',
      subject: `[Cash360 Masterclass] Nouvelle demande d'événement - ${data.structureName} - ${data.city}, ${data.country}`,
      html: adminEmailHtml,
      // Les documents sont accessibles via les liens dans l'email
    })

    // Générer le HTML de l'email de confirmation pour l'organisateur
    const confirmationEmailHtml = generateConfirmationEmailHtml(data)

    // Envoyer l'email de confirmation à l'organisateur avec la lettre d'invitation en pièce jointe
    await sendMail({
      to: data.responsibleEmail,
      subject: `Cash360 - Confirmation de réception de votre demande de masterclass`,
      html: confirmationEmailHtml,
      attachments: [
        {
          filename: 'Lettre_Invitation_Officielle_Cash360.pdf',
          path: 'public/pdf/Lettre_Invitation_Officielle_Cash360.pdf'
        }
      ]
    })

    return NextResponse.json({ 
      success: true,
      message: 'Demande envoyée avec succès'
    })

  } catch (error) {
    console.error('Erreur API masterclass request:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

function generateAdminEmailHtml(data: any, files: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #D4AF37; }
        .section h3 { margin-top: 0; color: #0B1B2B; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #555; margin-bottom: 5px; }
        .field-value { color: #333; }
        .files { margin-top: 10px; }
        .file-link { display: inline-block; padding: 8px 15px; background: #D4AF37; color: #0B1B2B; text-decoration: none; border-radius: 5px; margin-right: 10px; margin-top: 5px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #0B1B2B;">Nouvelle demande de Masterclass Cash360</h1>
        </div>
        <div class="content">
          <div class="section">
            <h3>1️⃣ Informations sur la structure organisatrice</h3>
            <div class="field">
              <div class="field-label">Nom de la structure:</div>
              <div class="field-value">${data.structureName}</div>
            </div>
            <div class="field">
              <div class="field-label">Forme juridique:</div>
              <div class="field-value">${data.legalForm}</div>
            </div>
            <div class="field">
              <div class="field-label">Numéro d'immatriculation:</div>
              <div class="field-value">${data.registrationNumber}</div>
            </div>
            <div class="field">
              <div class="field-label">Adresse:</div>
              <div class="field-value">${data.structureAddress}</div>
            </div>
            ${data.structureWebsite ? `
            <div class="field">
              <div class="field-label">Site web / Réseaux sociaux:</div>
              <div class="field-value">${data.structureWebsite}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>2️⃣ Responsable de l'événement</h3>
            <div class="field">
              <div class="field-label">Nom et prénom:</div>
              <div class="field-value">${data.responsibleName}</div>
            </div>
            <div class="field">
              <div class="field-label">Fonction:</div>
              <div class="field-value">${data.responsibleFunction}</div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value"><a href="mailto:${data.responsibleEmail}">${data.responsibleEmail}</a></div>
            </div>
            <div class="field">
              <div class="field-label">Téléphone:</div>
              <div class="field-value">${data.responsiblePhone}</div>
            </div>
          </div>

          <div class="section">
            <h3>3️⃣ Informations générales sur l'événement</h3>
            <div class="field">
              <div class="field-label">Ville:</div>
              <div class="field-value">${data.city}</div>
            </div>
            <div class="field">
              <div class="field-label">Pays:</div>
              <div class="field-value">${data.country}</div>
            </div>
            <div class="field">
              <div class="field-label">Date(s) souhaitée(s):</div>
              <div class="field-value">${data.proposedDate}</div>
            </div>
            <div class="field">
              <div class="field-label">Type d'événement:</div>
              <div class="field-value">${data.eventType}</div>
            </div>
          </div>

          <div class="section">
            <h3>4️⃣ Public visé</h3>
            <div class="field">
              <div class="field-label">Public principal:</div>
              <div class="field-value">${data.targetAudience}</div>
            </div>
            <div class="field">
              <div class="field-label">Nombre de participants estimé:</div>
              <div class="field-value">${data.estimatedParticipants}</div>
            </div>
          </div>

          <div class="section">
            <h3>5️⃣ Format souhaité</h3>
            <div class="field">
              <div class="field-label">Format standard Cash360:</div>
              <div class="field-value">${data.standardFormat}</div>
            </div>
            ${data.customFormat ? `
            <div class="field">
              <div class="field-label">Format personnalisé:</div>
              <div class="field-value">${data.customFormat}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="field-label">Pitch entrepreneurial avec dotation:</div>
              <div class="field-value">${data.pitchEntrepreneurial}</div>
            </div>
            ${data.pitchDetails ? `
            <div class="field">
              <div class="field-label">Détails du pitch:</div>
              <div class="field-value">${data.pitchDetails}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>6️⃣ Logistique & organisation</h3>
            <div class="field">
              <div class="field-label">Salle identifiée:</div>
              <div class="field-value">${data.venueIdentified}</div>
            </div>
            ${data.venueCapacity ? `
            <div class="field">
              <div class="field-label">Capacité de la salle:</div>
              <div class="field-value">${data.venueCapacity}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="field-label">Prise en charge:</div>
              <div class="field-value">
                ${data.transport ? '✓ Transport' : '✗ Transport'}<br>
                ${data.accommodation ? '✓ Hébergement' : '✗ Hébergement'}<br>
                ${data.logistics ? '✓ Logistique sur place' : '✗ Logistique sur place'}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>7️⃣ Conditions financières</h3>
            <div class="field">
              <div class="field-label">Cachet proposé:</div>
              <div class="field-value">${data.proposedFee}</div>
            </div>
            <div class="field">
              <div class="field-label">Pourcentage sur billetterie:</div>
              <div class="field-value">${data.percentageOnTickets}</div>
            </div>
            ${data.percentageDetails ? `
            <div class="field">
              <div class="field-label">Détails du pourcentage:</div>
              <div class="field-value">${data.percentageDetails}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>8️⃣ Communication & visibilité</h3>
            <div class="field">
              <div class="field-label">Canaux de communication:</div>
              <div class="field-value">${data.communicationChannels.join(', ') || 'Aucun'}</div>
            </div>
            <div class="field">
              <div class="field-label">Sponsors:</div>
              <div class="field-value">${data.sponsors}</div>
            </div>
          </div>

          <div class="section">
            <h3>9️⃣ Documents joints</h3>
            <div class="files">
              ${files.structureDocumentUrl ? `
                <div style="margin-bottom: 10px;">
                  <strong>Document structure:</strong><br>
                  <a href="${files.structureDocumentUrl}" class="file-link" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 5px;">
                    📄 Télécharger le document structure
                  </a>
                </div>
              ` : '<p style="color: #999;">Aucun document structure fourni</p>'}
              ${files.identityDocumentUrl ? `
                <div style="margin-bottom: 10px;">
                  <strong>Pièce d'identité:</strong><br>
                  <a href="${files.identityDocumentUrl}" class="file-link" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 5px;">
                    🆔 Télécharger la pièce d'identité
                  </a>
                </div>
              ` : '<p style="color: #999;">Aucune pièce d\'identité fournie</p>'}
              ${files.eventPresentationUrl ? `
                <div style="margin-bottom: 10px;">
                  <strong>Présentation événement:</strong><br>
                  <a href="${files.eventPresentationUrl}" class="file-link" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 5px;">
                    📊 Télécharger la présentation
                  </a>
                </div>
              ` : '<p style="color: #999;">Aucune présentation fournie</p>'}
            </div>
            <p style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 5px; font-size: 12px; color: #666;">
              💡 <strong>Note:</strong> Les documents sont stockés dans Supabase Storage. Cliquez sur les liens ci-dessus pour les télécharger. Si les liens ne fonctionnent pas, vérifiez les permissions du bucket "masterclass-documents" dans Supabase.
            </p>
          </div>

          <div class="section">
            <h3>🔒 Engagements</h3>
            <div class="field">
              <div class="field-value">
                ${data.frameworkAcknowledged ? '✓' : '✗'} Cadre officiel pris en compte<br>
                ${data.contractAccepted ? '✓' : '✗'} Contrat accepté<br>
                ${data.writtenAgreementAccepted ? '✓' : '✗'} Accord écrit accepté
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Demande reçue le ${new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p>Cash360 - 229 rue Saint-Honoré, 75001 Paris, France</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateConfirmationEmailHtml(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .message { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #D4AF37; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .cta { text-align: center; margin: 30px 0; }
        .cta a { display: inline-block; padding: 12px 30px; background: #D4AF37; color: #0B1B2B; text-decoration: none; border-radius: 5px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #0B1B2B;">Confirmation de réception</h1>
        </div>
        <div class="content">
          <div class="message">
            <p>Bonjour ${data.responsibleName},</p>
            <p>Nous avons bien reçu votre demande d'organisation d'une Masterclass Cash360.</p>
            <p><strong>Détails de votre demande:</strong></p>
            <ul>
              <li><strong>Structure:</strong> ${data.structureName}</li>
              <li><strong>Lieu:</strong> ${data.city}, ${data.country}</li>
              <li><strong>Date proposée:</strong> ${data.proposedDate}</li>
              <li><strong>Public visé:</strong> ${data.targetAudience}</li>
            </ul>
            <p>L'équipe Cash360 étudiera votre dossier et vous contactera si les conditions sont réunies pour envisager une collaboration.</p>
            <div style="background: #fff3cd; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0 0 10px 0;"><strong>📎 Pièce jointe importante:</strong></p>
              <p style="margin: 0 0 10px 0;">Vous trouverez en pièce jointe de cet email la <strong>Lettre d'Invitation Officielle Cash360</strong> à remplir et à nous retourner.</p>
              <p style="margin: 0;"><strong>Important:</strong> Merci d'adresser la lettre d'invitation officielle complétée par e-mail à :</p>
              <p style="text-align: center; margin: 15px 0 0 0;">
                <a href="mailto:myriamkonan@cash360.finance" style="color: #D4AF37; font-weight: bold; font-size: 16px;">
                  📧 myriamkonan@cash360.finance
                </a>
              </p>
            </div>
            <p>La lettre doit préciser la structure organisatrice, la ville et le pays, la date proposée, le public visé, et les conditions logistiques et financières.</p>
          </div>
          <div class="footer">
            <p><strong>Cash360</strong></p>
            <p>229 rue Saint-Honoré<br>75001 Paris, France</p>
            <p>📧 <a href="mailto:myriamkonan@cash360.finance" style="color: #D4AF37;">myriamkonan@cash360.finance</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
