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

    // Récupérer toutes les commandes payées de cet utilisateur
    const { data: paidOrders, error: ordersError } = await supabaseAdmin!
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    if (ordersError) {
      return NextResponse.json({
        error: ordersError.message
      }, { status: 500 })
    }

    if (!paidOrders || paidOrders.length === 0) {
      return NextResponse.json({
        message: 'Aucune commande payée trouvée pour cet utilisateur',
        userId
      })
    }

    // Récupérer les capsules déjà présentes pour cet utilisateur
    const { data: existingCapsules, error: capsulesError } = await supabaseAdmin!
      .from('user_capsules')
      .select('capsule_id')
      .eq('user_id', userId)

    if (capsulesError) {
      return NextResponse.json({
        error: capsulesError.message
      }, { status: 500 })
    }

    const existingCapsuleIds = new Set((existingCapsules || []).map((c: any) => c.capsule_id))

    // Ajouter les capsules manquantes
    const capsulesToAdd = []
    for (const order of paidOrders) {
      // Exclure "analyse-financiere" et "abonnement"
      if (order.product_id !== 'analyse-financiere' && order.product_id !== 'abonnement') {
        if (!existingCapsuleIds.has(order.product_id)) {
          capsulesToAdd.push({
            user_id: userId,
            capsule_id: order.product_id,
            created_at: new Date().toISOString()
          })
        }
      }
    }

    if (capsulesToAdd.length === 0) {
      return NextResponse.json({
        message: 'Toutes les capsules sont déjà présentes dans user_capsules',
        userId,
        paidOrders: paidOrders.length
      })
    }

    // Insérer les capsules manquantes
    const { data: insertedCapsules, error: insertError } = await supabaseAdmin!
      .from('user_capsules')
      .insert(capsulesToAdd)
      .select()

    if (insertError) {
      return NextResponse.json({
        error: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${insertedCapsules?.length || 0} capsule(s) ajoutée(s) dans user_capsules`,
      userId,
      addedCapsules: insertedCapsules?.map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        capsule_id: c.capsule_id
      })),
      totalPaidOrders: paidOrders.length
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Erreur interne',
      stack: error.stack
    }, { status: 500 })
  }
}

