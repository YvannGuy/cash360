/**
 * Helper pour appliquer une migration Supabase via MCP Supabase
 * 
 * Ce fichier sera utilisé à l'avenir pour appliquer automatiquement
 * les migrations Supabase en utilisant MCP Supabase.
 * 
 * Pour utiliser cette fonction :
 * 1. Lisez le fichier de migration SQL
 * 2. Extrayez le project_id depuis l'URL Supabase (ou utilisez le project_ref)
 * 3. Appelez mcp_supabase_apply_migration avec les paramètres appropriés
 */

/**
 * Extrait le project_ref de l'URL Supabase
 * @param {string} supabaseUrl - URL Supabase (ex: https://xxxxx.supabase.co)
 * @returns {string|null} - Le project_ref ou null si non trouvé
 */
function extractProjectRef(supabaseUrl) {
  const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
  return urlMatch ? urlMatch[1] : null
}

/**
 * Applique une migration Supabase via MCP Supabase
 * 
 * Cette fonction devrait être appelée avec les outils MCP Supabase :
 * - mcp_supabase_apply_migration
 * 
 * @param {string} migrationFilePath - Chemin vers le fichier de migration SQL
 * @param {string} projectId - ID du projet Supabase (peut être le project_ref)
 * @returns {Promise<void>}
 */
async function applySupabaseMigration(migrationFilePath, projectId) {
  const fs = require('fs')
  const path = require('path')
  
  // Lire le fichier de migration
  const migrationSQL = fs.readFileSync(migrationFilePath, 'utf-8')
  
  // Extraire le nom de la migration depuis le nom du fichier
  const migrationName = path.basename(migrationFilePath, '.sql')
    .replace(/^migration_/, '')
    .replace(/[^a-z0-9_]/gi, '_')
  
  console.log(`📝 Application de la migration: ${migrationName}`)
  console.log(`📋 Project ID: ${projectId}`)
  console.log(`📄 Fichier: ${migrationFilePath}\n`)
  
  // TODO: Appeler mcp_supabase_apply_migration avec ces paramètres :
  // {
  //   project_id: projectId,
  //   name: migrationName,
  //   query: migrationSQL
  // }
  
  console.log('💡 Pour appliquer cette migration via MCP Supabase, utilisez:')
  console.log(`   mcp_supabase_apply_migration`)
  console.log(`   - project_id: ${projectId}`)
  console.log(`   - name: ${migrationName}`)
  console.log(`   - query: (contenu du fichier SQL)`)
}

module.exports = {
  extractProjectRef,
  applySupabaseMigration
}

