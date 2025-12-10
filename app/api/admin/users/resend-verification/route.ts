import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

/**
 * Route API pour renvoyer l'email de validation à un utilisateur
 * POST /api/admin/users/resend-verification
 * 
 * Body:
 * - userId: string (requis) - ID de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError || !userData?.user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const user = userData.user

    // Vérifier si l'email est déjà confirmé
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'L\'email de cet utilisateur est déjà confirmé' },
        { status: 400 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'L\'utilisateur n\'a pas d\'email' },
        { status: 400 }
      )
    }

    // Incrémenter le compteur d'emails de validation envoyés
    // Si le compteur n'existe pas et que l'utilisateur est pending, on suppose qu'au moins 1 email a été envoyé à la création
    const currentMetadata = user.user_metadata || {}
    let currentCount = currentMetadata.verification_emails_sent
    
    // Si le compteur n'existe pas, on initialise à 1 car un email est toujours envoyé à la création du compte
    if (currentCount === undefined || currentCount === null) {
      currentCount = 1 // Premier email envoyé à la création
    }
    
    const updatedMetadata = {
      ...currentMetadata,
      verification_emails_sent: currentCount + 1, // Incrémenter pour cet envoi
      last_verification_email_sent_at: new Date().toISOString()
    }

    // Mettre à jour les métadonnées de l'utilisateur
    const { error: updateMetadataError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: updatedMetadata
      }
    )

    if (updateMetadataError) {
      console.error('Erreur lors de la mise à jour des métadonnées:', updateMetadataError)
      // Continuer quand même l'envoi de l'email même si la mise à jour des métadonnées échoue
    }

    // Générer le lien de confirmation
    // Utiliser l'URL de production pour le lien de confirmation
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cash360.finance'
    
    // Utiliser 'magiclink' au lieu de 'signup' car signup nécessite un password
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/dashboard`
      }
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Erreur lors de la génération du lien:', linkError)
      return NextResponse.json(
        { error: 'Erreur lors de la génération du lien de confirmation' },
        { status: 500 }
      )
    }

    const confirmationLink = linkData.properties.action_link

    // Générer le contenu de l'email
    const origin = request.headers.get('origin') || siteUrl
    const userName = user.user_metadata?.first_name || user.email.split('@')[0]
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Validez votre email - Cash360</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px; text-align: center;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #012F4E 0%, #00A1C6 100%); border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Validez votre email</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Bonjour ${userName},
                      </p>
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Vous avez créé un compte sur Cash360. Pour finaliser votre inscription et accéder à tous nos services, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
                      </p>
                      <table role="presentation" style="width: 100%; margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${confirmationLink}" style="display: inline-block; padding: 14px 32px; background-color: #00A1C6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Valider mon email</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                      </p>
                      <p style="margin: 10px 0 0 0; color: #00A1C6; font-size: 12px; word-break: break-all;">
                        ${confirmationLink}
                      </p>
                      <p style="margin: 30px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                        Ce lien est valide pendant 24 heures. Si vous n'avez pas créé de compte sur Cash360, vous pouvez ignorer cet email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; background-color: #f5f7fa; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #666666; font-size: 12px;">
                        © ${new Date().getFullYear()} Cash360. Tous droits réservés.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    // Envoyer l'email
    try {
      await sendMail({
        to: user.email,
        subject: 'Validez votre email - Cash360',
        html: emailHtml
      })

      console.log(`[RESEND-VERIFICATION] ✅ Email de validation renvoyé à ${user.email}`)

      return NextResponse.json({
        success: true,
        message: 'Email de validation renvoyé avec succès',
        email: user.email,
        verification_emails_sent: updatedMetadata.verification_emails_sent
      })
    } catch (emailError: any) {
      console.error('[RESEND-VERIFICATION] ❌ Erreur lors de l\'envoi de l\'email:', emailError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email: ' + emailError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[RESEND-VERIFICATION] ❌ Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
