import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET: Récupérer tous les témoignages
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: testimonials, error } = await query

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

// PUT: Mettre à jour un témoignage (approuver/rejeter)
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { id, status, approvedByEmail } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID et statut requis' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
      // Si un email est fourni, récupérer l'UUID de l'utilisateur
      if (approvedByEmail) {
        try {
          // Récupérer tous les utilisateurs et trouver celui avec l'email
          const MAX_PER_PAGE = 200
          const allUsers: any[] = []
          let page = 1
          let hasMore = true

          while (hasMore) {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers({
              page,
              perPage: MAX_PER_PAGE
            })

            if (error) break

            const batch = data?.users || []
            allUsers.push(...batch)

            if (batch.length < MAX_PER_PAGE) {
              hasMore = false
            } else {
              page += 1
            }
          }

          const adminUser = allUsers.find(u => u.email === approvedByEmail)
          if (adminUser?.id) {
            updateData.approved_by = adminUser.id
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error)
          // Continuer sans approved_by si on ne peut pas le trouver
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
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

// DELETE: Supprimer un témoignage
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Témoignage supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur API testimonials:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
