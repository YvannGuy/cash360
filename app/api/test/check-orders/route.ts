import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Non authentifié',
        user: null
      })
    }

    // Récupérer toutes les commandes avec l'admin client (bypass RLS)
    const { data: allOrders, error: allOrdersError } = await supabaseAdmin!
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    // Récupérer les commandes de cet utilisateur
    const { data: userOrders, error: userOrdersError } = await supabaseAdmin!
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Récupérer les commandes avec user_id null
    const { data: nullOrders, error: nullOrdersError } = await supabaseAdmin!
      .from('orders')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      stats: {
        totalOrders: allOrders?.length || 0,
        userOrders: userOrders?.length || 0,
        nullOrders: nullOrders?.length || 0
      },
      allOrders: allOrders?.slice(0, 10).map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        product_id: o.product_id,
        product_name: o.product_name,
        status: o.status,
        payment_method: o.payment_method,
        created_at: o.created_at
      })),
      userOrders: userOrders?.map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        product_id: o.product_id,
        product_name: o.product_name,
        status: o.status,
        payment_method: o.payment_method,
        created_at: o.created_at
      })),
      nullOrders: nullOrders?.map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        product_id: o.product_id,
        product_name: o.product_name,
        status: o.status,
        payment_method: o.payment_method,
        created_at: o.created_at
      }))
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Erreur interne',
      stack: error.stack
    }, { status: 500 })
  }
}

