import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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
      }, { status: 401 })
    }

    // Récupérer toutes les commandes avec user_id null
    const { data: nullOrders, error: nullOrdersError } = await supabaseAdmin!
      .from('orders')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false })

    if (nullOrdersError) {
      return NextResponse.json({
        error: nullOrdersError.message
      }, { status: 500 })
    }

    if (!nullOrders || nullOrders.length === 0) {
      return NextResponse.json({
        message: 'Aucune commande avec user_id null trouvée',
        user: {
          id: user.id,
          email: user.email
        }
      })
    }

    // Mettre à jour toutes les commandes avec user_id null pour leur attribuer le user_id actuel
    const orderIds = nullOrders.map((o: any) => o.id)
    const { data: updatedOrders, error: updateError } = await supabaseAdmin!
      .from('orders')
      .update({ user_id: user.id })
      .in('id', orderIds)
      .select()

    if (updateError) {
      return NextResponse.json({
        error: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${updatedOrders?.length || 0} commande(s) mise(s) à jour`,
      user: {
        id: user.id,
        email: user.email
      },
      updatedOrders: updatedOrders?.map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        product_id: o.product_id,
        product_name: o.product_name,
        status: o.status
      }))
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Erreur interne',
      stack: error.stack
    }, { status: 500 })
  }
}

