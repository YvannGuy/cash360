import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Récupérer tous les rendez-vous commerciaux
    const { data: appointments, error } = await supabaseAdmin
      .from('commercial_appointments')
      .select('*')
      .order('appointment_date', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointments: appointments || []
    })

  } catch (error) {
    console.error('Erreur API commercial calls:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { 
      contact_name, 
      contact_email, 
      contact_phone,
      appointment_date,
      timezone,
      duration,
      zoom_link,
      appointment_type,
      source,
      status,
      priority,
      notes,
      internal_notes
    } = body

    if (!contact_name || !contact_email || !appointment_date || !appointment_type || !source) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    // Créer un nouveau rendez-vous
    const { data: appointment, error } = await supabaseAdmin
      .from('commercial_appointments')
      .insert({
        contact_name,
        contact_email,
        contact_phone,
        appointment_date,
        timezone: timezone || 'Europe/Paris',
        duration: duration || 30,
        zoom_link,
        appointment_type,
        source,
        status: status || 'nouveau',
        priority: priority || false,
        notes,
        internal_notes
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du rendez-vous:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment
    })

  } catch (error) {
    console.error('Erreur API create appointment:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { appointmentId, ...updates } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'ID de rendez-vous manquant' },
        { status: 400 }
      )
    }

    // Mettre à jour le rendez-vous
    const { data: appointment, error } = await supabaseAdmin
      .from('commercial_appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du rendez-vous:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment
    })

  } catch (error) {
    console.error('Erreur API update appointment:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { appointmentId } = await request.json()

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'ID de rendez-vous manquant' },
        { status: 400 }
      )
    }

    // Supprimer le rendez-vous
    const { error } = await supabaseAdmin
      .from('commercial_appointments')
      .delete()
      .eq('id', appointmentId)

    if (error) {
      console.error('Erreur lors de la suppression du rendez-vous:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Rendez-vous supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur API delete appointment:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

