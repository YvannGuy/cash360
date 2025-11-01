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

    // Pour l'instant, générons des données de démo en attendant la vraie table
    // TODO: remplacer par une vraie table 'formations' ou 'training_sessions' dans Supabase
    
    const demoFormations = [
      {
        id: '1',
        title: "L'éducation financière",
        capsule_id: 'education-financiere',
        capsule_number: 1,
        date: '2025-11-05',
        time: '19:30',
        inscrits: 18,
        zoom_link: 'https://zoom.us/j/123456789',
        status: 'en_ligne'
      },
      {
        id: '2',
        title: 'La mentalité de pauvreté',
        capsule_id: 'mentalite-pauvrete',
        capsule_number: 2,
        date: '2025-11-08',
        time: '20:00',
        inscrits: 24,
        zoom_link: 'https://zoom.us/j/987654321',
        status: 'a_venir'
      },
      {
        id: '3',
        title: 'Épargne & investissement',
        capsule_id: 'epargne-investissement',
        capsule_number: 3,
        date: '2025-11-11',
        time: '18:00',
        inscrits: 12,
        zoom_link: 'https://zoom.us/j/456789123',
        status: 'termine'
      }
    ]

    // Calculer les statistiques
    const stats = {
      sessionsThisMonth: 12,
      totalRegistered: 248,
      participationRate: 78,
      sessionsThisWeek: 3
    }

    return NextResponse.json({
      success: true,
      formations: demoFormations,
      stats
    })

  } catch (error) {
    console.error('Erreur API admin formations:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

