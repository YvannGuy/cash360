import { NextRequest, NextResponse } from 'next/server'
import { clientInfoSchema, uploadSchema } from '@/lib/validation'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

// Générer un ticket court (5 chiffres + 1 lettre)
function generateShortTicket(): string {
  const numbers = Math.floor(10000 + Math.random() * 90000) // 10000-99999
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letter = letters[Math.floor(Math.random() * letters.length)]
  return `${numbers}${letter}`
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Récupérer l'utilisateur connecté depuis le token
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    let userEmail: string | null = null
    let userFirstName: string | null = null
    let userLastName: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (!error && user) {
          userId = user.id
          userEmail = user.email || null
          // Récupérer nom et prénom depuis user_metadata
          userFirstName = user.user_metadata?.first_name || null
          userLastName = user.user_metadata?.last_name || null
        }
      } catch (tokenError) {
        console.log('Token invalide ou expiré, on continue sans user_id:', tokenError)
      }
    }

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    if (!userFirstName || !userLastName) {
      return NextResponse.json(
        { error: 'Nom et prénom manquants. Veuillez compléter votre profil dans les paramètres.' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    
    // Extraire les données du formulaire
    const clientInfo = {
      message: formData.get('message') as string || undefined,
      modePaiement: formData.get('modePaiement') as string,
      consentement: formData.get('consentement') === 'true'
    }

    // Validation des données client
    const validatedClientInfo = clientInfoSchema.parse(clientInfo)
    
    // Ajouter les informations utilisateur depuis user_metadata
    const fullClientInfo = {
      ...validatedClientInfo,
      prenom: userFirstName,
      nom: userLastName,
      email: userEmail
    }

    // Extraire les fichiers
    const relevesFiles = formData.getAll('releves') as File[]

    // Validation des fichiers
    uploadSchema.parse({
      files: relevesFiles,
      virementJustificatif: undefined
    })

    // Générer un ticket unique
    const ticket = generateShortTicket()
    const timestamp = new Date().toISOString()

    // Créer l'analyse dans la base de données avec l'utilisateur connecté
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .insert({
        ticket: `CASH-${ticket}`,
        client_name: `${fullClientInfo.prenom} ${fullClientInfo.nom}`,
        client_email: fullClientInfo.email,
        status: 'en_cours',
        progress: 10,
        mode_paiement: fullClientInfo.modePaiement,
        message: fullClientInfo.message || null,
        user_id: userId // Utiliser l'ID utilisateur depuis l'authentification
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Erreur lors de la création de l\'analyse:', analysisError)
      // On continue quand même, mais on log l'erreur
    }

    if (!analysis) {
      console.error('Erreur lors de la création de l\'analyse dans la base de données')
      // On continue quand même, mais on log l'erreur
    }

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

    // Ajouter les fichiers à l'analyse dans la base de données
    if (analysis) {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = relevesFiles[i]
        const { error: fileError } = await supabaseAdmin
          .from('analysis_files')
          .insert({
            analysis_id: analysis.id,
            file_name: file.name,
            file_url: uploadedFiles[i], // Le chemin dans Supabase Storage
            file_size: file.size,
            file_type: 'document'
          })

        if (fileError) {
          console.error('Erreur lors de l\'ajout du fichier:', fileError)
        }
      }
    }

    // Fonction helper pour attendre entre les envois
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Envoyer l'email client (priorité)
    const clientEmailHtml = generateClientEmailHtml(fullClientInfo, ticket)
    await sendMail({
      to: fullClientInfo.email,
      subject: `Cash360 – Confirmation de réception de vos documents – ${ticket}`,
      html: clientEmailHtml
    })

    // Attendre 1 seconde pour respecter les limites de rate
    await delay(1000)

    // Envoyer l'email admin combiné (documents + notification paiement)
    const adminEmailHtml = generateAdminEmailHtml(fullClientInfo, ticket, timestamp)
    await sendMail({
      to: process.env.MAIL_ADMIN || process.env.DESTINATION_EMAIL || 'cash@cash360.finance',
      subject: `[Cash360] Nouveau paiement reçu – ${fullClientInfo.prenom} ${fullClientInfo.nom} – ${ticket}`,
      html: adminEmailHtml
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
  timestamp: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e293b, #1e40af); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">📄 Nouveaux documents reçus - Cash360</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket: ${ticket}</p>
        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">Documents pour analyse financière</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">Informations client</h2>
        
        <div style="margin-bottom: 15px;">
          <strong>Nom complet:</strong> ${clientInfo.prenom} ${clientInfo.nom}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Email:</strong> ${clientInfo.email}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Mode de paiement:</strong> ${clientInfo.modePaiement === 'paypal' ? 'PayPal' : 'Virement bancaire'}
        </div>
        
        ${clientInfo.message ? `
        <div style="margin-bottom: 20px;">
          <strong>Message:</strong><br>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px;">
            ${clientInfo.message}
          </div>
        </div>
        ` : ''}
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 20px;">
          <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">📄 Documents reçus</h3>
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 24px; height: 24px; margin-right: 12px; color: #10b981;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <span style="color: #065f46; font-weight: 600; font-size: 16px;">3 relevés bancaires téléchargés avec succès</span>
          </div>
          <p style="margin: 10px 0 0 0; color: #065f46; font-size: 14px;">
            Les documents ont été stockés dans Supabase Storage et sont accessibles via le dashboard admin.
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      
      <!-- Header avec logo et ticket -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px; font-weight: bold;">✓</span>
        </div>
        <h1 style="margin: 0; font-size: 28px; color: #1f2937; font-weight: 600;">Confirmation de réception</h1>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">Ticket: <strong style="color: #1f2937;">${ticket}</strong></p>
      </div>

      <!-- Contenu principal -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Bonjour <strong>${clientInfo.prenom}</strong>,<br><br>
          Merci pour votre confiance ! Nous avons bien reçu vos documents pour l'analyse approfondie de vos finances.
        </p>

        <!-- Prochaines étapes -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px; text-align: center;">Prochaines étapes</h2>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
            <div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
              <span style="color: white; font-weight: bold; font-size: 14px;">1</span>
            </div>
            <div>
              <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">Analyse en cours</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Examen approfondi de vos 3 relevés bancaires</p>
            </div>
          </div>

          <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
            <div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
              <span style="color: white; font-weight: bold; font-size: 14px;">2</span>
            </div>
            <div>
              <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">Détection d'anomalies</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Identification des points d'amélioration</p>
            </div>
          </div>

          <div style="display: flex; align-items: flex-start;">
            <div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
              <span style="color: white; font-weight: bold; font-size: 14px;">3</span>
            </div>
            <div>
              <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">Recommandations</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Solutions personnalisées pour vos finances</p>
            </div>
          </div>
        </div>

        <!-- Délai de traitement -->
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 30px;">
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; margin-right: 12px; color: #3b82f6;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 600;">Délai de traitement</h3>
              <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                Nous analysons vos relevés et revenons vers vous sous <strong>48 à 72 heures ouvrées</strong> avec un <strong>compte-rendu détaillé</strong> et des <strong>recommandations personnalisées</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Besoin d'aide ?</h3>
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
            Pour toute question concernant votre dossier ou l'analyse :
          </p>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; margin-right: 8px; color: #6b7280;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
            </div>
            <a href="mailto:cash@cash360.finance" style="color: #3b82f6; text-decoration: none; font-weight: 500;">cash@cash360.finance</a>
          </div>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
            Référencez votre ticket <strong>${ticket}</strong> dans votre email
          </p>
        </div>

        <!-- Récapitulatif -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Récapitulatif</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Service :</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">Analyse approfondie de vos finances</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Montant :</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">39,99 €</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Ticket :</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px; font-family: monospace;">${ticket}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280; font-size: 14px;">Statut :</span>
            <span style="color: #10b981; font-weight: 500; font-size: 14px;">En cours de traitement</span>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">Cash360 - Analyse financière personnalisée</p>
      </div>
    </div>
  `
}