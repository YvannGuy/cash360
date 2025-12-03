import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

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
          userFirstName = user.user_metadata?.first_name || null
          userLastName = user.user_metadata?.last_name || null
        }
      } catch (tokenError) {
        console.log('Token invalide ou expiré:', tokenError)
        return NextResponse.json(
          { error: 'Utilisateur non authentifié' },
          { status: 401 }
        )
      }
    }

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier si l'email de bienvenue a déjà été envoyé
    // On vérifie dans la base de données si on a un champ pour suivre ça
    // Pour l'instant, on utilise les métadonnées utilisateur
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (user?.user_metadata?.welcome_email_sent) {
      return NextResponse.json(
        { success: true, message: 'Email de bienvenue déjà envoyé' },
        { status: 200 }
      )
    }

    // Générer et envoyer l'email de bienvenue
    const origin = request.headers.get('origin') || 'https://cash360.finance'
    const welcomeEmailHtml = generateWelcomeEmailHtml(
      userFirstName || 'Cher utilisateur',
      userLastName || '',
      origin
    )

    console.log('[WELCOME-EMAIL] 📧 Envoi email de bienvenue à:', userEmail)
    await sendMail({
      to: userEmail,
      subject: 'Bienvenue sur Cash360 – votre nouvelle liberté financière commence ici',
      html: welcomeEmailHtml
    })

    // Marquer l'email comme envoyé dans les métadonnées utilisateur
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user?.user_metadata,
        welcome_email_sent: true,
        welcome_email_sent_at: new Date().toISOString()
      }
    })

    console.log('[WELCOME-EMAIL] ✅ Email de bienvenue envoyé avec succès')
    return NextResponse.json({ 
      success: true,
      message: 'Email de bienvenue envoyé avec succès'
    })

  } catch (error) {
    console.error('[WELCOME-EMAIL] ❌ Erreur envoi email de bienvenue:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

function generateWelcomeEmailHtml(firstName: string, lastName: string, origin: string): string {
  const dashboardUrl = origin || 'https://cash360.finance'
  const boutiqueUrl = `${dashboardUrl}/dashboard?tab=boutique`
  const liveUrl = `${dashboardUrl}/dashboard`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Cash360</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      
      <!-- Header -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00A1C6, #FEBE02); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px; font-weight: bold;">💰</span>
        </div>
        <h1 style="margin: 0; font-size: 28px; color: #1f2937; font-weight: 600;">Bienvenue sur Cash360</h1>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">Votre nouvelle liberté financière commence ici</p>
      </div>

      <!-- Contenu principal -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Bonjour <strong>${firstName} ${lastName}</strong>,<br><br>
          Bienvenue dans Cash360, la plateforme qui t'aide à reprendre le contrôle de tes finances avec une approche simple, spirituelle et profondément transformatrice.
        </p>

        <!-- Découvre ton espace Cash360 -->
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #00A1C6; margin-bottom: 30px;">
          <h2 style="color: #1e40af; margin-top: 0; font-size: 20px; font-weight: 600;">Découvre ton espace Cash360</h2>
          <p style="color: #1e40af; font-size: 14px; line-height: 1.5; margin: 0;">
            Cash360 n'est pas une simple plateforme c'est ton coach financier et spirituel personnel.<br><br>
            Tout est conçu pour t'aider à comprendre tes finances, corriger tes erreurs et bâtir une base solide pour la prospérité.
          </p>
        </div>

        <!-- Explore la boutique -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-bottom: 20px;">🛍️ Explore la boutique Cash360</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            C'est le cœur de la plateforme.<br><br>
            Tu y trouveras tout ce qu'il faut pour avancer pas à pas :
          </p>
          
          <ul style="color: #374151; font-size: 15px; line-height: 1.8; margin-bottom: 20px; padding-left: 20px;">
            <li><strong>Analyse Financière Personnalisée</strong> → téléverse tes relevés bancaires et reçois un diagnostic clair de ta situation.</li>
            <li><strong>Capsules de Formation</strong> → 6 parcours puissants pour transformer ta vision de l'argent :
              <ul style="margin-top: 8px; padding-left: 20px;">
                <li>L'éducation financière</li>
                <li>La mentalité de pauvreté</li>
                <li>Les lois spirituelles liées à l'argent</li>
                <li>Les combats liés à la prospérité</li>
                <li>L'épargne et l'investissement</li>
              </ul>
            </li>
            <li><strong>Pack Complet Cash360</strong> → toutes les capsules à tarif préférentiel</li>
            <li><strong>Abonnement Sagesse de Salomon</strong> → accède aux fonctionnalités premium :
              <ul style="margin-top: 8px; padding-left: 20px;">
                <li>📊 Tableau de bord financier complet</li>
                <li>💰 Budget & suivi mois par mois</li>
                <li>⛔ Jeûne financier 30 jours</li>
              </ul>
            </li>
          </ul>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${boutiqueUrl}" style="display: inline-block; background: linear-gradient(135deg, #00A1C6, #FEBE02); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Découvrir la boutique maintenant
            </a>
          </div>
        </div>

        <!-- Abonnement Premium -->
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #FEBE02; margin-bottom: 30px;">
          <h2 style="color: #92400e; margin-top: 0; font-size: 20px; font-weight: 600;">✨ Passe au niveau supérieur</h2>
          <p style="color: #92400e; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
            Avec l'abonnement <strong>Sagesse de Salomon</strong>, transforme réellement ta vie financière :
          </p>
          <ul style="color: #92400e; font-size: 14px; line-height: 1.8; margin: 0 0 15px 0; padding-left: 20px;">
            <li><strong>Tableau de bord</strong> → visualise revenus, dépenses et épargne du mois</li>
            <li><strong>Budget & suivi</strong> → gère ton budget mois par mois</li>
            <li><strong>Jeûne financier</strong> → lance un défi de 30 jours pour reprendre le contrôle</li>
            <li><strong>Verset biblique quotidien</strong> → reçois ton inspiration spirituelle chaque jour</li>
          </ul>
          <div style="text-align: center; margin-top: 15px;">
            <a href="${boutiqueUrl}#subscription" style="display: inline-block; background: #FEBE02; color: #012F4E; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Découvrir l'abonnement premium
            </a>
          </div>
        </div>

        <!-- Ton espace personnel -->
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 30px;">
          <h2 style="color: #065f46; margin-top: 0; font-size: 20px; font-weight: 600;">📦 Ton espace personnel</h2>
          <p style="color: #065f46; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
            Dans ton espace dashboard, tu retrouves :
          </p>
          <ul style="color: #065f46; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>Boutique</strong> → explore et achète nos produits</li>
            <li><strong>Mes achats</strong> → télécharge tes analyses, accède à tes capsules et formations</li>
            <li><strong>Profil</strong> → gère tes informations, ta devise, ta langue et ton abonnement</li>
          </ul>
          <p style="color: #065f46; font-size: 14px; line-height: 1.5; margin-top: 15px; margin-bottom: 0;">
            Avec l'abonnement premium, débloque aussi le <strong>Tableau de bord</strong>, le <strong>Budget & suivi</strong> et le <strong>Jeûne financier</strong> !
          </p>
        </div>

        <!-- Contact -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Un besoin ? Une question ?</h3>
          <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
            Notre équipe t'accompagne personnellement.
          </p>
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 20px; height: 20px; margin-right: 8px; color: #6b7280;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
            </div>
            <a href="mailto:cash@cash360.finance" style="color: #3b82f6; text-decoration: none; font-weight: 500;">cash@cash360.finance</a>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; margin-right: 8px; color: #6b7280;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
            </div>
            <a href="https://wa.me/33756848734" style="color: #3b82f6; text-decoration: none; font-weight: 500;">WhatsApp : +33 7 56 84 87 34</a>
          </div>
        </div>

        <!-- Message final -->
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
            <strong>Cash360, c'est plus qu'une plateforme :</strong><br>
            c'est une communauté de foi, de sagesse et de prospérité.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
            Tu as fait le premier pas, maintenant, il est temps de transformer ta vie financière.
          </p>
        </div>

        <!-- Signature -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">À très vite,</p>
          <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">L'équipe Cash360</p>
          <p style="color: #6b7280; font-size: 12px; font-style: italic; margin: 0;">
            "La maîtrise de vos finances, de A à Z, avec sagesse et foi."
          </p>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Cash360 - Analyse financière personnalisée</p>
      </div>
    </body>
    </html>
  `
}

