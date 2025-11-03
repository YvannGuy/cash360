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

    // Validation - seuls le nom est obligatoire, date et heure sont optionnelles
    if (!sessionName) {
      return NextResponse.json(
        { error: 'Le nom de la session est obligatoire' },
        { status: 400 }
      )
    }

    // Insérer dans Supabase
    const { data, error } = await supabaseAdmin!
      .from('formations')
      .insert({
        capsule_id: capsuleId || null,
        session_name: sessionName,
        session_type: sessionType || 'Capsule',
        duration: duration || 60,
        date_scheduled: date || null,
        time_scheduled: time || null,
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
      console.error('Détails:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('Formation créée avec succès:', data[0])
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

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const formationId = searchParams.get('formationId')

    if (!formationId) {
      return NextResponse.json(
        { error: 'ID de formation manquant' },
        { status: 400 }
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

    // Validation - seuls le nom est obligatoire, date et heure sont optionnelles
    if (!sessionName) {
      return NextResponse.json(
        { error: 'Le nom de la session est obligatoire' },
        { status: 400 }
      )
    }

    // Mettre à jour dans Supabase
    const { data, error } = await supabaseAdmin!
      .from('formations')
      .update({
        capsule_id: capsuleId || null,
        session_name: sessionName,
        session_type: sessionType || 'Capsule',
        duration: duration || 60,
        date_scheduled: date || null,
        time_scheduled: time || null,
        description: description || null,
        zoom_link: zoomLink || null,
        max_participants: maxParticipants || 50,
        timezone: timezone || 'Europe/Paris',
        access_type: accessType || 'tous',
        price: price || 0,
        require_payment: requirePayment || false,
        send_notification: sendNotification || true
      })
      .eq('id', formationId)
      .select()

    if (error) {
      console.error('Erreur lors de la mise à jour de la formation:', error)
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
    console.error('Erreur API admin formations PUT:', error)
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
    // UNIQUEMENT celles liées aux produits de catégorie "capsules"
    // Les autres catégories (analyse-financiere, pack, ebook, abonnement) n'apparaissent pas dans "Formations et Sessions"
    
    // Récupérer toutes les formations
    const { data: allFormations, error: formationsError } = await supabaseAdmin!
      .from('formations')
      .select('*')
      .order('created_at', { ascending: false })

    if (formationsError) {
      console.error('Erreur lors de la récupération des formations:', formationsError)
      return NextResponse.json(
        { error: formationsError.message },
        { status: 500 }
      )
    }

    // Récupérer tous les produits pour vérifier leur catégorie
    const { data: allProducts, error: productsError } = await supabaseAdmin!
      .from('products')
      .select('id, category')

    if (productsError) {
      console.error('Erreur lors de la récupération des produits:', productsError)
      // Continuer même si on ne peut pas récupérer les produits
    }

    // Créer un map des catégories de produits
    const productCategories = new Map<string, string>()
    if (allProducts) {
      allProducts.forEach((p: any) => {
        productCategories.set(p.id, p.category || 'capsules')
      })
    }

    // Filtrer les formations pour ne garder que celles liées aux produits de catégorie "capsules"
    // Ou les capsules prédéfinies (capsule1-5)
    const formations = (allFormations || []).filter((formation: any) => {
      const capsuleId = formation.capsule_id
      
      // Les capsules prédéfinies (capsule1-5) sont toujours affichées
      if (capsuleId && /^capsule[1-5]$/.test(capsuleId)) {
        return true
      }
      
      // Vérifier si le produit associé est de catégorie "capsules"
      const productCategory = productCategories.get(capsuleId)
      return productCategory === 'capsules'
    })

    console.log(`Nombre de formations récupérées depuis la base de données: ${(allFormations || []).length}`)
    console.log(`Nombre de formations filtrées (catégorie capsules uniquement): ${formations.length}`)
    
    // Log toutes les formations brutes pour débogage
    if (formations && formations.length > 0) {
      console.log('Formations brutes:', formations.map((f: any) => ({
        id: f.id,
        session_name: f.session_name,
        capsule_id: f.capsule_id,
        date_scheduled: f.date_scheduled,
        created_at: f.created_at
      })))
    } else {
      console.warn('Aucune formation trouvée dans la base de données')
    }

    // Adapter le format des données
    const adaptedFormations = (formations || []).map((formation: any) => {
      // Calculer le numéro de capsule à partir de l'ID (capsule1 -> 1, capsule2 -> 2, etc.)
      const capsuleNumber = formation.capsule_id && formation.capsule_id.match(/capsule(\d+)/) 
        ? parseInt(formation.capsule_id.match(/capsule(\d+)/)![1]) 
        : 0;
      
      // Gérer les cas où date_scheduled et time_scheduled peuvent être null (formations vierges)
      const dateScheduled = formation.date_scheduled || null
      const timeScheduled = formation.time_scheduled || null
      
      return {
        id: formation.id,
        title: formation.session_name,
        capsule_id: formation.capsule_id || null,
        capsule_number: capsuleNumber,
        date: dateScheduled,
        time: timeScheduled,
        inscrits: formation.inscrits || 0,
        zoom_link: formation.zoom_link || null,
        status: formation.status || 'a_venir'
      }
    })

    console.log(`Nombre de formations adaptées: ${adaptedFormations.length}`)

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

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const formationId = searchParams.get('formationId')
    const deleteCompletely = searchParams.get('deleteCompletely') === 'true'

    if (!formationId) {
      return NextResponse.json(
        { error: 'ID de formation manquant' },
        { status: 400 }
      )
    }

    if (deleteCompletely) {
      // Supprimer complètement la formation
      const { error } = await supabaseAdmin!
        .from('formations')
        .delete()
        .eq('id', formationId)

      if (error) {
        console.error('Erreur lors de la suppression complète de la formation:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Formation supprimée définitivement avec succès.'
      })
    } else {
      // Au lieu de supprimer la formation, on supprime juste la date et l'heure
      // Cela permet de garder la formation dans "Formations disponibles" mais sans date/heure
      const { error } = await supabaseAdmin!
        .from('formations')
        .update({
          date_scheduled: null,
          time_scheduled: null
        })
        .eq('id', formationId)

      if (error) {
        console.error('Erreur lors de la suppression de la date/heure:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Date et heure supprimées avec succès. La formation reste disponible.'
      })
    }

  } catch (error) {
    console.error('Erreur API admin formations DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

