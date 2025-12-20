import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'raffle_entries.json')

// Fonction helper pour lire les entrées
function readEntries(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(fileContent)
    }
  } catch (error) {
    console.error('Erreur lecture fichier:', error)
  }
  return []
}

export async function GET(request: NextRequest) {
  try {
    // Note: L'authentification admin est gérée côté client via localStorage
    // Cette route est protégée par le middleware ou la vérification côté client

    // Lire toutes les inscriptions depuis le fichier JSON
    const entries = readEntries()

    // Trier par date de création (plus récent en premier)
    entries.sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({
      success: true,
      entries: entries,
      count: entries.length
    })

  } catch (error: any) {
    console.error('Erreur API admin raffle:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
