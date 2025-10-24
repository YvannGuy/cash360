import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ticket = searchParams.get('ticket')
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket manquant' },
        { status: 400 }
      )
    }

    console.log('🔍 Recherche des relevés pour le ticket:', ticket)
    
    // Enlever le préfixe "CASH-" du ticket pour correspondre au dossier de stockage
    const folderName = ticket.replace('CASH-', '')
    console.log('📁 Nom du dossier:', folderName)
    
    // Méthode alternative : récupérer tous les fichiers et filtrer côté client
    const getAllFiles = async (path = ''): Promise<any[]> => {
      const { data, error } = await supabaseAdmin.storage
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
    console.log('📋 Tous les fichiers trouvés:', allFiles)
    
    // Filtrer les fichiers qui correspondent au ticket
    const releveFiles = allFiles.filter(file => 
      file.path.startsWith(`releves/${folderName}/`) && 
      file.name.startsWith('releve_')
    )
    
    console.log('📄 Fichiers de relevés filtrés pour', folderName, ':', releveFiles)
    
    return NextResponse.json({ files: releveFiles })
    
  } catch (error) {
    console.error('Erreur API releves:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}