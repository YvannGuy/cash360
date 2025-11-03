/**
 * Script pour appliquer les migrations Supabase via MCP Supabase
 * Usage: node scripts/apply-migration-mcp.js <nom-du-fichier-migration.sql>
 * 
 * Exemple: node scripts/apply-migration-mcp.js supabase/migration_allow_null_dates.sql
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ Configuration Supabase manquante dans .env.local')
  console.error('   Assurez-vous d\'avoir NEXT_PUBLIC_SUPABASE_URL défini')
  process.exit(1)
}

// Extraire le project_ref de l'URL Supabase
// Format: https://xxxxx.supabase.co ou https://xxxxx.supabase.co
const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
if (!urlMatch) {
  console.error('❌ Impossible d\'extraire le project_ref de l\'URL Supabase')
  console.error('   URL trouvée:', supabaseUrl)
  process.exit(1)
}

const projectRef = urlMatch[1]
console.log(`📋 Project Ref détecté: ${projectRef}\n`)

// Lire le fichier de migration
const migrationFileName = process.argv[2]
if (!migrationFileName) {
  console.error('❌ Veuillez spécifier le fichier de migration')
  console.error('   Usage: node scripts/apply-migration-mcp.js <fichier-migration.sql>')
  process.exit(1)
}

const migrationPath = path.join(__dirname, '..', migrationFileName)
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Fichier de migration introuvable: ${migrationPath}`)
  process.exit(1)
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

console.log(`📝 Application de la migration: ${migrationFileName}`)
console.log(`📄 Contenu SQL:\n${migrationSQL}\n`)

console.log('⚠️  Pour appliquer cette migration automatiquement via MCP Supabase,')
console.log('    utilisez la commande suivante dans votre interface:')
console.log(`\n    mcp_supabase_apply_migration`)
console.log(`    - project_id: ${projectRef}`)
console.log(`    - name: ${path.basename(migrationFileName, '.sql')}`)
console.log(`    - query: (le contenu SQL ci-dessus)\n`)

console.log('💡 Note: Ce script nécessite que MCP Supabase soit configuré.')
console.log('   Pour l\'instant, appliquez la migration manuellement via Supabase Dashboard.\n')

