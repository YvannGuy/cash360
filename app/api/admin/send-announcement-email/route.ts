import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

// GET: Prévisualiser le contenu du mail
export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || 'https://cash360.finance'
    const emailHtml = generateAnnouncementEmailHtml(origin)
    
    return NextResponse.json({
      success: true,
      preview: emailHtml,
      subject: '🎉 Cash360 évolue ! Découvrez nos nouveautés et l\'abonnement à 9,99€/mois'
    })
  } catch (error) {
    console.error('Erreur génération preview:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du preview' },
      { status: 500 }
    )
  }
}

// POST: Envoyer le mail à tous les utilisateurs
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { confirm } = await request.json()
    
    if (!confirm) {
      return NextResponse.json(
        { error: 'Confirmation requise pour envoyer les emails' },
        { status: 400 }
      )
    }

    // Récupérer tous les utilisateurs
    const MAX_PER_PAGE = 200
    const allUsers: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: MAX_PER_PAGE
      })

      if (error) {
        console.error('Erreur lors de la récupération des utilisateurs (page', page, '):', error)
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des utilisateurs' },
          { status: 500 }
        )
      }

      const batch = data?.users || []
      // Filtrer uniquement les utilisateurs avec email valide
      const validUsers = batch.filter(user => user.email && user.email_confirmed_at)
      allUsers.push(...validUsers)

      if (batch.length < MAX_PER_PAGE) {
        hasMore = false
      } else {
        page += 1
      }
    }

    console.log(`[ANNOUNCEMENT-EMAIL] 📧 Préparation envoi à ${allUsers.length} utilisateurs`)

    const origin = request.headers.get('origin') || 'https://cash360.finance'
    const emailHtml = generateAnnouncementEmailHtml(origin)
    const subject = '🎉 Cash360 évolue ! Découvrez nos nouveautés et l\'abonnement à 9,99€/mois'

    // Envoyer les emails avec un délai pour éviter les limites de rate
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i]
      const firstName = user.user_metadata?.first_name || ''
      const lastName = user.user_metadata?.last_name || ''
      
      try {
        // Personnaliser l'email avec le prénom si disponible
        const personalizedHtml = emailHtml.replace(
          /Bonjour\s+<strong>.*?<\/strong>/,
          firstName 
            ? `Bonjour <strong>${firstName}${lastName ? ' ' + lastName : ''}</strong>`
            : 'Bonjour'
        )

        await sendMail({
          to: user.email!,
          subject,
          html: personalizedHtml
        })

        results.success++
        
        // Délai de 1 seconde entre chaque email pour respecter les limites de rate
        if (i < allUsers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${user.email}: ${error.message}`)
        console.error(`[ANNOUNCEMENT-EMAIL] ❌ Erreur pour ${user.email}:`, error)
      }
    }

    console.log(`[ANNOUNCEMENT-EMAIL] ✅ Envoi terminé: ${results.success} succès, ${results.failed} échecs`)

    return NextResponse.json({
      success: true,
      message: `Emails envoyés: ${results.success} succès, ${results.failed} échecs`,
      stats: {
        total: allUsers.length,
        success: results.success,
        failed: results.failed
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 10) : [] // Limiter à 10 erreurs
    })

  } catch (error) {
    console.error('[ANNOUNCEMENT-EMAIL] ❌ Erreur:', error)
    
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

function generateAnnouncementEmailHtml(origin: string): string {
  const dashboardUrl = `${origin}/dashboard`
  const subscriptionUrl = `${origin}/dashboard?tab=boutique#subscription`
  const boutiqueUrl = `${origin}/dashboard?tab=boutique`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cash360 évolue !</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      
      <!-- Header -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00A1C6, #FEBE02); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px; font-weight: bold;">🎉</span>
        </div>
        <h1 style="margin: 0; font-size: 28px; color: #1f2937; font-weight: 600;">Cash360 évolue !</h1>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">Découvrez nos nouveautés et transformez votre vie financière</p>
      </div>

      <!-- Contenu principal -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Bonjour <strong>Cher utilisateur</strong>,<br><br>
          Nous avons le plaisir de vous annoncer que <strong>Cash360 évolue</strong> ! Nous avons travaillé dur pour améliorer votre expérience et vous offrir de nouveaux outils puissants pour reprendre le contrôle de vos finances.
        </p>

        <!-- Nouveautés -->
        <div style="background: #f0f9ff; padding: 25px; border-radius: 8px; border-left: 4px solid #00A1C6; margin-bottom: 30px;">
          <h2 style="color: #1e40af; margin-top: 0; font-size: 22px; font-weight: 600; margin-bottom: 20px;">✨ Les nouveautés de Cash360</h2>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #1e40af; font-size: 18px; font-weight: 600; margin-bottom: 10px;">📊 Tableau de bord complet</h3>
            <p style="color: #1e40af; font-size: 15px; line-height: 1.6; margin: 0;">
              Visualisez en un coup d'œil vos revenus, dépenses et épargne du mois avec une comparaison au mois précédent. Un aperçu clair de votre situation financière.
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1e40af; font-size: 18px; font-weight: 600; margin-bottom: 10px;">💰 Budget & suivi mensuel</h3>
            <p style="color: #1e40af; font-size: 15px; line-height: 1.6; margin: 0;">
              Gérez votre budget mois par mois, catégorie par catégorie, avec un suivi en temps réel. Plus jamais de surprises en fin de mois !
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1e40af; font-size: 18px; font-weight: 600; margin-bottom: 10px;">⛔ Jeûne financier 30 jours</h3>
            <p style="color: #1e40af; font-size: 15px; line-height: 1.6; margin: 0;">
              Lancez un défi personnalisé pour reprendre le contrôle de vos dépenses impulsives et économiser chaque mois. Développez une discipline financière durable.
            </p>
          </div>

          <div style="margin-bottom: 0;">
            <h3 style="color: #1e40af; font-size: 18px; font-weight: 600; margin-bottom: 10px;">🛡️ DebtFree - Plan de remboursement intelligent</h3>
            <p style="color: #1e40af; font-size: 15px; line-height: 1.6; margin: 0;">
              Créez votre plan de remboursement de dettes avec projections et dates de libération. Retrouvez votre liberté financière étape par étape.
            </p>
          </div>
        </div>

        <!-- Abonnement Premium - MISE EN AVANT -->
        <div style="background: linear-gradient(135deg, #FEBE02 0%, #F59E0B 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(254, 190, 2, 0.3); border: 2px solid #FEBE02;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 70px; height: 70px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <span style="color: white; font-size: 32px; font-weight: bold;">👑</span>
            </div>
            <h2 style="color: #012F4E; margin: 0 0 10px 0; font-size: 26px; font-weight: 700;">🚀 Abonnement Sagesse de Salomon</h2>
            <p style="color: #012F4E; font-size: 24px; font-weight: 700; margin: 0;">Seulement 9,99€/mois</p>
            <p style="color: #012F4E; font-size: 16px; font-weight: 600; margin: 10px 0 0 0;">Transformez votre vie financière dès aujourd'hui</p>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.95); padding: 25px; border-radius: 10px; margin-bottom: 20px;">
            <p style="color: #012F4E; font-size: 16px; line-height: 1.7; margin-bottom: 20px; text-align: center; font-weight: 600;">
              Avec l'abonnement <strong style="color: #F59E0B;">Sagesse de Salomon</strong>, accédez à tous ces outils puissants et bien plus encore. C'est votre coach financier personnel disponible 24/7.
            </p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #FEBE02; margin-bottom: 20px;">
              <h3 style="color: #92400e; margin-top: 0; font-size: 20px; font-weight: 600; margin-bottom: 15px;">✨ Ce que vous obtenez avec votre abonnement :</h3>
              <ul style="color: #92400e; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                <li><strong>📊 Tableau de bord complet</strong> → Visualisez vos revenus, dépenses et épargne avec comparaison mensuelle</li>
                <li><strong>💰 Budget & suivi mensuel</strong> → Gérez votre budget catégorie par catégorie avec suivi en temps réel</li>
                <li><strong>⛔ Jeûne financier 30 jours</strong> → Développez une discipline financière durable et économisez chaque mois</li>
                <li><strong>🛡️ DebtFree</strong> → Créez votre plan de remboursement intelligent avec projections et dates de libération</li>
                <li><strong>📖 Verset biblique quotidien</strong> → Recevez votre inspiration spirituelle chaque jour pour aligner vos finances avec votre foi</li>
                <li><strong>🎯 Recommandations personnalisées</strong> → Recevez des conseils adaptés à votre situation financière</li>
                <li><strong>📈 Suivi de progression</strong> → Visualisez votre évolution mois après mois</li>
              </ul>
            </div>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
              <h3 style="color: #065f46; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 12px;">💎 Pourquoi choisir l'abonnement ?</h3>
              <ul style="color: #065f46; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Accompagnement continu</strong> → Pas juste un outil, mais un véritable accompagnement mois après mois</li>
                <li><strong>Résultats mesurables</strong> → Suivez votre progression et voyez l'impact concret de vos efforts</li>
                <li><strong>Discipline renforcée</strong> → Le jeûne financier vous aide à développer une discipline durable</li>
                <li><strong>Liberté financière</strong> → DebtFree vous aide à éliminer vos dettes et retrouver votre liberté</li>
                <li><strong>Communauté de foi</strong> → Rejoignez une communauté qui partage vos valeurs et votre vision</li>
                <li><strong>Investissement rentable</strong> → Pour moins de 10€/mois, transformez votre relation à l'argent</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${subscriptionUrl}" style="display: inline-block; background: #012F4E; color: #FEBE02; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(1, 47, 78, 0.3); transition: all 0.3s;">
                🎯 Souscrire maintenant à 9,99€/mois
              </a>
            </div>
            <p style="text-align: center; color: #012F4E; font-size: 14px; margin-top: 15px; font-style: italic;">
              Annulation possible à tout moment • Accès immédiat à tous les outils premium
            </p>
          </div>
        </div>

        <!-- Message d'incitation -->
        <div style="background: #fef3c7; padding: 25px; border-radius: 8px; border-left: 4px solid #FEBE02; margin-bottom: 30px;">
          <h3 style="color: #92400e; margin-top: 0; font-size: 20px; font-weight: 600; margin-bottom: 15px;">💡 Ne manquez pas cette opportunité</h3>
          <p style="color: #92400e; font-size: 15px; line-height: 1.7; margin: 0;">
            Pour seulement <strong>9,99€ par mois</strong>, vous accédez à une suite complète d'outils qui vous aideront à :
          </p>
          <ul style="color: #92400e; font-size: 15px; line-height: 2; margin: 15px 0 0 0; padding-left: 20px;">
            <li>Comprendre précisément où va votre argent</li>
            <li>Économiser chaque mois de manière structurée</li>
            <li>Éliminer vos dettes avec un plan clair</li>
            <li>Développer une discipline financière durable</li>
            <li>Atteindre vos objectifs financiers plus rapidement</li>
          </ul>
          <p style="color: #92400e; font-size: 15px; line-height: 1.7; margin: 20px 0 0 0; font-weight: 600;">
            C'est un investissement dans votre avenir financier. Commencez dès aujourd'hui !
          </p>
        </div>

        <!-- CTA Final -->
        <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #00A1C6, #012F4E); border-radius: 12px; margin-bottom: 30px;">
          <h2 style="color: white; font-size: 24px; font-weight: 700; margin: 0 0 15px 0;">Prêt à transformer votre vie financière ?</h2>
          <p style="color: #FEBE02; font-size: 18px; font-weight: 600; margin: 0 0 25px 0;">
            Rejoignez l'abonnement Sagesse de Salomon dès maintenant
          </p>
          <a href="${subscriptionUrl}" style="display: inline-block; background: #FEBE02; color: #012F4E; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 20px; box-shadow: 0 4px 12px rgba(254, 190, 2, 0.4);">
            🚀 Commencer maintenant
          </a>
        </div>

        <!-- Contact -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Un besoin ? Une question ?</h3>
          <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
            Notre équipe vous accompagne personnellement.
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
            Rejoignez-nous dans cette nouvelle étape de votre parcours financier.
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
        <p style="margin: 5px 0 0 0;">
          <a href="${dashboardUrl}" style="color: #3b82f6; text-decoration: none;">Accéder à mon dashboard</a>
        </p>
      </div>
    </body>
    </html>
  `
}
