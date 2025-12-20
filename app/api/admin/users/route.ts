import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Types pour les segments
type UserSegment = 'active_30d' | 'paid_active' | 'new_7d' | 'inactive_30d' | 'all'
type PlanFilter = 'paid' | 'trial' | 'free' | 'past_due' | 'all'

// Core events pour calculer core_actions_30d
const CORE_EVENT_TYPES = new Set([
  'budget.saved',
  'budget.expense_added',
  'debt.payment_made',
  'debt.added',
  'fast.day_logged',
  'fast.started'
])

// Fonction de normalisation des pays (simplifiée depuis geo route)
function normalizeCountry(country: string | null | undefined): string {
  if (!country) return ''
  const normalized = country.trim()
  if (!normalized || normalized === '—' || normalized === '') return ''
  
  // Mapping exhaustif des variantes vers noms canoniques
  const countryMap: Record<string, string> = {
    // RDC
    'rdc': 'République démocratique du Congo',
    'congo-kinshasa': 'République démocratique du Congo',
    'congo (rdc)': 'République démocratique du Congo',
    'congo-k': 'République démocratique du Congo',
    'drc': 'République démocratique du Congo',
    'democratic republic of congo': 'République démocratique du Congo',
    'république démocratique du congo': 'République démocratique du Congo',
    
    // Côte d'Ivoire
    'côte d\'ivoire': 'Côte d\'Ivoire',
    'cote d\'ivoire': 'Côte d\'Ivoire',
    'côte d ivoire': 'Côte d\'Ivoire',
    'cote d ivoire': 'Côte d\'Ivoire',
    'ivory coast': 'Côte d\'Ivoire',
    'ci': 'Côte d\'Ivoire',
    
    // Congo (Brazzaville)
    'congo': 'Congo',
    'congo-brazzaville': 'Congo',
    'république du congo': 'Congo',
    'republic of congo': 'Congo',
    
    // Autres pays africains
    'burkina': 'Burkina Faso',
    'burkina faso': 'Burkina Faso',
    'cameroun': 'Cameroun',
    'cameroon': 'Cameroun',
    'senegal': 'Sénégal',
    'mali': 'Mali',
    'benin': 'Bénin',
    'bénin': 'Bénin',
    'togo': 'Togo',
    'niger': 'Niger',
    'guinee': 'Guinée',
    'guinée': 'Guinée',
    'guinea': 'Guinée',
    'gabon': 'Gabon',
    'tchad': 'Tchad',
    'chad': 'Tchad',
    'rca': 'République centrafricaine',
    'centrafrique': 'République centrafricaine',
    'central african republic': 'République centrafricaine',
    
    // Europe
    'france': 'France',
    'fr': 'France',
    'belgique': 'Belgique',
    'belgium': 'Belgique',
    'be': 'Belgique',
    'suisse': 'Suisse',
    'switzerland': 'Suisse',
    'ch': 'Suisse',
    
    // Amérique du Nord
    'canada': 'Canada',
    'ca': 'Canada',
    'usa': 'États-Unis',
    'united states': 'États-Unis',
    'us': 'États-Unis',
    'états-unis': 'États-Unis'
  }
  
  // Normaliser en lowercase AVANT de chercher dans le map
  let lower = normalized.toLowerCase().trim()
  lower = lower.replace(/\s+/g, ' ')
  lower = lower.replace(/[''`´]/g, "'")
  
  // Chercher dans le map
  const mapped = countryMap[lower]
  if (mapped) {
    return mapped
  }
  
  // Si pas trouvé, retourner la version originale avec première lettre en majuscule
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const segment = (searchParams.get('segment') || 'all') as UserSegment
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const q = searchParams.get('q') || '' // Recherche (email/nom)
    const plan = (searchParams.get('plan') || 'all') as PlanFilter
    const role = searchParams.get('role') || 'all'
    const country = searchParams.get('country') || ''
    const city = searchParams.get('city') || ''

    const offset = (page - 1) * limit

    // Dates pour les calculs
    const now = new Date()
    const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const day1Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const day30AgoISO = day30Ago.toISOString()
    const day7AgoISO = day7Ago.toISOString()
    const day1AgoISO = day1Ago.toISOString()
    
    // Log pour vérification des dates calculées
    console.log('[ADMIN USERS] Calcul des dates:', {
      now: now.toISOString(),
      nowLocal: now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      day30Ago: day30AgoISO,
      day30AgoLocal: day30Ago.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      day7Ago: day7AgoISO,
      day1Ago: day1AgoISO
    })

    // 1. Récupérer tous les utilisateurs avec pagination
    const MAX_PER_PAGE = 200
    const allUsersList: any[] = []
    let userPage = 1
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: userPage,
        perPage: MAX_PER_PAGE
      })

      if (error) {
        console.error('Erreur lors de la récupération des utilisateurs auth:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des utilisateurs' },
          { status: 500 }
        )
      }

      const batch = data?.users || []
      allUsersList.push(...batch)

      if (batch.length < MAX_PER_PAGE) {
        hasMore = false
      } else {
        userPage += 1
      }
    }

    // 2. Récupérer les abonnements
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, status, grace_until, current_period_end')

    if (subscriptionsError) {
      console.error('Erreur lors de la récupération des abonnements:', subscriptionsError)
    }

    const subscriptionMap = new Map<string, { status: string, grace_until?: string, current_period_end?: string }>()
    subscriptions?.forEach((sub: any) => {
      subscriptionMap.set(sub.user_id, {
        status: sub.status || 'inactive',
        grace_until: sub.grace_until,
        current_period_end: sub.current_period_end
      })
    })

    // 3. Récupérer les tracking events pour calculer last_seen, active_bucket, core_actions_30d, active_days_30d
    const { data: trackingEvents, error: trackingError } = await supabaseAdmin
      .from('tracking_events')
      .select('user_id, event_type, created_at')
      .gte('created_at', day30AgoISO)

    if (trackingError) {
      console.error('Erreur lors de la récupération des tracking events:', trackingError)
    }

    // Organiser les events par user_id
    const userEventsMap = new Map<string, Array<{ event_type: string, created_at: string }>>()
    trackingEvents?.forEach((event: any) => {
      if (event.user_id) {
        if (!userEventsMap.has(event.user_id)) {
          userEventsMap.set(event.user_id, [])
        }
        userEventsMap.get(event.user_id)!.push({
          event_type: event.event_type,
          created_at: event.created_at
        })
      }
    })

    // 4. Récupérer les analyses pour compter par utilisateur
    const { data: analysisEmails, error: analysisEmailsError } = await supabaseAdmin
      .from('analyses')
      .select('client_email, client_name, created_at')

    if (analysisEmailsError) {
      console.error('Erreur lors de la récupération des emails d\'analyses:', analysisEmailsError)
    }

    const analysisCountMap = new Map<string, number>()
    const nameMap = new Map<string, string>()
    
    analysisEmails?.forEach((analysis: any) => {
      const email = analysis.client_email
      analysisCountMap.set(email, (analysisCountMap.get(email) || 0) + 1)
      if (analysis.client_name) {
        nameMap.set(email, analysis.client_name)
      }
    })

    // 5. Enrichir les utilisateurs avec les métriques
    const enrichedUsers = allUsersList
      .filter(authUser => authUser.email)
      .map(authUser => {
        const userId = authUser.id
        const subscription = subscriptionMap.get(userId)
        const events = userEventsMap.get(userId) || []
        
        // Calculer last_seen = max(last_tracking_event, last_sign_in_at)
        const lastTrackingEvent = events.length > 0 
          ? new Date(Math.max(...events.map(e => new Date(e.created_at).getTime())))
          : null
        const lastSignIn = authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : null
        const lastSeen = lastTrackingEvent && lastSignIn
          ? (lastTrackingEvent > lastSignIn ? lastTrackingEvent : lastSignIn)
          : (lastTrackingEvent || lastSignIn)

        // Calculer active_bucket (24h/7j/30j/Inactive/Never active)
        let activeBucket: '24h' | '7d' | '30d' | 'inactive' | 'never_active' = 'never_active'
        if (lastSeen) {
          const diffMs = now.getTime() - lastSeen.getTime()
          const diffDays = diffMs / (1000 * 60 * 60 * 24)
          if (diffDays <= 1) {
            activeBucket = '24h'
          } else if (diffDays <= 7) {
            activeBucket = '7d'
          } else if (diffDays <= 30) {
            activeBucket = '30d'
          } else {
            activeBucket = 'inactive'
          }
        }

        // Calculer core_actions_30d et active_days_30d
        const events30d = events.filter(e => new Date(e.created_at) >= day30Ago)
        const coreActions30d = events30d.filter(e => CORE_EVENT_TYPES.has(e.event_type)).length
        const activeDays30d = new Set(
          events30d.map(e => new Date(e.created_at).toISOString().split('T')[0])
        ).size

        // Déterminer le plan
        let planType: 'paid' | 'trial' | 'free' | 'past_due' = 'free'
        if (subscription) {
          const subStatus = subscription.status
          if (subStatus === 'active' || subStatus === 'trialing') {
            planType = subStatus === 'trialing' ? 'trial' : 'paid'
          } else if (subStatus === 'past_due') {
            const graceUntil = subscription.grace_until ? new Date(subscription.grace_until) : null
            if (graceUntil && graceUntil > now) {
              planType = 'past_due'
            } else {
              planType = 'free'
            }
          } else {
            planType = 'free'
          }
        }

        const role = authUser.user_metadata?.role || 'user'
        const analysisCount = analysisCountMap.get(authUser.email || '') || 0
        const name = nameMap.get(authUser.email || '') || 
          (authUser.user_metadata?.first_name + ' ' + authUser.user_metadata?.last_name || '').trim() || 
          undefined

        const rawCountry = authUser.user_metadata?.country || ''
        const userCountry = normalizeCountry(rawCountry) || rawCountry
        const userCity = authUser.user_metadata?.city || ''

        return {
          id: userId,
          email: authUser.email,
          name,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          last_seen: lastSeen?.toISOString() || null,
          active_bucket: activeBucket,
          core_actions_30d: coreActions30d,
          active_days_30d: activeDays30d,
          plan: planType,
          role,
          analysis_count: analysisCount,
          verification_emails_sent: authUser.user_metadata?.verification_emails_sent ?? 
            (authUser.email_confirmed_at ? 0 : 1),
          user_metadata: authUser.user_metadata || {},
          country: userCountry,
          city: userCity
        }
      })

    // 6. Filtrer selon les critères
    const filteredUsers = enrichedUsers.filter(user => {
      // Recherche (email/nom)
      if (q) {
        const searchLower = q.toLowerCase()
        const matchesEmail = user.email?.toLowerCase().includes(searchLower)
        const matchesName = user.name?.toLowerCase().includes(searchLower)
        if (!matchesEmail && !matchesName) {
          return false
        }
      }

      // Filtre plan
      if (plan !== 'all' && user.plan !== plan) {
        return false
      }

      // Filtre rôle
      if (role !== 'all' && user.role !== role) {
        return false
      }

      // Filtre pays (normaliser les deux pour la comparaison)
      if (country) {
        const normalizedUserCountry = normalizeCountry(user.country)
        const normalizedFilterCountry = normalizeCountry(country)
        if (normalizedUserCountry.toLowerCase() !== normalizedFilterCountry.toLowerCase()) {
          return false
        }
      }

      // Filtre ville
      if (city && user.city?.toLowerCase() !== city.toLowerCase()) {
        return false
      }

      // Filtre segment
      if (segment === 'active_30d') {
        // Actifs 30j = au moins 1 event dans les 30 derniers jours
        const hasActivity30d = user.last_seen && new Date(user.last_seen) >= day30Ago
        if (!hasActivity30d) return false
      } else if (segment === 'paid_active') {
        // Abonnés actifs = plan paid/trial/past_due ET actif 30j
        const isPaid = ['paid', 'trial', 'past_due'].includes(user.plan)
        const hasActivity30d = user.last_seen && new Date(user.last_seen) >= day30Ago
        if (!isPaid || !hasActivity30d) return false
      } else if (segment === 'new_7d') {
        // Nouveaux 7j = créés dans les 7 derniers jours
        const createdDate = new Date(user.created_at)
        if (createdDate < day7Ago) return false
      } else if (segment === 'inactive_30d') {
        // Inactifs 30j+ = pas d'activité depuis 30j+ OU jamais actif
        if (user.last_seen) {
          const lastSeenDate = new Date(user.last_seen)
          if (lastSeenDate >= day30Ago) return false // Actif dans les 30j
        }
        // Si jamais actif, c'est inactif
      }

      return true
    })

    // 7. Trier selon le segment
    filteredUsers.sort((a, b) => {
      if (segment === 'active_30d' || segment === 'paid_active') {
        // Tri: paid d'abord, puis last_seen desc, puis core_actions_30d desc
        const aIsPaid = ['paid', 'trial', 'past_due'].includes(a.plan)
        const bIsPaid = ['paid', 'trial', 'past_due'].includes(b.plan)
        if (aIsPaid !== bIsPaid) {
          return aIsPaid ? -1 : 1
        }
        const aLastSeen = a.last_seen ? new Date(a.last_seen).getTime() : 0
        const bLastSeen = b.last_seen ? new Date(b.last_seen).getTime() : 0
        if (aLastSeen !== bLastSeen) {
          return bLastSeen - aLastSeen
        }
        return (b.core_actions_30d || 0) - (a.core_actions_30d || 0)
      } else if (segment === 'inactive_30d') {
        // Tri: paid d'abord, puis last_seen asc (plus ancien en premier)
        const aIsPaid = ['paid', 'trial', 'past_due'].includes(a.plan)
        const bIsPaid = ['paid', 'trial', 'past_due'].includes(b.plan)
        if (aIsPaid !== bIsPaid) {
          return aIsPaid ? -1 : 1
        }
        const aLastSeen = a.last_seen ? new Date(a.last_seen).getTime() : 0
        const bLastSeen = b.last_seen ? new Date(b.last_seen).getTime() : 0
        return aLastSeen - bLastSeen
      } else if (segment === 'new_7d') {
        // Tri: créés récemment d'abord
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        // Par défaut: tri par date de création (plus récent en premier)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    // 8. Pagination
    const total = filteredUsers.length
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    // Si le paramètre "filters" est présent, retourner uniquement les options de filtres
    if (searchParams.get('filters') === 'true') {
      // Récupérer tous les pays et villes uniques depuis TOUS les utilisateurs enrichis (avant filtrage)
      const countriesSet = new Set<string>()
      const citiesSet = new Set<string>()
      
      // Utiliser enrichedUsers AVANT le filtrage pour avoir toutes les options
      enrichedUsers.forEach(user => {
        // Normaliser le pays avant de l'ajouter pour éviter les doublons
        if (user.country && user.country.trim()) {
          const normalized = normalizeCountry(user.country)
          if (normalized) {
            countriesSet.add(normalized)
          }
        }
        if (user.city && user.city.trim()) {
          citiesSet.add(user.city.trim())
        }
      })
      
      const countries = Array.from(countriesSet).sort()
      const cities = Array.from(citiesSet).sort()
      
      return NextResponse.json({
        success: true,
        filters: {
          countries,
          cities
        }
      })
    }

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erreur API users:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'ID utilisateur et rôle requis' },
        { status: 400 }
      )
    }

    if (!['user', 'admin', 'commercial'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Les rôles valides sont: user, admin, commercial' },
        { status: 400 }
      )
    }

    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError || !userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const currentMetadata = userData.user.user_metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      role: role
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: updatedMetadata }
    )

    if (updateError) {
      console.error('Erreur lors de la mise à jour du rôle:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du rôle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        role: role
      }
    })

  } catch (error) {
    console.error('Erreur API update user role:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== Début suppression utilisateur ===')
    
    if (!supabaseAdmin) {
      console.error('Configuration Supabase manquante')
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      console.error('ID utilisateur manquant')
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 400 }
      )
    }

    console.log('Suppression de l\'utilisateur:', userId)

    const { data: userAnalyses, error: fetchError } = await supabaseAdmin
      .from('analyses')
      .select('pdf_url')
      .or(`user_id.eq.${userId},client_email.eq.${userId}`)

    if (fetchError) {
      console.warn('Erreur lors de la récupération des analyses utilisateur:', fetchError)
    }

    if (userAnalyses && userAnalyses.length > 0) {
      for (const analysis of userAnalyses) {
        if (analysis.pdf_url) {
          try {
            const url = new URL(analysis.pdf_url)
            const pathParts = url.pathname.split('/')
            const fileName = pathParts[pathParts.length - 1]
            
            if (fileName) {
              console.log('Suppression du PDF utilisateur:', fileName)
              await supabaseAdmin.storage
                .from('analyses')
                .remove([`analyses/${fileName}`])
            }
          } catch (error) {
            console.warn('Erreur lors de la suppression du fichier PDF:', error)
          }
        }
      }
    }

    const { error: deleteAnalysesError } = await supabaseAdmin
      .from('analyses')
      .delete()
      .or(`user_id.eq.${userId},client_email.eq.${userId}`)

    if (deleteAnalysesError) {
      console.warn('Erreur lors de la suppression des analyses utilisateur:', deleteAnalysesError)
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', deleteUserError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'utilisateur' },
        { status: 500 }
      )
    }

    console.log('Utilisateur supprimé avec succès:', userId)

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
      deletedUserId: userId
    })

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
