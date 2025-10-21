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

    const formData = await request.formData()
    
    // Extraire les données du formulaire
    const clientInfo = {
      prenom: formData.get('prenom') as string,
      nom: formData.get('nom') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string || undefined,
      paymentMethod: formData.get('paymentMethod') as 'virement' | 'paypal',
      consentement: formData.get('consentement') === 'true'
    }

    // Validation des données client
    const validatedClientInfo = clientInfoSchema.parse(clientInfo)

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

    // Fonction helper pour attendre entre les envois
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Envoyer l'email admin
    const adminEmailHtml = generateAdminEmailHtml(validatedClientInfo, ticket, timestamp, signedUrls)
    await sendMail({
      to: process.env.MAIL_ADMIN || process.env.DESTINATION_EMAIL || 'cash@cash360.finance',
      subject: `[Cash360] Nouveau dossier d'analyse – ${validatedClientInfo.prenom} ${validatedClientInfo.nom} – ${ticket}`,
      html: adminEmailHtml
    })

    // Attendre 1 seconde pour respecter les limites de rate
    await delay(1000)

    // Envoyer l'email client
    const clientEmailHtml = generateClientEmailHtml(validatedClientInfo, ticket)
    await sendMail({
      to: validatedClientInfo.email,
      subject: `Cash360 – Confirmation de réception de vos documents – ${ticket}`,
      html: clientEmailHtml
    })

    // Attendre 1 seconde pour respecter les limites de rate
    await delay(1000)

    // Envoyer l'email de notification de paiement à cash@cash360.finance
    const paymentNotificationHtml = generatePaymentNotificationHtml(validatedClientInfo, ticket)
    await sendMail({
      to: 'cash@cash360.finance',
      subject: `[Cash360] Nouveau paiement reçu – ${validatedClientInfo.prenom} ${validatedClientInfo.nom} – ${ticket}`,
      html: paymentNotificationHtml
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
            <a href="mailto:contact@cash360.finance" style="color: #3b82f6; text-decoration: none; font-weight: 500;">contact@cash360.finance</a>
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
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">59,99 €</span>
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

function generatePaymentNotificationHtml(clientInfo: any, ticket: string): string {
  const paymentMethodText = clientInfo.paymentMethod === 'virement' ? 'Virement bancaire' : 'PayPal'
  const paymentStatus = clientInfo.paymentMethod === 'virement' 
    ? 'En attente de réception' 
    : 'PayPal - Paiement effectué'
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      
      <!-- Header avec notification de paiement -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px; font-weight: bold;">💰</span>
        </div>
        <h1 style="margin: 0; font-size: 28px; color: #1f2937; font-weight: 600;">Nouveau paiement reçu</h1>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">Ticket: <strong style="color: #1f2937;">${ticket}</strong></p>
      </div>

      <!-- Contenu principal -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Informations client -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">Informations client</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <div style="margin-bottom: 12px;">
              <strong style="color: #1f2937;">Nom complet:</strong>
              <span style="color: #374151; margin-left: 8px;">${clientInfo.prenom} ${clientInfo.nom}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="color: #1f2937;">Email:</strong>
              <span style="color: #374151; margin-left: 8px;">${clientInfo.email}</span>
            </div>
            ${clientInfo.message ? `
            <div style="margin-bottom: 12px;">
              <strong style="color: #1f2937;">Message:</strong>
              <div style="background: white; padding: 10px; border-radius: 5px; margin-top: 5px; color: #374151;">
                ${clientInfo.message}
              </div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Informations de paiement -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">Informations de paiement</h2>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #1e40af; font-weight: 600;">Mode de paiement:</span>
              <span style="color: #1e40af; font-weight: 500;">${paymentMethodText}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #1e40af; font-weight: 600;">Montant:</span>
              <span style="color: #1e40af; font-weight: 500;">59,99 €</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #1e40af; font-weight: 600;">Statut:</span>
              <span style="color: #10b981; font-weight: 500;">${paymentStatus}</span>
            </div>
          </div>
        </div>

        <!-- Confirmation des documents -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">Documents reçus</h2>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="width: 20px; height: 20px; margin-right: 12px; color: #10b981;">
                <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <span style="color: #065f46; font-weight: 600;">3 relevés bancaires téléchargés</span>
            </div>
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              Le client a bien téléchargé ses 3 derniers relevés bancaires pour l'analyse approfondie.
            </p>
          </div>
        </div>

        <!-- Actions requises -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px;">Actions requises</h2>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <div style="margin-bottom: 15px;">
              <h3 style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">1. Vérifier le paiement</h3>
              <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">
                ${clientInfo.paymentMethod === 'virement' 
                  ? 'Vérifier la réception du virement bancaire sur le compte Revolut'
                  : 'Le paiement PayPal a été effectué automatiquement'}
              </p>
            </div>
            <div>
              <h3 style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">2. Commencer l'analyse</h3>
              <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">
                Accéder aux documents via l'email admin pour commencer l'analyse des relevés
              </p>
            </div>
          </div>
        </div>

        <!-- Récapitulatif -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Récapitulatif</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Service :</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">Analyse approfondie de vos finances</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Ticket :</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px; font-family: monospace;">${ticket}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Date :</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${new Date().toLocaleString('fr-FR')}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280; font-size: 14px;">Statut :</span>
            <span style="color: #10b981; font-weight: 500; font-size: 14px;">Paiement reçu - Prêt pour analyse</span>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">Cash360 - Notification de paiement automatique</p>
      </div>
    </div>
  `
}
