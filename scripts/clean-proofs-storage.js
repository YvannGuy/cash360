/**
 * Script pour nettoyer le bucket Supabase Storage "proofs"
 * Supprime tous les dossiers sauf celui qui commence par "SUB1767493807397DOTQA0"
 * 
 * Usage: node scripts/clean-proofs-storage.js
 */

// Charger les variables d'environnement depuis .env.local si disponible
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // dotenv n'est pas installé, les variables d'env seront chargées depuis l'environnement système
}

try {
  require('dotenv').config({ path: '.env' })
} catch (e) {
  // Ignorer si .env n'existe pas
}

const { createClient } = require('@supabase/supabase-js')

const BUCKET_NAME = 'proofs'
const KEEP_PREFIX = 'SUB1767493807397DOTQA0'

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes')
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  console.error('\n   Assurez-vous que ces variables sont définies dans .env.local')
  process.exit(1)
}

// Créer le client Supabase avec service role key (droits admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Fonction récursive pour lister tous les fichiers dans un dossier
async function listAllFiles(folderPath = '', allFiles = []) {
  const { data: items, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    })

  if (error) {
    // Si erreur 404, c'est probablement un fichier et non un dossier
    if (error.statusCode === '404' || error.message.includes('not found')) {
      return allFiles
    }
    throw new Error(`Erreur lors de la liste: ${error.message}`)
  }

  if (!items || items.length === 0) {
    return allFiles
  }

  for (const item of items) {
    const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name
    
    // Essayer de lister ce qui pourrait être un sous-dossier
    const subItems = await supabase.storage
      .from(BUCKET_NAME)
      .list(fullPath, { limit: 1 })
    
    if (subItems.data && subItems.data.length > 0) {
      // C'est un dossier, lister récursivement
      await listAllFiles(fullPath, allFiles)
    } else {
      // C'est un fichier, l'ajouter à la liste
      allFiles.push({ ...item, fullPath })
    }
  }

  return allFiles
}

async function cleanProofsStorage() {
  console.log('🔍 Début du nettoyage du bucket "proofs"...\n')
  
  try {
    // Lister tous les fichiers dans le bucket (récursivement)
    console.log('📋 Liste de tous les fichiers dans le bucket (récursif)...')
    const allFiles = await listAllFiles()

    if (!allFiles || allFiles.length === 0) {
      console.log('✅ Aucun fichier trouvé dans le bucket')
      return
    }

    console.log(`   Trouvé ${allFiles.length} fichier(s)\n`)

    // Filtrer les fichiers à supprimer (ceux qui ne commencent pas par le préfixe à garder)
    // Le chemin peut être "SUB1767493807397DOTQA0/..." ou inclure ce préfixe dans le chemin
    const filesToDelete = allFiles.filter(file => {
      // Normaliser le chemin (enlever le préfixe "proofs/" s'il existe)
      const normalizedPath = file.fullPath.replace(/^proofs\//, '')
      // Vérifier si le chemin commence par le préfixe à garder
      const shouldKeep = normalizedPath.startsWith(KEEP_PREFIX)
      return !shouldKeep
    })

    const filesToKeep = allFiles.filter(file => {
      const normalizedPath = file.fullPath.replace(/^proofs\//, '')
      return normalizedPath.startsWith(KEEP_PREFIX)
    })

    console.log(`📊 Statistiques:`)
    console.log(`   - Fichiers à conserver: ${filesToKeep.length}`)
    console.log(`   - Fichiers à supprimer: ${filesToDelete.length}\n`)

    if (filesToKeep.length > 0) {
      console.log('✅ Fichiers à conserver:')
      filesToKeep.forEach(file => {
        console.log(`   - ${file.fullPath}`)
      })
      console.log('')
    }

    if (filesToDelete.length === 0) {
      console.log('✅ Aucun fichier à supprimer')
      return
    }

    // Afficher les fichiers qui seront supprimés
    console.log('⚠️  Fichiers qui seront supprimés:')
    filesToDelete.forEach(file => {
      console.log(`   - ${file.fullPath}`)
    })
    console.log('')

    // Demander confirmation (pour sécurité, on peut commenter cette partie si on veut automatiser)
    // Pour l'instant, on continue automatiquement mais on affiche un avertissement
    console.log('⚠️  ATTENTION: Cette opération est irréversible!')
    console.log('   Appuyez sur Ctrl+C pour annuler dans les 5 secondes...\n')
    
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Supprimer les fichiers
    console.log('🗑️  Suppression en cours...\n')
    
    const filesToDeletePaths = filesToDelete.map(file => file.fullPath)
    
    // Supprimer par lots pour éviter les timeouts
    const batchSize = 50
    let deletedCount = 0
    let errorCount = 0

    for (let i = 0; i < filesToDeletePaths.length; i += batchSize) {
      const batch = filesToDeletePaths.slice(i, i + batchSize)
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(batch)

      if (error) {
        console.error(`❌ Erreur lors de la suppression du lot ${Math.floor(i / batchSize) + 1}:`, error.message)
        errorCount += batch.length
      } else {
        deletedCount += batch.length
        console.log(`   ✓ Lot ${Math.floor(i / batchSize) + 1}: ${batch.length} fichier(s) supprimé(s)`)
      }
    }

    console.log('\n✅ Nettoyage terminé!')
    console.log(`   - Fichiers supprimés: ${deletedCount}`)
    console.log(`   - Erreurs: ${errorCount}`)
    console.log(`   - Fichiers conservés: ${filesToKeep.length}`)

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Exécuter le script
cleanProofsStorage()
  .then(() => {
    console.log('\n✨ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })

