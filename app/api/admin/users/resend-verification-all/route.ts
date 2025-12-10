import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

/**
 * Route API pour renvoyer l'email de validation à tous les utilisateurs non validés
 * POST /api/admin/users/resend-verification-all
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

    // Récupérer tous les utilisateurs
    const { data: usersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()

    if (listUsersError) {
      console.error('Erreur lors de la récupération des utilisateurs:', listUsersError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      )
    }

    // Filtrer les utilisateurs non validés (email_confirmed_at est null)
    const pendingUsers = usersData.users.filter(user => !user.email_confirmed_at && user.email)

    if (pendingUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun utilisateur en attente de validation',
        sent_count: 0,
        failed_count: 0
      })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cash360.finance'
    const origin = request.headers.get('origin') || siteUrl

    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    // Envoyer les emails en série pour éviter de surcharger le serveur
    for (const user of pendingUsers) {
      try {
        // Incrémenter le compteur d'emails de validation envoyés
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
          user.id,
          {
            user_metadata: updatedMetadata
          }
        )

        if (updateMetadataError) {
          console.error(`Erreur lors de la mise à jour des métadonnées pour ${user.email}:`, updateMetadataError)
          // Continuer quand même l'envoi de l'email
        }

        // Générer le lien de confirmation
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: user.email!,
          options: {
            redirectTo: `${siteUrl}/auth/callback?next=/dashboard`
          }
        })

        if (linkError || !linkData?.properties?.action_link) {
          console.error(`Erreur lors de la génération du lien pour ${user.email}:`, linkError)
          failedCount++
          errors.push(`${user.email}: Erreur lors de la génération du lien`)
          continue
        }

        const confirmationLink = linkData.properties.action_link
        const userName = user.user_metadata?.first_name || user.email!.split('@')[0]
        
        // Générer le contenu de l'email
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
        await sendMail({
          to: user.email!,
          subject: 'Validez votre email - Cash360',
          html: emailHtml
        })

        sentCount++
        console.log(`[RESEND-VERIFICATION-ALL] ✅ Email envoyé à ${user.email}`)

      } catch (error: any) {
        console.error(`[RESEND-VERIFICATION-ALL] ❌ Erreur pour ${user.email}:`, error)
        failedCount++
        errors.push(`${user.email}: ${error.message || 'Erreur inconnue'}`)
      }
    }

    console.log(`[RESEND-VERIFICATION-ALL] ✅ Terminé: ${sentCount} envoyé(s), ${failedCount} échec(s)`)

    return NextResponse.json({
      success: true,
      message: `Emails envoyés: ${sentCount} réussi(s), ${failedCount} échec(s)`,
      sent_count: sentCount,
      failed_count: failedCount,
      total_count: pendingUsers.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('[RESEND-VERIFICATION-ALL] ❌ Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
