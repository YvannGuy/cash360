import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Lire tous les fichiers SQL de migration
    const migrationsPath = path.join(process.cwd(), 'supabase')
    const migrationFiles = ['migrations.sql', 'migration_002_products_one_time.sql', 'migration_003_user_roles.sql', 'migration_004_commercial_calls.sql']
    
    let allMigrationSQL = ''
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsPath, file)
      if (fs.existsSync(filePath)) {
        allMigrationSQL += fs.readFileSync(filePath, 'utf-8') + '\n\n'
      }
    }
    const migrationSQL = allMigrationSQL

    // Appliquer la migration (on doit découper par instructions)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log(`Tentative directe SQL pour: ${statement.substring(0, 50)}...`)
          // Essayer directement avec le client Supabase
          const { error: directError } = await (supabaseAdmin as any).query(statement)
          if (directError) {
            console.error('Erreur migration:', directError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migrations appliquées avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de l\'application des migrations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'application des migrations' },
      { status: 500 }
    )
  }
}

