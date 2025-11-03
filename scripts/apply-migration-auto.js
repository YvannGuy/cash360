/**
 * Script pour appliquer automatiquement les migrations Supabase via MCP Supabase
 * Usage: node scripts/apply-migration-auto.js <nom-du-fichier-migration.sql>
 * 
 * Ce script utilise MCP Supabase pour appliquer les migrations automatiquement
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ Configuration Supabase manquante dans .env.local')
  process.exit(1)
}

// Extraire le project_ref de l'URL Supabase
// Format: https://xxxxx.supabase.co -> project_ref = xxxxx
const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
if (!urlMatch) {
  console.error('❌ Impossible d\'extraire le project_ref de l\'URL Supabase')
  process.exit(1)
}

const projectRef = urlMatch[1]

// Lire le fichier de migration
const migrationFileName = process.argv[2] || 'supabase/migration_add_appears_in_formations.sql'
const migrationPath = path.join(__dirname, '..', migrationFileName)

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Fichier de migration introuvable: ${migrationPath}`)
  process.exit(1)
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

// Extraire le nom de la migration depuis le nom du fichier
const migrationName = path.basename(migrationFileName, '.sql')
  .replace(/^migration_/, '')
  .replace(/[^a-z0-9_]/gi, '_')

console.log(`📝 Application automatique de la migration: ${migrationName}`)
console.log(`📋 Project Ref: ${projectRef}`)
console.log(`📄 Fichier: ${migrationPath}\n`)

// Note: Pour appliquer via MCP Supabase, il faudrait utiliser:
// mcp_supabase_apply_migration avec:
// - project_id: projectRef (ou le vrai project_id)
// - name: migrationName
// - query: migrationSQL
//
// Pour l'instant, le script indique qu'il faut l'appliquer manuellement
// mais dans l'avenir, cela pourrait être automatisé avec les outils MCP

console.log('⚠️  Migration créée mais nécessite une application manuelle via Supabase Dashboard.')
console.log('💡 À l\'avenir, cette migration sera appliquée automatiquement via MCP Supabase.\n')

