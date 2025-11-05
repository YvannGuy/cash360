import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET: Récupérer les commandes de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
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

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les commandes de l'utilisateur
    console.log('[API/ORDERS] Récupération commandes pour user_id:', user.id, 'email:', user.email)
    
    // Récupérer les commandes avec user_id correspondant
    const { data: ordersByUserId, error: ordersByUserIdError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (ordersByUserIdError) {
      console.error('[API/ORDERS] ❌ Erreur récupération commandes:', ordersByUserIdError)
      console.error('[API/ORDERS] Détails erreur:', JSON.stringify(ordersByUserIdError, null, 2))
      return NextResponse.json(
        { error: ordersByUserIdError.message },
        { status: 500 }
      )
    }

    const orders = ordersByUserId || []
    console.log('[API/ORDERS] Commandes trouvées:', orders.length)
    
    if (orders.length === 0) {
      // Vérifier si des commandes existent avec user_id null (pour debug)
      const { data: allOrdersCheck, error: checkError } = await supabase
        .from('orders')
        .select('id, user_id, product_id, status, created_at')
        .is('user_id', null)
        .limit(5)
      
      if (!checkError && allOrdersCheck && allOrdersCheck.length > 0) {
        console.log('[API/ORDERS] ⚠️ Des commandes avec user_id null existent:', allOrdersCheck.length)
      }
      
      // Vérifier aussi toutes les commandes de l'utilisateur (sans filtre RLS)
      // On ne peut pas faire ça avec l'anon key à cause de RLS, mais on peut logger
      console.log('[API/ORDERS] ⚠️ Aucune commande trouvée pour user_id:', user.id)
      console.log('[API/ORDERS] Vérifiez dans Supabase Dashboard si des commandes existent pour ce user_id')
    }
    
    console.log('[API/ORDERS] Commandes retournées:', orders.map((o: any) => ({ id: o.id, product_id: o.product_id, status: o.status, user_id: o.user_id })))
    
    return NextResponse.json({
      success: true,
      orders: orders
    })

  } catch (error) {
    console.error('Erreur API orders:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

