export interface EmailTemplate {
  id: number
  name: string
  description: string
  preview: string
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'Moderne & Minimaliste',
    description: 'Design épuré avec accent sur le contenu',
    preview: '🎨 Moderne'
  },
  {
    id: 2,
    name: 'Gradient Coloré',
    description: 'Dégradés vibrants pour un impact visuel fort',
    preview: '🌈 Coloré'
  },
  {
    id: 3,
    name: 'Classique Professionnel',
    description: 'Style corporate traditionnel et élégant',
    preview: '💼 Professionnel'
  },
  {
    id: 4,
    name: 'Newsletter Moderne',
    description: 'Layout en colonnes avec sections bien définies',
    preview: '📰 Newsletter'
  },
  {
    id: 5,
    name: 'Promotionnel',
    description: 'Parfait pour les offres et promotions',
    preview: '🎯 Promotion'
  },
  {
    id: 6,
    name: 'Annonce Événement',
    description: 'Idéal pour annoncer des événements ou lancements',
    preview: '📅 Événement'
  },
  {
    id: 7,
    name: 'Élégant avec Bordure',
    description: 'Design raffiné avec bordures décoratives',
    preview: '✨ Élégant'
  },
  {
    id: 8,
    name: 'Carte Postale',
    description: 'Style carte postale avec image en en-tête',
    preview: '📮 Carte'
  },
  {
    id: 9,
    name: 'Bold & Impact',
    description: 'Design audacieux avec typographie forte',
    preview: '💪 Impact'
  },
  {
    id: 10,
    name: 'Simple & Efficace',
    description: 'Layout simple et direct pour tous les usages',
    preview: '📧 Simple'
  }
]

export function generateEmailHtml(
  templateId: number,
  subject: string,
  body: string,
  origin: string
): string {
  const dashboardUrl = `${origin}/dashboard`
  const subscriptionUrl = `${origin}/dashboard?tab=boutique#subscription`
  const boutiqueUrl = `${origin}/dashboard?tab=boutique`

  // Convertir les retours à la ligne en <br>
  const formattedBody = body.split('\n').map(line => line.trim()).filter(line => line).join('<br><br>')

  switch (templateId) {
    case 1:
      return generateTemplate1(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 2:
      return generateTemplate2(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 3:
      return generateTemplate3(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 4:
      return generateTemplate4(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 5:
      return generateTemplate5(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 6:
      return generateTemplate6(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 7:
      return generateTemplate7(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 8:
      return generateTemplate8(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 9:
      return generateTemplate9(subject, formattedBody, dashboardUrl, subscriptionUrl)
    case 10:
      return generateTemplate10(subject, formattedBody, dashboardUrl, subscriptionUrl)
    default:
      return generateTemplate1(subject, formattedBody, dashboardUrl, subscriptionUrl)
  }
}

// Template 1: Moderne & Minimaliste
function generateTemplate1(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #00A1C6, #FEBE02); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">💰</span>
          </div>
          <h1 style="margin: 0; font-size: 24px; color: #1f2937; font-weight: 600;">Cash360</h1>
        </div>
        <div style="color: #374151; font-size: 16px; line-height: 1.6;">
          ${body}
        </div>
        <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">L'équipe Cash360</p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
            <a href="${dashboardUrl}" style="color: #3b82f6; text-decoration: none;">Accéder au dashboard</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 2: Gradient Coloré
function generateTemplate2(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #00A1C6 0%, #FEBE02 100%); padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="background: white; padding: 40px; border-radius: 8px;">
          <h1 style="margin: 0 0 30px 0; font-size: 28px; color: #012F4E; font-weight: 700; text-align: center;">${subject}</h1>
          <div style="color: #374151; font-size: 16px; line-height: 1.8;">
            ${body}
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #00A1C6, #FEBE02); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Accéder au dashboard</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: white; font-size: 14px; margin: 0;">L'équipe Cash360</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 3: Classique Professionnel
function generateTemplate3(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
      <div style="border: 2px solid #012F4E; padding: 40px;">
        <div style="border-bottom: 3px solid #FEBE02; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 26px; color: #012F4E; font-weight: 700; letter-spacing: 1px;">CASH360</h1>
        </div>
        <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-bottom: 20px;">${subject}</h2>
        <div style="color: #374151; font-size: 15px; line-height: 1.8; font-family: 'Times New Roman', serif;">
          ${body}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Cordialement,</p>
          <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 5px 0 0 0;">L'équipe Cash360</p>
          <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
            <a href="${dashboardUrl}" style="color: #012F4E; text-decoration: underline;">cash360.finance</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 4: Newsletter Moderne
function generateTemplate4(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #012F4E, #00A1C6); padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 700;">Cash360</h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-bottom: 20px;">${subject}</h2>
          <div style="color: #374151; font-size: 16px; line-height: 1.7;">
            ${body}
          </div>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #00A1C6;">
            <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">💡 Besoin d'aide ?</p>
            <p style="margin: 5px 0 0 0; color: #1e40af; font-size: 14px;">Contactez-nous à <a href="mailto:cash@cash360.finance" style="color: #3b82f6;">cash@cash360.finance</a></p>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <a href="${dashboardUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Accéder à mon dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 5: Promotionnel
function generateTemplate5(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #FEBE02, #F59E0B); padding: 40px; text-align: center;">
          <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 40px;">🎉</span>
          </div>
          <h1 style="margin: 0; font-size: 28px; color: #012F4E; font-weight: 700;">${subject}</h1>
        </div>
        <div style="padding: 40px;">
          <div style="color: #374151; font-size: 16px; line-height: 1.8;">
            ${body}
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #012F4E; color: #FEBE02; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px;">Découvrir maintenant</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Cash360 - Votre liberté financière</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 6: Annonce Événement
function generateTemplate6(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background: #012F4E; padding: 30px; text-align: center; position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; background: #FEBE02; color: #012F4E; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 700;">NOUVEAU</div>
          <h1 style="margin: 0; font-size: 26px; color: white; font-weight: 700;">${subject}</h1>
        </div>
        <div style="padding: 40px;">
          <div style="color: #374151; font-size: 16px; line-height: 1.8;">
            ${body}
          </div>
        </div>
        <div style="background: #f0f9ff; padding: 30px; text-align: center; border-top: 3px solid #00A1C6;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #00A1C6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">En savoir plus</a>
        </div>
        <div style="padding: 20px; text-align: center; background: #f8f9fa;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">L'équipe Cash360</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 7: Élégant avec Bordure
function generateTemplate7(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; padding: 40px; border: 3px solid #012F4E; border-radius: 8px; position: relative;">
        <div style="position: absolute; top: -15px; left: 30px; background: #FEBE02; color: #012F4E; padding: 5px 20px; border-radius: 4px; font-weight: 700; font-size: 14px;">Cash360</div>
        <h1 style="color: #012F4E; font-size: 24px; font-weight: 700; margin-top: 20px; margin-bottom: 30px; border-bottom: 2px solid #FEBE02; padding-bottom: 15px;">${subject}</h1>
        <div style="color: #374151; font-size: 16px; line-height: 1.8;">
          ${body}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">L'équipe Cash360</p>
          <a href="${dashboardUrl}" style="color: #012F4E; text-decoration: none; font-size: 14px; font-weight: 600;">Visiter le site</a>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 8: Carte Postale
function generateTemplate8(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #00A1C6, #012F4E); height: 150px; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 30px;">💼</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 700;">${subject}</h1>
          </div>
        </div>
        <div style="padding: 40px;">
          <div style="color: #374151; font-size: 16px; line-height: 1.8;">
            ${body}
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <a href="${dashboardUrl}" style="color: #00A1C6; text-decoration: none; font-weight: 600;">Accéder au dashboard →</a>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 9: Bold & Impact
function generateTemplate9(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1f2937;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.2);">
        <div style="background: #012F4E; padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; color: #FEBE02; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">${subject}</h1>
        </div>
        <div style="padding: 40px; background: white;">
          <div style="color: #1f2937; font-size: 18px; line-height: 1.8; font-weight: 500;">
            ${body}
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #012F4E; color: #FEBE02; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 900; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">ACTION</a>
          </div>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #FEBE02; font-size: 14px; font-weight: 700; margin: 0;">CASH360</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 10: Simple & Efficace
function generateTemplate10(subject: string, body: string, dashboardUrl: string, subscriptionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
      <div style="border-top: 4px solid #00A1C6; padding-top: 30px;">
        <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; margin-bottom: 20px;">${subject}</h1>
        <div style="color: #374151; font-size: 16px; line-height: 1.7;">
          ${body}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">L'équipe Cash360</p>
          <a href="${dashboardUrl}" style="color: #00A1C6; text-decoration: none; font-size: 14px;">cash360.finance</a>
        </div>
      </div>
    </body>
    </html>
  `
}
