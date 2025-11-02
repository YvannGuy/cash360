import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
      capsuleId,
      sessionName,
      sessionType,
      duration,
      date,
      time,
      description,
      zoomLink,
      maxParticipants,
      timezone,
      accessType,
      price,
      requirePayment,
      sendNotification
    } = body

    // Validation
    if (!capsuleId || !sessionName || !date || !time) {
      return NextResponse.json(
        { error: 'Capsule, nom, date et heure sont obligatoires' },
        { status: 400 }
      )
    }

    // Insérer dans Supabase
    const { data, error } = await supabaseAdmin!
      .from('formations')
      .insert({
        capsule_id: capsuleId,
        session_name: sessionName,
        session_type: sessionType || 'Capsule',
        duration: duration || 60,
        date_scheduled: date,
        time_scheduled: time,
        description: description || null,
        zoom_link: zoomLink || null,
        max_participants: maxParticipants || 50,
        timezone: timezone || 'Europe/Paris',
        access_type: accessType || 'tous',
        price: price || 0,
        require_payment: requirePayment || false,
        send_notification: sendNotification || true,
        status: 'a_venir'
      })
      .select()

    if (error) {
      console.error('Erreur lors de la création de la formation:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      formation: data[0]
    })

  } catch (error) {
    console.error('Erreur API admin formations POST:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Récupérer les formations depuis la base de données
    const { data: formations, error: formationsError } = await supabaseAdmin!
      .from('formations')
      .select('*')
      .order('date_scheduled', { ascending: false })

    if (formationsError) {
      console.error('Erreur lors de la récupération des formations:', formationsError)
      return NextResponse.json(
        { error: formationsError.message },
        { status: 500 }
      )
    }

    // Adapter le format des données
    const adaptedFormations = (formations || []).map((formation: any) => ({
      id: formation.id,
      title: formation.session_name,
      capsule_id: formation.capsule_id,
      capsule_number: formation.capsule_number || 0,
      date: formation.date_scheduled,
      time: formation.time_scheduled,
      inscrits: formation.inscrits || 0,
      zoom_link: formation.zoom_link,
      status: formation.status
    }))

    // Compter les inscriptions pour chaque formation
    const formationIds = adaptedFormations.map(f => f.id)
    const { data: registrations } = await supabaseAdmin!
      .from('formation_registrations')
      .select('formation_id')
      .in('formation_id', formationIds)

    // Compter les inscriptions par formation
    const inscriptionsByFormation = (registrations || []).reduce((acc: any, reg) => {
      acc[reg.formation_id] = (acc[reg.formation_id] || 0) + 1
      return acc
    }, {})

    // Ajouter les comptes d'inscriptions
    const formationsWithCounts = adaptedFormations.map(f => ({
      ...f,
      inscrits: inscriptionsByFormation[f.id] || 0
    }))

    // Calculer les statistiques
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      sessionsThisMonth: formationsWithCounts.filter(f => new Date(f.date) >= firstDayOfMonth).length,
      totalRegistered: Object.values(inscriptionsByFormation).reduce((sum: any, count) => sum + count, 0),
      participationRate: 0, // TODO: calculer depuis les données de présence
      sessionsThisWeek: formationsWithCounts.filter(f => new Date(f.date) >= oneWeekAgo).length
    }

    return NextResponse.json({
      success: true,
      formations: formationsWithCounts,
      stats
    })

  } catch (error) {
    console.error('Erreur API admin formations:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

