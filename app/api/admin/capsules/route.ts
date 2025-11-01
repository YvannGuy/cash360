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

    // Récupérer toutes les capsules achetées
    const { data: capsules, error } = await supabaseAdmin!
      .from('user_capsules')
      .select(`
        *,
        user:user_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des capsules:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Récupérer les informations utilisateurs depuis auth.users
    const enrichedCapsules = await Promise.all(
      (capsules || []).map(async (capsule: any) => {
        const { data: authUser } = await supabaseAdmin!.auth.admin.getUserById(capsule.user_id)
        return {
          ...capsule,
          user_email: authUser?.user?.email || capsule.user?.email || 'Unknown',
          user_name: authUser?.user?.email?.split('@')[0] || 'Unknown User'
        }
      })
    )

    // Calculer les statistiques
    const stats = {
      totalSales: 0, // TODO: calculer depuis les paiements réels
      totalBuyers: new Set(enrichedCapsules.map(c => c.user_id)).size,
      mostPopular: 'Éducation financière', // TODO: calculer depuis les données
      repurchaseRate: 0 // TODO: calculer depuis les données
    }

    return NextResponse.json({
      success: true,
      capsules: enrichedCapsules,
      stats
    })

  } catch (error) {
    console.error('Erreur API admin capsules:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

