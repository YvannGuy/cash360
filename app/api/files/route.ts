import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    console.log('🔍 Recherche des fichiers avec les permissions admin...')
    
    // Test d'accès au bucket avec permissions admin
    const { data: bucketData, error: bucketError } = await supabaseAdmin.storage
      .from('releves')
      .list('', { limit: 100, offset: 0 })
    
    console.log('📦 Résultat admin bucket:', { data: bucketData, error: bucketError })
    
    if (bucketError) {
      return NextResponse.json(
        { error: `Erreur d'accès au bucket: ${bucketError.message}` },
        { status: 500 }
      )
    }
    
    // Recherche récursive avec permissions admin
    const getAllFiles = async (path = ''): Promise<any[]> => {
      const { data, error } = await supabaseAdmin!.storage
        .from('releves')
        .list(path, { limit: 1000, offset: 0 })
      
      if (error) {
        console.error('Erreur dans', path, ':', error)
        return []
      }
      
      const files = []
      for (const item of data || []) {
        const fullPath = path ? `${path}/${item.name}` : item.name
        
        if (item.metadata?.size) {
          // C'est un fichier
          files.push({
            name: item.name,
            path: fullPath,
            size: item.metadata.size,
            created_at: item.created_at,
            updated_at: item.updated_at
          })
        } else {
          // C'est un dossier, chercher récursivement
          const subFiles = await getAllFiles(fullPath)
          files.push(...subFiles)
        }
      }
      
      return files
    }
    
    const allFiles = await getAllFiles()
    console.log('📋 Fichiers trouvés avec admin:', allFiles)
    
    return NextResponse.json({ files: allFiles })
    
  } catch (error) {
    console.error('Erreur API files:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
