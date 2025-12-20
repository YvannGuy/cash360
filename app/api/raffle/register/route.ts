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

// Fonction helper pour écrire les entrées
function writeEntries(entries: any[]): void {
  try {
    // Créer le dossier data s'il n'existe pas
    const dataDir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8')
  } catch (error) {
    console.error('Erreur écriture fichier:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, message } = body

    // Validation
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Le nom, prénom et email sont obligatoires' },
        { status: 400 }
      )
    }

    // Validation email basique
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // Lire les entrées existantes
    const entries = readEntries()

    // Vérifier si l'email existe déjà
    const normalizedEmail = email.toLowerCase().trim()
    const existing = entries.find((e: any) => e.email.toLowerCase() === normalizedEmail)

    if (existing) {
      return NextResponse.json(
        { error: 'Cet email est déjà inscrit au tirage au sort' },
        { status: 400 }
      )
    }

    // Créer la nouvelle entrée
    const newEntry = {
      id: `raffle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: normalizedEmail,
      message: message?.trim() || null,
      created_at: new Date().toISOString()
    }

    // Ajouter et sauvegarder
    entries.push(newEntry)
    writeEntries(entries)

    return NextResponse.json({
      success: true,
      message: 'Vous avez été bien enregistré',
      data: newEntry
    })

  } catch (error: any) {
    console.error('Erreur API raffle register:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
