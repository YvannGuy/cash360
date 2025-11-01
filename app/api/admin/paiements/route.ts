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
    // TODO: remplacer par une vraie table 'paiements' ou 'transactions' dans Supabase
    
    const demoTransactions = [
      {
        id: '1',
        user_name: 'Paola C.',
        user_email: 'paola.c@example.com',
        type: 'analyse',
        type_label: 'Analyse financière',
        amount: 39.00,
        status: 'success',
        method: 'PayPal',
        date: '2025-11-01'
      },
      {
        id: '2',
        user_name: 'Jean K.',
        user_email: 'jean.k@example.com',
        type: 'capsule',
        type_label: 'Capsule "Éducation financière"',
        amount: 20.00,
        status: 'failed',
        method: 'Stripe',
        date: '2025-11-03'
      },
      {
        id: '3',
        user_name: 'Nadia M.',
        user_email: 'nadia.m@example.com',
        type: 'pack',
        type_label: 'Pack complet',
        amount: 149.99,
        status: 'success',
        method: 'Carte bancaire',
        date: '2025-11-04'
      }
    ]

    // Calculer les statistiques
    const stats = {
      monthlyRevenue: 12450.00,
      cumulativeRevenue: 89320.00,
      transactions: 1247,
      failureRate: 2.3,
      averageBasket: 67.50
    }

    return NextResponse.json({
      success: true,
      transactions: demoTransactions,
      stats
    })

  } catch (error) {
    console.error('Erreur API admin paiements:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

