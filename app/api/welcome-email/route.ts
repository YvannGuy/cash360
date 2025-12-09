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

    const body = await request.json().catch(() => ({}))
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    let userEmail: string | null = null
    let userFirstName: string | null = null
    let userLastName: string | null = null
    
    // Option 1: Authentification via token Bearer (utilisateur connecté)
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
      }
    }
    
    // Option 2: Envoi direct après inscription (via email dans le body)
    // Permet d'envoyer l'email même si l'utilisateur n'a pas encore confirmé son email
    if (!userId && body.email) {
      userEmail = body.email
      userFirstName = body.firstName || null
      userLastName = body.lastName || null
      
      // Chercher l'utilisateur par email dans Supabase Auth (pagination pour trouver l'utilisateur)
      try {
        const MAX_PER_PAGE = 200
        let page = 1
        let hasMore = true
        let foundUser = null

        while (hasMore && !foundUser) {
          const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: MAX_PER_PAGE
          })
          
          if (listError) {
            console.log('Erreur recherche utilisateur:', listError)
            break
          }
          
          if (data?.users) {
            foundUser = data.users.find(u => u.email === body.email)
            if (foundUser) {
              userId = foundUser.id
              userFirstName = foundUser.user_metadata?.first_name || body.firstName || null
              userLastName = foundUser.user_metadata?.last_name || body.lastName || null
              break
            }
          }
          
          if (!data?.users || data.users.length < MAX_PER_PAGE) {
            hasMore = false
          } else {
            page += 1
          }
        }
      } catch (searchError) {
        console.log('Erreur recherche utilisateur par email:', searchError)
        // On continue quand même avec l'email fourni
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'email de bienvenue a déjà été envoyé
    // On vérifie dans la base de données si on a un champ pour suivre ça
    // Pour l'instant, on utilise les métadonnées utilisateur
    if (userId) {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (user?.user_metadata?.welcome_email_sent) {
        return NextResponse.json(
          { success: true, message: 'Email de bienvenue déjà envoyé' },
          { status: 200 }
        )
      }
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

    // Marquer l'email comme envoyé dans les métadonnées utilisateur (si userId disponible)
    if (userId) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...user?.user_metadata,
            welcome_email_sent: true,
            welcome_email_sent_at: new Date().toISOString()
          }
        })
      } catch (updateError) {
        console.error('[WELCOME-EMAIL] Erreur mise à jour métadonnées:', updateError)
        // On continue quand même, l'email a été envoyé
      }
    }

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
          <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-bottom: 20px;">🛍️ Découvre aussi nos formations</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            En complément de l'abonnement premium, tu peux aussi explorer nos formations pour approfondir ta compréhension financière :
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
          </ul>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${boutiqueUrl}" style="display: inline-block; background: linear-gradient(135deg, #00A1C6, #FEBE02); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Explorer les formations
            </a>
          </div>
        </div>

        <!-- Abonnement Premium - MISE EN AVANT -->
        <div style="background: linear-gradient(135deg, #FEBE02 0%, #F59E0B 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(254, 190, 2, 0.3); border: 2px solid #FEBE02;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 70px; height: 70px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <span style="color: white; font-size: 32px; font-weight: bold;">👑</span>
            </div>
            <h2 style="color: #012F4E; margin: 0 0 10px 0; font-size: 26px; font-weight: 700;">🚀 Passe au niveau supérieur avec l'abonnement Sagesse de Salomon</h2>
            <p style="color: #012F4E; font-size: 18px; font-weight: 600; margin: 0;">9,99€/mois • Transforme ta vie financière dès aujourd'hui</p>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.95); padding: 25px; border-radius: 10px; margin-bottom: 20px;">
            <p style="color: #012F4E; font-size: 16px; line-height: 1.7; margin-bottom: 20px; text-align: center; font-weight: 600;">
              L'abonnement <strong style="color: #F59E0B;">Sagesse de Salomon</strong> est la clé pour reprendre le contrôle total de tes finances. C'est ton coach financier personnel disponible 24/7.
            </p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #FEBE02; margin-bottom: 20px;">
              <h3 style="color: #92400e; margin-top: 0; font-size: 20px; font-weight: 600; margin-bottom: 15px;">✨ Ce que tu obtiens avec ton abonnement :</h3>
              <ul style="color: #92400e; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                <li><strong>📊 Tableau de bord complet</strong> → Visualise en un coup d'œil tes revenus, dépenses et épargne du mois avec comparaison au mois précédent</li>
                <li><strong>💰 Budget & suivi mensuel</strong> → Gère ton budget mois par mois, catégorie par catégorie, avec suivi en temps réel</li>
                <li><strong>⛔ Jeûne financier 30 jours</strong> → Lance un défi personnalisé pour reprendre le contrôle de tes dépenses impulsives et économiser chaque mois</li>
                <li><strong>🛡️ DebtFree</strong> → Crée ton plan de remboursement de dettes intelligent avec projections et dates de libération</li>
                <li><strong>📖 Verset biblique quotidien</strong> → Reçois ton inspiration spirituelle chaque jour pour aligner tes finances avec ta foi</li>
                <li><strong>🎯 Recommandations personnalisées</strong> → Reçois des conseils adaptés à ta situation financière</li>
              </ul>
            </div>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
              <h3 style="color: #065f46; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 12px;">💎 Pourquoi choisir l'abonnement ?</h3>
              <ul style="color: #065f46; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Accompagnement continu</strong> → Pas juste un outil, mais un véritable accompagnement mois après mois</li>
                <li><strong>Résultats mesurables</strong> → Suis ta progression et vois l'impact concret de tes efforts</li>
                <li><strong>Discipline renforcée</strong> → Le jeûne financier t'aide à développer une discipline durable</li>
                <li><strong>Liberté financière</strong> → DebtFree t'aide à éliminer tes dettes et retrouver ta liberté</li>
                <li><strong>Communauté de foi</strong> → Rejoins une communauté qui partage tes valeurs et ta vision</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${boutiqueUrl}#subscription" style="display: inline-block; background: #012F4E; color: #FEBE02; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(1, 47, 78, 0.3); transition: all 0.3s;">
                🎯 Souscrire maintenant à l'abonnement premium
              </a>
            </div>
            <p style="text-align: center; color: #012F4E; font-size: 14px; margin-top: 15px; font-style: italic;">
              Annulation possible à tout moment • Accès immédiat à tous les outils premium
            </p>
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
            Avec l'abonnement premium, débloque aussi le <strong>Tableau de bord</strong>, le <strong>Budget & suivi</strong>, le <strong>Jeûne financier</strong> et <strong>DebtFree</strong> !
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

