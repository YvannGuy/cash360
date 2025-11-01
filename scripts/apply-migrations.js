const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuration Supabase manquante dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('🚀 Démarrage des migrations...\n')
  
  // Lire le fichier SQL
  const migrationPath = path.join(__dirname, '../supabase/migrations.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
  
  // Découper les instructions SQL
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('CREATE OR REPLACE') && !s.includes('TRIGGER'))
  
  console.log(`📝 ${statements.length} instructions SQL à exécuter\n`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement) continue
    
    try {
      // Exécuter via RPC si possible
      const { error } = await supabase.rpc('exec_raw_sql', { sql_query: statement })
      
      if (error) {
        // Essayer directement avec le client
        const { error: directError } = await supabase.query(statement)
        if (directError) {
          console.log(`⚠️  Instruction ${i + 1} échouée: ${statement.substring(0, 60)}...`)
          errorCount++
          continue
        }
      }
      
      successCount++
      if ((i + 1) % 10 === 0) {
        console.log(`✓ ${i + 1}/${statements.length} instructions exécutées...`)
      }
    } catch (err) {
      console.log(`⚠️  Erreur instruction ${i + 1}: ${err.message}`)
      errorCount++
    }
  }
  
  console.log(`\n✅ Migrations terminées: ${successCount} succès, ${errorCount} erreurs`)
  
  // Vérifier les tables créées
  console.log('\n📊 Vérification des tables...')
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['formations', 'formation_registrations', 'products', 'payments', 'cart_items'])
  
  if (!tablesError && tables && tables.length > 0) {
    console.log(`✓ Tables créées: ${tables.map(t => t.table_name).join(', ')}`)
  } else {
    console.log('⚠️  Certaines tables n\'ont peut-être pas été créées')
  }
}

applyMigrations().catch(console.error)

