import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Route API pour récupérer les items du carrousel pour les utilisateurs
 * GET /api/carousel
 * 
 * Retourne uniquement les items ebook et masterclass pour les utilisateurs avec abonnement
 * Exclut les items correspondant aux produits déjà achetés par l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Récupérer l'utilisateur authentifié
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Ignore
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Liste des produits achetés par l'utilisateur (pour filtrer le carrousel)
    let purchasedProductIds: string[] = []
    let purchasedProductCategories: string[] = []

    if (!authError && user) {
      try {
        // Récupérer les produits achetés depuis user_capsules
        const { data: userCapsules } = await supabase
          .from('user_capsules')
          .select('capsule_id')
          .eq('user_id', user.id)

        if (userCapsules) {
          purchasedProductIds = userCapsules.map((uc: any) => uc.capsule_id).filter(Boolean)
        }

        // Récupérer les commandes payées depuis orders
        const { data: orders } = await supabase
          .from('orders')
          .select('product_id')
          .eq('user_id', user.id)
          .in('status', ['paid', 'pending_review'])

        if (orders) {
          const orderProductIds = orders.map((o: any) => o.product_id).filter(Boolean)
          purchasedProductIds = [...new Set([...purchasedProductIds, ...orderProductIds])]
        }

        // Récupérer les catégories des produits achetés depuis la table products
        if (purchasedProductIds.length > 0) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

          if (supabaseUrl && serviceKey) {
            try {
              // Utiliser l'API REST pour récupérer les produits
              // PostgREST utilise la syntaxe "id=in.(id1,id2,id3)" pour plusieurs valeurs
              const productIdsList = purchasedProductIds.map(id => encodeURIComponent(id)).join(',')
              const productsResponse = await fetch(`${supabaseUrl}/rest/v1/products?select=id,category&id=in.(${productIdsList})`, {
                headers: {
                  'apikey': serviceKey,
                  'Authorization': `Bearer ${serviceKey}`,
                  'Content-Type': 'application/json'
                }
              })

              if (productsResponse.ok) {
                const purchasedProducts = await productsResponse.json()
                purchasedProductCategories = Array.isArray(purchasedProducts) 
                  ? purchasedProducts
                      .map((p: any) => p.category)
                      .filter(Boolean)
                      .filter((cat: string) => ['ebook', 'masterclass', 'abonnement'].includes(cat))
                  : []
              }
            } catch (error) {
              console.error('[CAROUSEL USER] Erreur lors de la récupération des produits:', error)
            }
          }
        }
      } catch (error) {
        console.error('[CAROUSEL USER] Erreur lors de la récupération des produits achetés:', error)
        // Continuer même en cas d'erreur
      }
    }

    // Utiliser l'API REST directement pour contourner le cache PostgREST
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      // Retourner les items par défaut si la configuration est incomplète
      return NextResponse.json({
        success: true,
        items: [
          {
            id: 'user-ebook',
            image_url: '/images/ebo.png',
            redirect_url: '/dashboard?tab=boutique&category=ebook',
            title: 'Ebook',
            display_order: 1,
            is_active: true
          },
          {
            id: 'user-masterclass',
            image_url: '/images/masterclass.jpg',
            redirect_url: '/dashboard?tab=boutique&category=masterclass',
            title: 'Masterclass',
            display_order: 2,
            is_active: true
          }
        ]
      })
    }

    let items: any[] = []

    try {
      // Essayer d'abord via l'API REST directement
      const response = await fetch(`${supabaseUrl}/rest/v1/carousel_items?is_active=eq.true&order=display_order.asc`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      })

      if (response.ok) {
        items = await response.json()
      } else {
        // En cas d'erreur (404, cache, etc.), utiliser les items par défaut
        console.log('[CAROUSEL USER] Erreur REST, utilisation des items par défaut')
        items = []
      }
    } catch (fetchError) {
      console.error('[CAROUSEL USER] Erreur fetch:', fetchError)
      items = []
    }

    // Filtrer pour ne garder que ebook et masterclass
    // On identifie ces items par leur image_url ou leur title
    // ET exclure ceux correspondant aux produits déjà achetés
    const filteredItems = (items || []).filter((item: any) => {
      const imageUrl = item.image_url?.toLowerCase() || ''
      const title = item.title?.toLowerCase() || ''
      const redirectUrl = item.redirect_url?.toLowerCase() || ''
      
      // Vérifier si c'est un ebook, masterclass ou coaching
      const isEbook = imageUrl.includes('ebo') ||
                      imageUrl.includes('ebook') ||
                      title.includes('ebook') ||
                      redirectUrl.includes('ebook')
      
      const isMasterclass = imageUrl.includes('masterclass') ||
                           title.includes('masterclass') ||
                           redirectUrl.includes('masterclass')
      
      const isCoaching = imageUrl.includes('coach') ||
                        title.includes('coaching') ||
                        redirectUrl.includes('coaching')
      
      const isAbonnement = imageUrl.includes('abon') ||
                          title.includes('abonnement') ||
                          redirectUrl.includes('abonnement')
      
      // Exclure l'abonnement du carrousel utilisateur (déjà fait)
      if (isAbonnement) {
        return false
      }
      
      // Vérifier si l'item correspond à un produit déjà acheté
      if (user && (purchasedProductCategories.length > 0 || purchasedProductIds.length > 0)) {
        // Vérifier par catégorie (si l'utilisateur a acheté un produit de cette catégorie)
        if (isEbook && purchasedProductCategories.includes('ebook')) {
          return false // L'utilisateur a déjà acheté un ebook
        }
        if (isMasterclass && purchasedProductCategories.includes('masterclass')) {
          return false // L'utilisateur a déjà acheté une masterclass
        }
        if (isCoaching && purchasedProductCategories.includes('coaching')) {
          return false // L'utilisateur a déjà acheté un coaching
        }
        
        // Vérifier aussi par product_id si on peut faire la correspondance
        // Chercher dans les IDs achetés pour voir si un produit correspond
        for (const productId of purchasedProductIds) {
          const productIdLower = productId.toLowerCase()
          // Si l'image_url, le title ou le redirect_url contient l'ID du produit acheté
          if (imageUrl.includes(productIdLower) || 
              title.includes(productIdLower) || 
              redirectUrl.includes(productIdLower)) {
            return false
          }
        }
        
        // Vérification supplémentaire : si l'image correspond à un produit acheté
        // Par exemple, si l'image est '/images/ebo.png' et que l'utilisateur a acheté un produit avec category='ebook'
        // On peut aussi vérifier par correspondance d'image
        if (isEbook && purchasedProductCategories.includes('ebook')) {
          return false
        }
        if (isMasterclass && purchasedProductCategories.includes('masterclass')) {
          return false
        }
        if (isCoaching && purchasedProductCategories.includes('coaching')) {
          return false
        }
      }
      
      // Retourner true seulement si c'est ebook, masterclass ou coaching et non acheté
      return isEbook || isMasterclass || isCoaching
    })

    // Si aucun item trouvé, retourner les items par défaut (filtrés par produits achetés)
    if (filteredItems.length === 0) {
      const defaultItems = [
        {
          id: 'user-ebook',
          image_url: '/images/ebo.png',
          redirect_url: '/dashboard?tab=boutique&category=ebook',
          title: 'Ebook',
          display_order: 1,
          is_active: true
        },
        {
          id: 'user-masterclass',
          image_url: '/images/masterclass.jpg',
          redirect_url: '/dashboard?tab=boutique&category=masterclass',
          title: 'Masterclass',
          display_order: 2,
          is_active: true
        },
        {
          id: 'user-coaching',
          image_url: '/images/coach.png',
          redirect_url: '/dashboard?tab=boutique&category=coaching',
          title: 'Coaching',
          display_order: 3,
          is_active: true
        }
      ]

      // Filtrer les items par défaut selon les produits achetés
      const filteredDefaultItems = defaultItems.filter((item: any) => {
        if (!user || purchasedProductCategories.length === 0) {
          return true // Afficher tous les items par défaut si pas d'utilisateur ou pas d'achats
        }
        
        const isEbook = item.image_url?.includes('ebo') || item.title?.toLowerCase().includes('ebook')
        const isMasterclass = item.image_url?.includes('masterclass') || item.title?.toLowerCase().includes('masterclass')
        const isCoaching = item.image_url?.includes('coach') || item.title?.toLowerCase().includes('coaching')
        
        // Exclure si l'utilisateur a déjà acheté un produit de cette catégorie
        if (isEbook && purchasedProductCategories.includes('ebook')) {
          return false
        }
        if (isMasterclass && purchasedProductCategories.includes('masterclass')) {
          return false
        }
        if (isCoaching && purchasedProductCategories.includes('coaching')) {
          return false
        }
        
        return true
      })

      return NextResponse.json({
        success: true,
        items: filteredDefaultItems
      })
    }

    // Mapper les URLs de redirection pour qu'elles pointent vers le dashboard utilisateur avec la bonne catégorie
    const mappedItems = filteredItems.map((item: any) => {
      let redirectUrl = '/dashboard?tab=boutique'
      
      // Convertir les URLs admin vers les URLs utilisateur
      if (item.redirect_url?.includes('/admin/boutique')) {
        // Extraire la catégorie de l'URL admin si présente
        const urlParams = new URLSearchParams(item.redirect_url.split('?')[1] || '')
        const category = urlParams.get('category') || urlParams.get('tab')
        if (category) {
          redirectUrl = `/dashboard?tab=boutique&category=${category}`
        }
      } else {
        // Déterminer la catégorie basée sur l'image ou le titre
        if (item.image_url?.includes('ebo') || item.title?.toLowerCase().includes('ebook')) {
          redirectUrl = '/dashboard?tab=boutique&category=ebook'
        } else if (item.image_url?.includes('masterclass') || item.title?.toLowerCase().includes('masterclass')) {
          redirectUrl = '/dashboard?tab=boutique&category=masterclass'
        } else if (item.image_url?.includes('coach') || item.title?.toLowerCase().includes('coaching')) {
          redirectUrl = '/dashboard?tab=boutique&category=coaching'
        } else if (item.image_url?.includes('abon') || item.title?.toLowerCase().includes('abonnement')) {
          redirectUrl = '/dashboard?tab=boutique&category=abonnement'
        }
      }
      
      return {
        ...item,
        redirect_url: redirectUrl
      }
    })

    return NextResponse.json({
      success: true,
      items: mappedItems
    })

  } catch (error: any) {
    console.error('[CAROUSEL USER] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
