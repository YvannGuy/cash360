import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET: Récupérer les témoignages approuvés (pour la homepage)
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { data: testimonials, error } = await supabaseAdmin
      .from('testimonials')
      .select('id, first_name, last_name, content, rating, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Erreur lors de la récupération des témoignages:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      testimonials: testimonials || []
    })
  } catch (error) {
    console.error('Erreur API testimonials:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer un nouveau témoignage (page publique)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, content, rating, email } = body

    if (!firstName || !lastName || !content) {
      return NextResponse.json(
        { error: 'Prénom, nom et contenu requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        content: content.trim(),
        rating: rating || 5,
        email: email || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Témoignage soumis avec succès ! Il sera publié après validation.',
      testimonial: data
    })
  } catch (error) {
    console.error('Erreur API testimonials:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
