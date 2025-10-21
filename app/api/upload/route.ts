import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { clientInfoSchema, uploadSchema } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    
    // Extraire les données du formulaire
    const clientInfo = {
      prenom: formData.get('prenom') as string,
      nom: formData.get('nom') as string,
      email: formData.get('email') as string,
      telephone: formData.get('telephone') as string || undefined,
      message: formData.get('message') as string || undefined,
      paymentMethod: formData.get('paymentMethod') as 'virement' | 'paypal',
      consentement: formData.get('consentement') === 'true'
    }

    // Validation des données client
    const validatedClientInfo = clientInfoSchema.parse(clientInfo)

    // Extraire les fichiers
    const relevesFiles = formData.getAll('releves') as File[]
    const virementJustificatif = formData.get('virementJustificatif') as File | null

    // Validation des fichiers
    uploadSchema.parse({
      files: relevesFiles,
      virementJustificatif: virementJustificatif || undefined
    })

    // Validation spécifique pour le mode virement
    if (validatedClientInfo.paymentMethod === 'virement' && !virementJustificatif) {
      return NextResponse.json(
        { error: 'Le justificatif de virement est requis pour le paiement par virement' },
        { status: 400 }
      )
    }

    // Générer un ticket unique
    const ticket = uuidv4()
    const timestamp = new Date().toISOString()

    // Créer le dossier dans Supabase Storage
    const folderPath = `releves/${ticket}`

    // Upload des 3 relevés
    const uploadedFiles: string[] = []
    for (let i = 0; i < relevesFiles.length; i++) {
      const file = relevesFiles[i]
      const fileName = `releve_${i + 1}_${file.name}`
      const filePath = `${folderPath}/${fileName}`
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('releves')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Erreur upload relevé:', uploadError)
        throw new Error(`Erreur lors de l'upload du relevé ${i + 1}: ${uploadError.message}`)
      }

      uploadedFiles.push(filePath)
    }

    // Upload du justificatif de virement si présent
    let virementPath: string | null = null
    if (virementJustificatif) {
      const fileName = `justificatif_virement_${virementJustificatif.name}`
      const filePath = `${folderPath}/${fileName}`
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('releves')
        .upload(filePath, virementJustificatif, {
          contentType: virementJustificatif.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Erreur upload justificatif:', uploadError)
        throw new Error(`Erreur lors de l'upload du justificatif de virement: ${uploadError.message}`)
      }

      virementPath = filePath
    }

    // Générer les URLs signées pour l'admin (expiration 15 minutes)
    const signedUrls: { [key: string]: string } = {}
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
        .from('releves')
        .createSignedUrl(uploadedFiles[i], 15 * 60) // 15 minutes

      if (urlError) {
        console.error('Erreur génération URL signée:', urlError)
        throw new Error(`Erreur lors de la génération de l'URL pour le relevé ${i + 1}`)
      }

      signedUrls[`releve_${i + 1}`] = signedUrl.signedUrl
    }

    if (virementPath) {
      const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
        .from('releves')
        .createSignedUrl(virementPath, 15 * 60) // 15 minutes

      if (urlError) {
        console.error('Erreur génération URL signée justificatif:', urlError)
        throw new Error('Erreur lors de la génération de l\'URL pour le justificatif')
      }

      signedUrls.justificatif_virement = signedUrl.signedUrl
    }

    // Envoyer l'email admin
    const adminEmailHtml = generateAdminEmailHtml(validatedClientInfo, ticket, timestamp, signedUrls)
    await sendMail({
      to: process.env.MAIL_ADMIN || process.env.DESTINATION_EMAIL || 'cash@cash360.finance',
      subject: `[Cash360] Nouveau dossier d'analyse – ${validatedClientInfo.prenom} ${validatedClientInfo.nom} – ${ticket}`,
      html: adminEmailHtml
    })

    // Envoyer l'email client
    const clientEmailHtml = generateClientEmailHtml(validatedClientInfo, ticket)
    await sendMail({
      to: validatedClientInfo.email,
      subject: `Cash360 – Confirmation de réception de vos documents – ${ticket}`,
      html: clientEmailHtml
    })

    return NextResponse.json({ ticket })

  } catch (error) {
    console.error('Erreur API upload:', error)
    
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

function generateAdminEmailHtml(
  clientInfo: any,
  ticket: string,
  timestamp: string,
  signedUrls: { [key: string]: string }
): string {
  const paymentMethodText = clientInfo.paymentMethod === 'virement' ? 'Virement bancaire' : 'PayPal'
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e293b, #1e40af); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">🎯 Nouveau dossier d'analyse Cash360</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket: ${ticket}</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">Informations client</h2>
        
        <div style="margin-bottom: 15px;">
          <strong>Nom complet:</strong> ${clientInfo.prenom} ${clientInfo.nom}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Email:</strong> ${clientInfo.email}
        </div>
        
        ${clientInfo.telephone ? `
        <div style="margin-bottom: 15px;">
          <strong>Téléphone:</strong> ${clientInfo.telephone}
        </div>
        ` : ''}
        
        <div style="margin-bottom: 15px;">
          <strong>Mode de paiement:</strong> ${paymentMethodText}
        </div>
        
        ${clientInfo.message ? `
        <div style="margin-bottom: 20px;">
          <strong>Message:</strong><br>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px;">
            ${clientInfo.message}
          </div>
        </div>
        ` : ''}
        
        <h3 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">📄 Documents (liens valides 15 minutes)</h3>
        
        <div style="space-y: 10px;">
          ${Object.entries(signedUrls).map(([key, url]) => `
            <div style="margin-bottom: 10px;">
              <strong>${key.replace('_', ' ').toUpperCase()}:</strong><br>
              <a href="${url}" style="color: #3b82f6; word-break: break-all;">${url}</a>
            </div>
          `).join('')}
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px;">
          <p style="margin: 0; color: #92400e;">
            ⚠️ <strong>Important:</strong> Les liens ci-dessus expirent dans 15 minutes. Téléchargez les fichiers rapidement.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p>Email généré automatiquement le ${new Date(timestamp).toLocaleString('fr-FR')}</p>
      </div>
    </div>
  `
}

function generateClientEmailHtml(clientInfo: any, ticket: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e293b, #1e40af); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">✅ Confirmation de réception</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket: ${ticket}</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${clientInfo.prenom},</h2>
        
        <p style="color: #374151; line-height: 1.6;">
          Merci pour votre confiance ! Nous avons bien reçu vos documents pour l'analyse approfondie de vos finances.
        </p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">📋 Prochaines étapes</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Analyse approfondie de vos 3 relevés bancaires</li>
            <li style="margin-bottom: 8px;">Détection d'éventuelles anomalies financières</li>
            <li style="margin-bottom: 8px;">Élaboration de recommandations personnalisées</li>
            <li>Retour sous <strong>48 à 72 heures ouvrées</strong></li>
          </ul>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            💡 <strong>Important:</strong> Vos documents sont traités de manière confidentielle et sécurisée.
          </p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Mode de paiement:</strong> ${clientInfo.paymentMethod === 'virement' ? 'Virement bancaire' : 'PayPal'}<br>
            <strong>Montant:</strong> 59,99 €
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #374151;">
            Pour toute question, contactez-nous :<br>
            <a href="mailto:contact@cash360.finance" style="color: #3b82f6;">contact@cash360.finance</a>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p>Cash360 - Analyse financière personnalisée</p>
      </div>
    </div>
  `
}
