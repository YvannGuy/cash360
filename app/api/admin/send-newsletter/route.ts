import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'
import { generateNewsletterHtml } from '@/lib/newsletter-template'

/**
 * Route API pour envoyer la newsletter à tous les utilisateurs inscrits
 * POST /api/admin/send-newsletter
 * 
 * Body:
 * - preview: boolean (optionnel) - Si true, retourne juste un aperçu
 * - confirm: boolean (requis si preview=false) - Confirmation pour envoyer réellement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preview, confirm } = body

    // Pour la prévisualisation, on peut utiliser l'origin de la requête
    // Mais pour l'envoi réel, on utilise toujours le domaine de production
    const previewOrigin = request.headers.get('origin') || 'https://cash360.finance'
    const productionOrigin = 'https://cash360.finance'
    
    // Utiliser l'origin de production pour les emails réels, previewOrigin pour la prévisualisation
    const origin = preview ? previewOrigin : productionOrigin
    const newsletterHtml = generateNewsletterHtml(origin)
    const subject = 'Cash360 - Découvrez comment utiliser notre plateforme'

    // Si c'est juste une prévisualisation
    if (preview) {
      return NextResponse.json({
        success: true,
        preview: newsletterHtml,
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

    console.log('[NEWSLETTER] 📧 Récupération des utilisateurs...')

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
      // Filtrer uniquement les utilisateurs avec email valide et confirmé
      const validUsers = batch.filter(user => user.email && user.email_confirmed_at)
      allUsers.push(...validUsers)

      if (batch.length < MAX_PER_PAGE) {
        hasMore = false
      } else {
        page += 1
      }
    }

    console.log(`[NEWSLETTER] 📧 Préparation envoi à ${allUsers.length} utilisateurs`)

    // Envoyer les emails avec un délai pour éviter les limites de rate
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i]
      
      try {
        await sendMail({
          to: user.email!,
          subject: subject,
          html: newsletterHtml
        })

        results.success++
        
        // Afficher la progression tous les 10 emails
        if ((i + 1) % 10 === 0) {
          console.log(`[NEWSLETTER] ✅ ${i + 1}/${allUsers.length} emails envoyés...`)
        }
        
        // Délai de 1 seconde entre chaque email pour respecter les limites de rate
        if (i < allUsers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${user.email}: ${error.message}`)
        console.error(`[NEWSLETTER] ❌ Erreur pour ${user.email}:`, error)
      }
    }

    console.log(`[NEWSLETTER] ✅ Envoi terminé: ${results.success} succès, ${results.failed} échecs`)

    return NextResponse.json({
      success: true,
      message: `Newsletter envoyée: ${results.success} succès, ${results.failed} échecs`,
      stats: {
        total: allUsers.length,
        success: results.success,
        failed: results.failed
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 10) : [] // Limiter à 10 erreurs
    })

  } catch (error) {
    console.error('[NEWSLETTER] ❌ Erreur:', error)
    
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
