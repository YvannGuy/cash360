const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuration Supabase manquante dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('🚀 Démarrage des migrations Supabase...\n')
  
  // Lire le fichier SQL
  const migrationPath = path.join(__dirname, '../supabase/migrations.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
  
  console.log(`📝 Application de la migration complète\n`)
  
  try {
    // Application via executeSQL qui utilise l'admin API
    const { error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL })
    
    if (error) {
      throw error
    }
    
    console.log('✅ Migration appliquée avec succès!')
    
    // Vérifier les tables
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['formations', 'formation_registrations', 'products', 'payments', 'cart_items'])
    
    console.log(`\n📊 Tables créées: ${tables?.map(t => t.table_name).join(', ')}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.log('\n⚠️  L\'API RPC exec_sql n\'est peut-être pas disponible.')
    console.log('💡 Essayez d\'appliquer la migration manuellement via le SQL Editor de Supabase.')
  }
}

applyMigrations().catch(console.error)

