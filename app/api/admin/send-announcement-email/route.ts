import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'
import { generateEmailHtml } from '@/lib/email-templates'

// POST: Prévisualiser ou envoyer le mail
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preview, confirm, templateId, subject, body: emailBody } = body

    // Validation
    if (!subject || !emailBody) {
      return NextResponse.json(
        { error: 'Le sujet et le corps du mail sont requis' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || 'https://cash360.finance'
    const templateIdNum = templateId || 1
    const emailHtml = generateEmailHtml(templateIdNum, subject, emailBody, origin)

    // Si c'est juste une prévisualisation
    if (preview) {
      return NextResponse.json({
        success: true,
        preview: emailHtml,
        subject: subject
      })
    }

    // Sinon, c'est un envoi réel
    if (!confirm) {
      return NextResponse.json(
        { error: 'Confirmation requise pour envoyer les emails' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
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

    console.log(`[NEWSLETTER-EMAIL] 📧 Préparation envoi à ${allUsers.length} utilisateurs`)

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
        let personalizedHtml = emailHtml
        if (firstName) {
          // Remplacer "Bonjour" ou "Cher utilisateur" par le prénom
          personalizedHtml = personalizedHtml.replace(
            /Bonjour\s+<strong>.*?<\/strong>/g,
            `Bonjour <strong>${firstName}${lastName ? ' ' + lastName : ''}</strong>`
          )
          personalizedHtml = personalizedHtml.replace(
            /Bonjour\s+Cher utilisateur/g,
            `Bonjour ${firstName}${lastName ? ' ' + lastName : ''}`
          )
          personalizedHtml = personalizedHtml.replace(
            /Cher utilisateur/g,
            `${firstName}${lastName ? ' ' + lastName : ''}`
          )
        }

        await sendMail({
          to: user.email!,
          subject: subject,
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
        console.error(`[NEWSLETTER-EMAIL] ❌ Erreur pour ${user.email}:`, error)
      }
    }

    console.log(`[NEWSLETTER-EMAIL] ✅ Envoi terminé: ${results.success} succès, ${results.failed} échecs`)

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
    console.error('[NEWSLETTER-EMAIL] ❌ Erreur:', error)
    
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
