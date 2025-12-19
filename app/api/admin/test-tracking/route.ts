import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

/**
 * GET /api/admin/test-tracking
 * 
 * Route de test pour vérifier si le tracking fonctionne
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Test 1: Vérifier si on peut lire la table
    const { data: readData, error: readError } = await supabaseAdmin
      .from('tracking_events')
      .select('*')
      .limit(5)

    // Test 2: Essayer d'insérer un événement de test (PostgREST)
    let insertData = null
    let insertError = null
    const { data: insertDataPostgrest, error: insertErrorPostgrest } = await supabaseAdmin
      .from('tracking_events')
      .insert({
        event_type: 'test.admin_test',
        payload: { test: true, timestamp: new Date().toISOString() },
        created_at: new Date().toISOString()
      })
      .select()
    
    insertData = insertDataPostgrest
    insertError = insertErrorPostgrest

    // Test 2b: Si PostgREST échoue, essayer avec la fonction SQL
    let insertDataSQL = null
    let insertErrorSQL = null
    if (insertError && (insertError.code === 'PGRST205' || insertError.code === 'PGRST202')) {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('insert_tracking_event', {
        p_event_type: 'test.admin_test_sql',
        p_user_id: null,
        p_payload: { test: true, timestamp: new Date().toISOString(), method: 'sql_function', user_agent: 'admin_test' },
        p_session_id: 'test_session_admin'
      })
      insertDataSQL = rpcData
      insertErrorSQL = rpcError
    }

    // Test 3: Vérifier les événements récents (PostgREST)
    let recentData = null
    let recentError = null
    const { data: recentDataPostgrest, error: recentErrorPostgrest } = await supabaseAdmin
      .from('tracking_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    recentData = recentDataPostgrest
    recentError = recentErrorPostgrest

    // Test 3b: Si PostgREST échoue, essayer avec la fonction SQL
    if (recentError && (recentError.code === 'PGRST205' || recentError.code === 'PGRST202')) {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_tracking_events_bypass', {
        p_event_type: null,
        p_start_date: null
      })
      if (!rpcError && rpcData) {
        recentData = Array.isArray(rpcData) ? rpcData : [rpcData]
        recentError = null
      }
    }

    // Test 4: Appeler db_fingerprint pour diagnostic
    const { data: fingerprintData, error: fingerprintError } = await supabaseAdmin.rpc('db_fingerprint')

    // Test 5: Test avec le client supabase (anon) comme demandé
    let anonTestData = null
    let anonTestError = null
    if (supabase) {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .limit(5)
      anonTestData = data
      anonTestError = error
    }

    return NextResponse.json({
      success: true,
      tests: {
        read: {
          success: !readError,
          error: readError?.code || null,
          message: readError?.message || 'OK',
          dataCount: readData?.length || 0
        },
        insert: {
          success: !insertError || !insertErrorSQL,
          error: insertError?.code || insertErrorSQL?.code || null,
          message: insertError?.message || insertErrorSQL?.message || 'OK',
          insertedId: insertData?.[0]?.id || insertDataSQL || null,
          method: insertError ? (insertErrorSQL ? 'sql_function' : 'postgrest_failed') : 'postgrest',
          postgrestError: insertError?.code || null,
          sqlFunctionError: insertErrorSQL?.code || null
        },
        recent: {
          success: !recentError,
          error: recentError?.code || null,
          message: recentError?.message || 'OK',
          dataCount: recentData?.length || 0,
          events: recentData?.map((e: any) => ({
            id: e.id,
            event_type: e.event_type,
            created_at: e.created_at
          })) || []
        },
        dbFingerprint: {
          success: !fingerprintError,
          error: fingerprintError?.code || null,
          message: fingerprintError?.message || 'OK',
          data: fingerprintData || null
        },
        anonClientTest: {
          success: !anonTestError,
          error: anonTestError?.code || null,
          message: anonTestError?.message || 'OK',
          dataCount: anonTestData?.length || 0,
          data: anonTestData || null,
          clientAvailable: !!supabase
        }
      },
      postgrestStatus: readError?.code === 'PGRST205' || readError?.code === 'PGRST202' 
        ? 'NOT_READY' 
        : readError 
          ? 'ERROR' 
          : 'OK'
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
