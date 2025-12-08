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

    const { data: products, error } = await supabaseAdmin!
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des produits:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      products: products || []
    })
  } catch (error) {
    console.error('Erreur API admin products GET:', error)
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
      name,
      description,
      nameFr,
      nameEn,
      nameEs,
      namePt,
      descriptionFr,
      descriptionEn,
      descriptionEs,
      descriptionPt,
      price,
      originalPrice,
      isPack,
      imageUrl,
      isOneTime,
      productType,
      capsuleId,
      appearsInFormations,
      category,
      pdfUrl
    } = body

    // Validation - au moins le nom français doit être fourni
    const productName = nameFr || name || nameEn || nameEs || namePt
    if (!productName || !price) {
      return NextResponse.json(
        { error: 'Nom (au moins en français) et prix sont obligatoires' },
        { status: 400 }
      )
    }

    // Générer un ID automatique basé sur le nom du produit
    const generateProductId = (productName: string): string => {
      const baseId = productName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, '') // Enlever les tirets en début/fin
        .substring(0, 50) // Limiter la longueur
      
      // Ajouter un timestamp pour garantir l'unicité
      const timestamp = Date.now().toString().slice(-6)
      return `${baseId}-${timestamp}`
    }

    const autoId = generateProductId(productName)

    const { data, error } = await supabaseAdmin!
      .from('products')
      .insert({
        id: autoId,
        name: name || nameFr || productName, // Fallback pour compatibilité
        description: description || descriptionFr || null, // Fallback pour compatibilité
        name_fr: nameFr || name || null,
        name_en: nameEn || null,
        name_es: nameEs || null,
        name_pt: namePt || null,
        description_fr: descriptionFr || description || null,
        description_en: descriptionEn || null,
        description_es: descriptionEs || null,
        description_pt: descriptionPt || null,
        price,
        original_price: originalPrice || null,
        is_pack: isPack || false,
        image_url: imageUrl || null,
        available: true,
        is_one_time: isOneTime !== undefined ? isOneTime : true,
        product_type: productType || null,
        capsule_id: capsuleId || null,
        appears_in_formations: appearsInFormations !== false, // Par défaut true
        category: category || 'capsules', // Catégorie du produit
        pdf_url: pdfUrl || null // URL du PDF pour ebook
      })
      .select()

    if (error) {
      console.error('Erreur lors de la création du produit:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Créer automatiquement une formation SEULEMENT si la catégorie est "capsules"
    // Les autres catégories (analyse-financiere, pack, ebook, abonnement) n'apparaissent pas dans "Formations et Sessions"
    const productCategory = category || 'capsules'
    
    if (productCategory === 'capsules' || productCategory === 'masterclass' || productCategory === 'coaching') {
      console.log('Création de la formation associée au produit (catégorie capsules):', { productId: autoId, productName: name })
      
      // Déterminer le type de session basé sur la catégorie du produit
      // La contrainte CHECK semble n'accepter que certaines valeurs
      // Utiliser le type approprié selon la catégorie
      // L'admin pourra modifier le type plus tard dans "Formations et Sessions"
      let sessionType = 'Capsule'
      if (productCategory === 'masterclass') {
        sessionType = 'Webinaire'
      } else if (productCategory === 'coaching') {
        sessionType = 'Workshop'
      }
      
      // Utiliser l'ID du produit comme capsule_id pour lier la formation au produit
      const formationCapsuleId = capsuleId || autoId
      
      // Créer une formation vierge (sans date/heure) pour que l'admin puisse la compléter plus tard
      // date_scheduled et time_scheduled sont maintenant optionnels grâce à la migration
      const formationDataToInsert = {
        capsule_id: formationCapsuleId,
        session_name: productName, // Utiliser le nom traduit
        session_type: sessionType,
        duration: 60,
        date_scheduled: null, // Laisser vide pour "Session en cours de planification"
        time_scheduled: null, // Laisser vide pour "Session en cours de planification"
        description: descriptionFr || description || null,
        zoom_link: null,
        max_participants: 50,
        timezone: 'Europe/Paris',
        access_type: 'tous',
        price: price,
        require_payment: true,
        status: 'a_venir'
      }
      
      console.log('Données de la formation à créer:', formationDataToInsert)
      
      const { data: formationData, error: formationError } = await supabaseAdmin!
        .from('formations')
        .insert(formationDataToInsert)
        .select()

      if (formationError) {
        console.error('❌ ERREUR lors de la création de la formation associée:', formationError)
        console.error('Code erreur:', formationError.code)
        console.error('Message:', formationError.message)
        console.error('Détails:', JSON.stringify(formationError, null, 2))
        console.error('Données tentatives:', formationDataToInsert)
        // Ne pas faire échouer la création du produit si la formation échoue, mais loguer l'erreur
        // Retourner un warning dans la réponse
        return NextResponse.json({
          success: true,
          product: data[0],
          warning: `Produit créé avec succès mais la formation associée n'a pas pu être créée: ${formationError.message}`,
          formationError: formationError.message
        })
      } else {
        console.log('✅ Formation créée avec succès!')
        console.log('Formation ID:', formationData?.[0]?.id)
        console.log('Formation capsule_id:', formationData?.[0]?.capsule_id)
        console.log('Formation session_name:', formationData?.[0]?.session_name)
        
        return NextResponse.json({
          success: true,
          product: data[0],
          formationCreated: true,
          formation: formationData?.[0]
        })
      }
    } else {
      // Produit d'une autre catégorie - ne pas créer de formation
      console.log(`Produit de catégorie "${productCategory}" - aucune formation créée (non visible dans "Formations et Sessions")`)
      return NextResponse.json({
        success: true,
        product: data[0],
        formationCreated: false,
        message: `Produit créé avec succès. Les produits de catégorie "${productCategory}" n'apparaissent pas dans "Formations et Sessions".`
      })
    }
  } catch (error) {
    console.error('Erreur API admin products POST:', error)
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
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'ID produit manquant' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      nameFr,
      nameEn,
      nameEs,
      namePt,
      descriptionFr,
      descriptionEn,
      descriptionEs,
      descriptionPt,
      price,
      originalPrice,
      isPack,
      imageUrl,
      available,
      isOneTime,
      productType,
      capsuleId,
      appearsInFormations,
      category,
      pdfUrl
    } = body

    // Validation - au moins le nom français doit être fourni
    const productName = nameFr || name || nameEn || nameEs || namePt
    if (!productName || !price) {
      return NextResponse.json(
        { error: 'Nom (au moins en français) et prix sont obligatoires' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin!
      .from('products')
      .update({
        name: name || nameFr || productName, // Fallback pour compatibilité
        description: description || descriptionFr || null, // Fallback pour compatibilité
        name_fr: nameFr !== undefined ? nameFr : null,
        name_en: nameEn !== undefined ? nameEn : null,
        name_es: nameEs !== undefined ? nameEs : null,
        name_pt: namePt !== undefined ? namePt : null,
        description_fr: descriptionFr !== undefined ? descriptionFr : null,
        description_en: descriptionEn !== undefined ? descriptionEn : null,
        description_es: descriptionEs !== undefined ? descriptionEs : null,
        description_pt: descriptionPt !== undefined ? descriptionPt : null,
        price,
        original_price: originalPrice || null,
        is_pack: isPack || false,
        image_url: imageUrl || null,
        available: available !== undefined ? available : true,
        is_one_time: isOneTime !== undefined ? isOneTime : true,
        product_type: productType || null,
        capsule_id: capsuleId || null,
        appears_in_formations: appearsInFormations !== false, // Par défaut true
        category: category || 'capsules', // Catégorie du produit
        pdf_url: pdfUrl !== undefined ? pdfUrl : undefined, // URL du PDF pour ebook (undefined pour ne pas écraser si non fourni)
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()

    if (error) {
      console.error('Erreur lors de la mise à jour du produit:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Mettre à jour aussi la formation associée si la catégorie est "capsules", "masterclass" ou "coaching"
    const productCategory = category || 'capsules'
    
    if (productCategory === 'capsules' || productCategory === 'masterclass' || productCategory === 'coaching') {
      // Déterminer le type de session basé sur la catégorie
      let sessionType = 'Capsule'
      if (productCategory === 'masterclass') {
        sessionType = 'Webinaire'
      } else if (productCategory === 'coaching') {
        sessionType = 'Workshop'
      }
      const { error: formationError } = await supabaseAdmin!
        .from('formations')
        .update({
          capsule_id: capsuleId || productId,
          session_name: productName, // Utiliser le nom traduit
          session_type: sessionType,
          description: descriptionFr || description || null,
          price: price
        })
        .eq('capsule_id', productId)

      if (formationError) {
        console.error('Erreur lors de la mise à jour de la formation associée:', formationError)
        // Ne pas faire échouer la mise à jour du produit si la formation échoue
      } else {
        console.log('Formation associée mise à jour pour le produit:', productId)
      }
    } else {
      // Si la catégorie change de "capsules" à autre chose, la formation ne sera plus visible dans "Formations et Sessions"
      // (elle sera automatiquement filtrée par le GET)
      console.log(`Produit de catégorie "${productCategory}" - la formation associée (si elle existe) ne sera plus visible dans "Formations et Sessions"`)
    }

    return NextResponse.json({
      success: true,
      product: data[0]
    })
  } catch (error) {
    console.error('Erreur API admin products PUT:', error)
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
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'ID produit manquant' },
        { status: 400 }
      )
    }

    // Récupérer le produit pour vérifier son type
    const { data: product } = await supabaseAdmin!
      .from('products')
      .select('product_type')
      .eq('id', productId)
      .single()

    // Supprimer d'abord les inscriptions associées si c'est une formation
    if (product?.product_type === 'formation' || product?.product_type === 'capsule') {
      // Trouver la formation associée
      const { data: formation } = await supabaseAdmin!
        .from('formations')
        .select('id')
        .eq('capsule_id', productId)
        .single()

      if (formation) {
        // Supprimer les inscriptions
        await supabaseAdmin!
          .from('formation_registrations')
          .delete()
          .eq('formation_id', formation.id)

        // Supprimer la formation
        await supabaseAdmin!
          .from('formations')
          .delete()
          .eq('id', formation.id)
      }
    }

    const { error } = await supabaseAdmin!
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Erreur lors de la suppression du produit:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Erreur API admin products DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

