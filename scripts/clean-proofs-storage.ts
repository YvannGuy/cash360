/**
 * Script pour nettoyer le bucket Supabase Storage "proofs"
 * Supprime tous les dossiers sauf celui qui commence par "SUB1767493807397DOTQA0"
 * 
 * Usage: npx tsx scripts/clean-proofs-storage.ts
 * ou: node --loader tsx scripts/clean-proofs-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

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

async function cleanProofsStorage() {
  console.log('🔍 Début du nettoyage du bucket "proofs"...\n')
  
  try {
    // Lister tous les fichiers dans le bucket
    console.log('📋 Liste de tous les fichiers dans le bucket...')
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      throw new Error(`Erreur lors de la liste des fichiers: ${listError.message}`)
    }

    if (!files || files.length === 0) {
      console.log('✅ Aucun fichier trouvé dans le bucket')
      return
    }

    console.log(`   Trouvé ${files.length} fichier(s)/dossier(s)\n`)

    // Filtrer les fichiers à supprimer (ceux qui ne commencent pas par le préfixe à garder)
    const filesToDelete = files.filter(file => {
      // Vérifier si le nom du fichier/dossier commence par le préfixe à garder
      const shouldKeep = file.name.startsWith(KEEP_PREFIX)
      return !shouldKeep
    })

    const filesToKeep = files.filter(file => file.name.startsWith(KEEP_PREFIX))

    console.log(`📊 Statistiques:`)
    console.log(`   - Fichiers à conserver: ${filesToKeep.length}`)
    console.log(`   - Fichiers à supprimer: ${filesToDelete.length}\n`)

    if (filesToKeep.length > 0) {
      console.log('✅ Fichiers à conserver:')
      filesToKeep.forEach(file => {
        console.log(`   - ${file.name}`)
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
      console.log(`   - ${file.name}`)
    })
    console.log('')

    // Demander confirmation (pour sécurité, on peut commenter cette partie si on veut automatiser)
    // Pour l'instant, on continue automatiquement mais on affiche un avertissement
    console.log('⚠️  ATTENTION: Cette opération est irréversible!')
    console.log('   Appuyez sur Ctrl+C pour annuler dans les 5 secondes...\n')
    
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Supprimer les fichiers
    console.log('🗑️  Suppression en cours...\n')
    
    const filesToDeletePaths = filesToDelete.map(file => file.name)
    
    // Supprimer par lots pour éviter les timeouts
    const batchSize = 50
    let deletedCount = 0
    let errorCount = 0

    for (let i = 0; i < filesToDeletePaths.length; i += batchSize) {
      const batch = filesToDeletePaths.slice(i, i + batchSize)
      
      const { error } = await supabase.storage
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

  } catch (error: any) {
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

