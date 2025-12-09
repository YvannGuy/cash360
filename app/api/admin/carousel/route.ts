import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Fonction ensureTableExists supprimée car la table est créée via migration SQL

// GET: Récupérer tous les items du carrousel
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Utiliser l'API REST directement pour contourner le cache PostgREST
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase incomplète' },
        { status: 500 }
      )
    }

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
        const items = await response.json()
        return NextResponse.json({
          success: true,
          items: items || []
        })
      } else if (response.status === 404 || response.status === 400) {
        // Table non trouvée ou erreur de cache, essayer via SQL direct
        console.log('[CAROUSEL] Table non accessible via REST, tentative via SQL direct...')
        try {
          // Utiliser une fonction RPC pour récupérer les items directement depuis la base
          let sqlItems = null
          let sqlError = null
          try {
            const rpcResult = await supabaseAdmin.rpc('get_carousel_items')
            sqlItems = rpcResult.data
            sqlError = rpcResult.error
          } catch {
            sqlError = { message: 'RPC function not available' }
          }

          if (!sqlError && sqlItems) {
            return NextResponse.json({
              success: true,
              items: Array.isArray(sqlItems) ? sqlItems : []
            })
          }

          // Si RPC n'est pas disponible, utiliser une requête SQL directe via fetch
          const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_carousel_items`, {
            method: 'POST',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          }).catch(() => null)

          if (sqlResponse && sqlResponse.ok) {
            const sqlData = await sqlResponse.json()
            return NextResponse.json({
              success: true,
              items: Array.isArray(sqlData) ? sqlData : []
            })
          }

          // Dernier recours : retourner les items par défaut (incluant le coaching)
          console.log('[CAROUSEL] Impossible de récupérer via SQL, utilisation des items par défaut')
          return NextResponse.json({
            success: true,
            items: [
              {
                id: 'default-1',
                image_url: '/images/masterclass.jpg',
                redirect_url: '/admin/boutique?category=masterclass',
                title: 'Masterclass',
                display_order: 1,
                is_active: true
              },
              {
                id: 'default-2',
                image_url: '/images/ebo.png',
                redirect_url: '/admin/boutique?category=ebook',
                title: 'Ebook',
                display_order: 2,
                is_active: true
              },
              {
                id: 'default-3',
                image_url: '/images/abon.png',
                redirect_url: '/admin/boutique?category=abonnement',
                title: 'Abonnement',
                display_order: 3,
                is_active: true
              },
              {
                id: 'default-4',
                image_url: '/images/coach.png',
                redirect_url: '/admin/boutique?category=coaching',
                title: 'Coaching Professionnel',
                display_order: 4,
                is_active: true
              }
            ]
          })
        } catch (fallbackError) {
          console.error('[CAROUSEL] Erreur fallback SQL:', fallbackError)
          // Retourner les items par défaut incluant le coaching
          return NextResponse.json({
            success: true,
            items: [
              {
                id: 'default-1',
                image_url: '/images/masterclass.jpg',
                redirect_url: '/admin/boutique?category=masterclass',
                title: 'Masterclass',
                display_order: 1,
                is_active: true
              },
              {
                id: 'default-2',
                image_url: '/images/ebo.png',
                redirect_url: '/admin/boutique?category=ebook',
                title: 'Ebook',
                display_order: 2,
                is_active: true
              },
              {
                id: 'default-3',
                image_url: '/images/abon.png',
                redirect_url: '/admin/boutique?category=abonnement',
                title: 'Abonnement',
                display_order: 3,
                is_active: true
              },
              {
                id: 'default-4',
                image_url: '/images/coach.png',
                redirect_url: '/admin/boutique?category=coaching',
                title: 'Coaching Professionnel',
                display_order: 4,
                is_active: true
              }
            ]
          })
        }
      } else {
        const errorText = await response.text()
        console.error('[CAROUSEL] Erreur REST:', response.status, errorText)
        return NextResponse.json(
          { error: `Erreur ${response.status}: ${errorText}` },
          { status: response.status }
        )
      }
    } catch (fetchError: any) {
      console.error('[CAROUSEL] Erreur fetch:', fetchError)
      // En cas d'erreur, retourner les items par défaut
      return NextResponse.json({
        success: true,
        items: [
          {
            id: 'default-1',
            image_url: '/images/masterclass.jpg',
            redirect_url: '/admin/boutique?tab=masterclass',
            title: 'Masterclass',
            display_order: 1,
            is_active: true
          },
          {
            id: 'default-2',
            image_url: '/images/ebo.png',
            redirect_url: '/admin/boutique?tab=ebook',
            title: 'Ebook',
            display_order: 2,
            is_active: true
          },
          {
            id: 'default-3',
            image_url: '/images/abon.png',
            redirect_url: '/admin/boutique?tab=abonnement',
            title: 'Abonnement',
            display_order: 3,
            is_active: true
          }
        ]
      })
    }

  } catch (error: any) {
    console.error('[CAROUSEL] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer un nouvel item
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { image_url, redirect_url, title, display_order, is_active } = body

    if (!image_url || !redirect_url) {
      return NextResponse.json(
        { error: 'image_url et redirect_url sont requis' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase incomplète' },
        { status: 500 }
      )
    }

    // Utiliser l'API REST directement
    const response = await fetch(`${supabaseUrl}/rest/v1/carousel_items`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        image_url,
        redirect_url,
        title: title || null,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true
      })
    })

    // Si erreur 404 (table non trouvée dans le cache), essayer via fonction RPC
    if (!response.ok && response.status === 404) {
      console.log('[CAROUSEL] Erreur 404, tentative via fonction RPC insert_carousel_item...')
      try {
        // Utiliser la fonction PostgreSQL insert_carousel_item avec paramètre JSON (compatible PostgREST)
        const rpcPayload = {
          p_image_url: image_url,
          p_redirect_url: redirect_url,
          p_title: title || null,
          p_display_order: display_order || 0,
          p_is_active: is_active !== undefined ? is_active : true
        }

        // Essayer d'abord via API REST RPC (plus fiable pour les nouvelles fonctions)
        const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/insert_carousel_item`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(rpcPayload)
        })

        if (rpcResponse.ok) {
          const rpcResult = await rpcResponse.json()
          const item = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult
          return NextResponse.json({
            success: true,
            item: item
          })
        }

        // Si l'API REST RPC échoue, essayer via le client Supabase admin
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('insert_carousel_item', rpcPayload)

        if (rpcError) {
          console.error('[CAROUSEL] Erreur RPC insert_carousel_item:', rpcError)
          throw rpcError
        }

        return NextResponse.json({
          success: true,
          item: Array.isArray(rpcData) ? rpcData[0] : rpcData
        })
      } catch (fallbackError: any) {
        console.error('[CAROUSEL] Erreur fallback:', fallbackError)
        const errorText = await response.text().catch(() => '')
        return NextResponse.json(
          { 
            error: `Le cache PostgREST n'a pas encore été rafraîchi. La table et la fonction existent mais ne sont pas encore visibles. Solutions: 1) Attendre 2-3 minutes et réessayer, 2) Redémarrer PostgREST depuis le dashboard Supabase (Settings > API > Restart PostgREST), 3) Contacter le support si le problème persiste. Détails: ${errorText || fallbackError.message}` 
          },
          { status: 500 }
        )
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CAROUSEL] Erreur lors de la création:', response.status, errorText)
      return NextResponse.json(
        { error: `Erreur ${response.status}: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const item = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success: true,
      item: item
    })

  } catch (error: any) {
    console.error('[CAROUSEL] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT: Mettre à jour un item
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { id, image_url, redirect_url, title, display_order, is_active } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id est requis' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase incomplète' },
        { status: 500 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (image_url !== undefined) updateData.image_url = image_url
    if (redirect_url !== undefined) updateData.redirect_url = redirect_url
    if (title !== undefined) updateData.title = title
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active

    // Utiliser l'API REST directement
    const response = await fetch(`${supabaseUrl}/rest/v1/carousel_items?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CAROUSEL] Erreur lors de la mise à jour:', response.status, errorText)
      return NextResponse.json(
        { error: `Erreur ${response.status}: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const item = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success: true,
      item: item
    })

  } catch (error: any) {
    console.error('[CAROUSEL] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer un item
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id est requis' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase incomplète' },
        { status: 500 }
      )
    }

    // Utiliser l'API REST directement
    const response = await fetch(`${supabaseUrl}/rest/v1/carousel_items?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CAROUSEL] Erreur lors de la suppression:', response.status, errorText)
      return NextResponse.json(
        { error: `Erreur ${response.status}: ${errorText}` },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Item supprimé avec succès'
    })

  } catch (error: any) {
    console.error('[CAROUSEL] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
