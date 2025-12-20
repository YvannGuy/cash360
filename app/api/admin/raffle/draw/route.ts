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

export async function POST(request: NextRequest) {
  try {
    // Note: L'authentification admin est gérée côté client via localStorage
    // Cette route est protégée par le middleware ou la vérification côté client

    // Lire toutes les inscriptions depuis le fichier JSON
    const entries = readEntries()

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'Aucune inscription trouvée' },
        { status: 400 }
      )
    }

    // Sélectionner un gagnant au hasard
    const randomIndex = Math.floor(Math.random() * entries.length)
    const winner = entries[randomIndex]

    return NextResponse.json({
      success: true,
      winner: {
        id: winner.id,
        first_name: winner.first_name,
        last_name: winner.last_name,
        email: winner.email,
        message: winner.message,
        created_at: winner.created_at
      },
      totalEntries: entries.length
    })

  } catch (error: any) {
    console.error('Erreur API admin raffle draw:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
