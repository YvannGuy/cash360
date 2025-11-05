import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const userId = body.userId

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id requis' },
        { status: 400 }
      )
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
        userId
      })
    }

    // Mettre à jour toutes les commandes avec user_id null pour leur attribuer le user_id fourni
    const orderIds = nullOrders.map((o: any) => o.id)
    const { data: updatedOrders, error: updateError } = await supabaseAdmin!
      .from('orders')
      .update({ user_id: userId })
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
      userId,
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

