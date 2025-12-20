import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Récupérer tous les utilisateurs avec pagination
    const MAX_PER_PAGE = 200
    const allUsersList: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: MAX_PER_PAGE
      })

      if (usersError) {
        console.error('[ANALYTICS API] Erreur récupération utilisateurs:', usersError)
        break
      }

      if (usersData?.users) {
        allUsersList.push(...usersData.users)
      }

      if (!usersData?.users || usersData.users.length < MAX_PER_PAGE) {
        hasMore = false
      } else {
        page += 1
      }
    }

    // Récupérer les analyses
    const { data: analyses } = await supabaseAdmin
      .from('analyses')
      .select('client_email, client_name, created_at, city, country')

    // Récupérer les abonnements actifs
    const { data: subscriptions } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, status, created_at, plan_id')
      .eq('status', 'active')

    // Récupérer les paiements
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('user_id, amount, created_at, payment_type, product_id')

    // Récupérer les produits
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, category')

    // Récupérer les capsules achetées/utilisées
    const { data: capsules } = await supabaseAdmin
      .from('user_capsules')
      .select('user_id, capsule_id, purchased_at, accessed_at')

    // Récupérer les formations pour avoir les noms des capsules
    const { data: formations } = await supabaseAdmin
      .from('formations')
      .select('capsule_id, session_name')

    // Créer une map des noms de capsules
    const capsuleNameMap = new Map<string, string>()
    const capsuleNames: { [key: string]: string } = {
      'capsule1': "L'éducation financière",
      'capsule2': 'La mentalité de pauvreté',
      'capsule3': "Les lois spirituelles liées à l'argent",
      'capsule4': 'Les combats liés à la prospérité',
      'capsule5': 'Épargne et Investissement'
    }
    
    formations?.forEach((formation: any) => {
      if (formation.capsule_id && formation.session_name) {
        capsuleNameMap.set(formation.capsule_id, formation.session_name)
      }
    })
    
    // Ajouter les noms par défaut
    Object.entries(capsuleNames).forEach(([id, name]) => {
      if (!capsuleNameMap.has(id)) {
        capsuleNameMap.set(id, name)
      }
    })

    // Créer une map des utilisateurs
    const userMap = new Map<string, any>()
    allUsersList.forEach((user) => {
      const firstName = user.user_metadata?.first_name || ''
      const lastName = user.user_metadata?.last_name || ''
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
      const name = fullName || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur'
      
      userMap.set(user.id, {
        id: user.id,
        email: user.email || '',
        name: name,
        city: user.user_metadata?.city || '',
        country: user.user_metadata?.country || '',
        profession: user.user_metadata?.profession || '',
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at
      })
    })

    // Statistiques par pays
    const countryStats = new Map<string, number>()
    const cityStats = new Map<string, number>()
    const professionStats = new Map<string, number>()

    allUsersList.forEach((user) => {
      const country = user.user_metadata?.country || 'Non renseigné'
      const city = user.user_metadata?.city || 'Non renseigné'
      const profession = user.user_metadata?.profession || 'Non renseigné'

      countryStats.set(country, (countryStats.get(country) || 0) + 1)
      cityStats.set(city, (cityStats.get(city) || 0) + 1)
      professionStats.set(profession, (professionStats.get(profession) || 0) + 1)
    })

    // Top pays
    const topCountries = Array.from(countryStats.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top villes
    const topCities = Array.from(cityStats.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top professions
    const topProfessions = Array.from(professionStats.entries())
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Produits les plus consultés/achetés
    const productStats = new Map<string, { name: string, count: number, revenue: number }>()
    
    payments?.forEach((payment: any) => {
      const productId = payment.product_id || 'unknown'
      const product = products?.find((p: any) => p.id === productId)
      const productName = product?.name || productId
      
      const current = productStats.get(productId) || { name: productName, count: 0, revenue: 0 }
      productStats.set(productId, {
        name: productName,
        count: current.count + 1,
        revenue: current.revenue + (payment.amount || 0)
      })
    })

    const topProducts = Array.from(productStats.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Outils de l'abonnement utilisés (capsules)
    const capsuleUsage = new Map<string, { id: string, name: string, count: number }>()
    capsules?.forEach((capsule: any) => {
      if (capsule.accessed_at) {
        const capsuleId = capsule.capsule_id || 'unknown'
        const capsuleName = capsuleNameMap.get(capsuleId) || `Capsule ${capsuleId}`
        const current = capsuleUsage.get(capsuleId) || { id: capsuleId, name: capsuleName, count: 0 }
        capsuleUsage.set(capsuleId, {
          ...current,
          count: current.count + 1
        })
      }
    })

    const topCapsules = Array.from(capsuleUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Utilisateurs avec abonnements actifs et leurs outils utilisés
    const activeSubscribers = subscriptions?.map((sub: any) => {
      const user = userMap.get(sub.user_id)
      const userCapsules = capsules?.filter((c: any) => c.user_id === sub.user_id) || []
      const accessedCapsules = userCapsules.filter((c: any) => c.accessed_at).length
      
      return {
        user_id: sub.user_id,
        user_name: user?.name || 'Utilisateur inconnu',
        user_email: user?.email || '',
        city: user?.city || '',
        country: user?.country || '',
        subscription_start: sub.created_at,
        plan_id: sub.plan_id,
        capsules_accessed: accessedCapsules,
        total_capsules: userCapsules.length
      }
    }) || []

    // Temps passé sur le dashboard (approximation basée sur last_sign_in_at)
    // Note: Pour un vrai tracking, il faudrait une table de logs d'activité
    const usersWithActivity = allUsersList
      .filter((user) => user.last_sign_in_at)
      .map((user) => {
        const userData = userMap.get(user.id)
        return {
          user_id: user.id,
          user_name: userData?.name || 'Utilisateur inconnu',
          user_email: userData?.email || '',
          last_activity: user.last_sign_in_at,
          city: userData?.city || '',
          country: userData?.country || ''
        }
      })
      .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())
      .slice(0, 20)

    return NextResponse.json({
      success: true,
      analytics: {
        topCountries,
        topCities,
        topProfessions,
        topProducts,
        topCapsules,
        activeSubscribers,
        usersWithActivity,
        totalUsers: allUsersList.length,
        totalAnalyses: analyses?.length || 0,
        totalActiveSubscriptions: subscriptions?.length || 0,
        totalPayments: payments?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Erreur API admin analytics:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

