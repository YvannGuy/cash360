import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/admin/refresh-schema-cache
 * 
 * Rafraîchit le cache du schéma PostgREST pour que les nouvelles tables soient reconnues
 * Note: Dans Supabase, cela se fait généralement automatiquement, mais parfois
 * il faut redémarrer le projet ou attendre quelques minutes.
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Méthode 1: Utiliser la fonction SQL dédiée (recommandée)
    const { error: rpcError } = await supabaseAdmin.rpc('refresh_postgrest_schema')
    
    if (!rpcError) {
      // Attendre un peu pour que le cache se rafraîchisse
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Vérifier si la table est maintenant accessible
      const { data: testData, error: testError } = await supabaseAdmin
        .from('tracking_events')
        .select('id')
        .limit(1)
      
      if (!testError) {
        return NextResponse.json({
          success: true,
          message: '✅ Cache PostgREST rafraîchi avec succès ! La table tracking_events est maintenant accessible.',
          tableAccessible: true
        })
      } else if (testError.code === 'PGRST205') {
        return NextResponse.json({
          success: false,
          message: '⚠️ La notification a été envoyée mais le cache n\'est pas encore rafraîchi.',
          solution: 'Le cache peut prendre 1-2 minutes pour se rafraîchir. Si le problème persiste après 2 minutes, redémarrez votre projet Supabase depuis le dashboard (Settings > General > Restart project).',
          cacheIssue: true
        }, { status: 200 })
      }
    }

    // Méthode 2: Essayer directement avec NOTIFY
    const { error: notifyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: "SELECT pg_notify('pgrst', 'reload schema');"
    })

    if (notifyError) {
      console.warn('[REFRESH SCHEMA] RPC methods not available, checking table status...')
      
      // Vérifier que la table existe bien dans la base de données
      const { data: tableExists, error: checkError } = await supabaseAdmin
        .from('tracking_events')
        .select('id')
        .limit(1)

      if (checkError && checkError.code === 'PGRST205') {
        return NextResponse.json({
          success: false,
          message: 'Le cache PostgREST n\'a pas été rafraîchi. La table existe mais PostgREST ne la voit pas encore.',
          solution: 'Pour résoudre ce problème:\n1. Allez sur https://supabase.com/dashboard\n2. Sélectionnez votre projet\n3. Allez dans Settings > General\n4. Cliquez sur "Restart project"\n5. Attendez 1-2 minutes que le projet redémarre\n\nLe cache se rafraîchira automatiquement après le redémarrage.',
          tableExists: true,
          cacheIssue: true,
          dashboardUrl: 'https://supabase.com/dashboard'
        }, { status: 200 })
      }

      if (tableExists !== null) {
        return NextResponse.json({
          success: true,
          message: 'La table est accessible. Le cache devrait se rafraîchir automatiquement dans quelques minutes.',
          tableAccessible: true
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification envoyée pour rafraîchir le cache. Attendez 1-2 minutes et vérifiez à nouveau. Si le problème persiste, redémarrez votre projet Supabase.'
    })

  } catch (error: any) {
    console.error('[REFRESH SCHEMA] Error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors du rafraîchissement du cache',
        details: error.message,
        solution: 'Redémarrez votre projet Supabase depuis le dashboard pour forcer le rafraîchissement du cache PostgREST'
      },
      { status: 500 }
    )
  }
}
