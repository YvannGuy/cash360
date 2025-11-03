import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export async function POST(request: NextRequest) {
  console.log('🔍 API verify-payment appelée')
  try {
    const { sessionId, items } = await request.json()
    console.log('📋 Données reçues:', { sessionId, items })
    
    if (!sessionId) {
      console.log('❌ Pas de sessionId')
      return NextResponse.json(
        { error: 'Session ID manquant' },
        { status: 400 }
      )
    }

    // Vérifier la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log('💳 Session Stripe:', session.payment_status)
    
    if (session.payment_status !== 'paid') {
      console.log('❌ Paiement non complété:', session.payment_status)
      return NextResponse.json(
        { error: 'Paiement non complété' },
        { status: 400 }
      )
    }
    console.log('✅ Paiement confirmé')

    // Créer un client Supabase avec les cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Ignore
            }
          },
        },
      }
    )
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 Utilisateur autentifié:', user?.id, authError)
    if (authError || !user) {
      console.log('❌ Non authentifié')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier si le paiement a déjà été traité pour cette session
    // Utiliser supabaseAdmin pour la vérification car on veut lire tous les paiements
    if (!supabaseAdmin) {
      console.error('[VERIFY-PAYMENT] ❌ supabaseAdmin non initialisé')
      return NextResponse.json({
        success: false,
        error: 'Erreur serveur: supabaseAdmin non initialisé'
      }, { status: 500 })
    }
    
    const { data: existingPayments } = await supabaseAdmin
      .from('payments')
      .select('*')
      .or(`transaction_id.eq.${sessionId},transaction_id.ilike.%${sessionId}%`)
      .eq('status', 'success')

    console.log(`[VERIFY-PAYMENT] Paiements existants pour session ${sessionId}:`, existingPayments?.length)
    if (existingPayments && existingPayments.length > 0) {
      console.log('[VERIFY-PAYMENT] ✅ Paiement déjà traité, paiements existants:', existingPayments.map(p => ({
        id: p.id,
        product_id: p.product_id,
        payment_type: p.payment_type
      })))
      return NextResponse.json({
        success: true,
        message: 'Paiement déjà traité',
        existingPayments: existingPayments.length
      })
    }
    
    console.log(`[VERIFY-PAYMENT] Aucun paiement existant, création de ${items.length} paiement(s)`)

    // Récupérer les produits depuis la DB avec supabaseAdmin
    const productIds = items.map((item: any) => item.id).filter((id: string) => id && !/^capsule[1-5]$/.test(id))
    
    let products: any[] = []
    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabaseAdmin
        .from('products')
        .select('*')
        .in('id', productIds)
      
      if (productsError) {
        console.error('[VERIFY-PAYMENT] ❌ Erreur récupération produits:', productsError)
      } else {
        products = productsData || []
        console.log(`[VERIFY-PAYMENT] ${products.length} produit(s) trouvé(s):`, products.map(p => ({ id: p.id, category: p.category, name: p.name })))
      }
    }

    // Créer les paiements
    // IMPORTANT : Pour l'analyse financière avec quantité > 1, créer un paiement par quantité
    const paymentEntries = []
    
    for (const item of items) {
      console.log(`[VERIFY-PAYMENT] Traitement item: ${item.id} (quantité: ${item.quantity})`)
      
      const product = products.find(p => p.id === item.id)
      
      // Debug: vérifier si le produit existe
      if (!product && !/^capsule[1-5]$/.test(item.id)) {
        console.warn(`[VERIFY-PAYMENT] ⚠️ Produit ${item.id} NON TROUVÉ dans la table products!`)
      }
      
      // Déterminer le type de paiement selon le produit
      // IMPORTANT: Vérifier les capsules prédéfinies EN PREMIER car elles ne sont pas dans products
      let paymentType = 'capsule' // Par défaut
      
      // 1. Vérifier d'abord les capsules prédéfinies (capsule1-5) - PRIORITÉ ABSOLUE
      if (/^capsule[1-5]$/.test(item.id)) {
        paymentType = 'capsule'
        console.log(`[VERIFY-PAYMENT] ✅ Capsule prédéfinie détectée: ${item.id} → paymentType: capsule`)
      }
      // 2. Vérifier si c'est l'analyse financière (par ID ou catégorie)
      else if (item.id === 'analyse-financiere' || product?.category === 'analyse-financiere' || product?.id === 'analyse-financiere') {
        paymentType = 'analysis'
        console.log(`[VERIFY-PAYMENT] ✅ Analyse financière détectée: ${item.id} → paymentType: analysis`)
      } 
      // 3. Vérifier les packs (par catégorie ou is_pack)
      else if (product?.category === 'pack' || product?.is_pack) {
        paymentType = 'pack'
        console.log(`[VERIFY-PAYMENT] ✅ Pack détecté: ${item.id} → paymentType: pack`)
      } 
      // 4. Vérifier les ebooks
      else if (product?.category === 'ebook') {
        paymentType = 'ebook'
        console.log(`[VERIFY-PAYMENT] ✅ Ebook détecté: ${item.id} → paymentType: ebook`)
      } 
      // 5. Vérifier les abonnements
      else if (product?.category === 'abonnement') {
        paymentType = 'abonnement'
        console.log(`[VERIFY-PAYMENT] ✅ Abonnement détecté: ${item.id} → paymentType: abonnement`)
      } 
      // 6. Vérifier les capsules de la boutique (par catégorie)
      else if (product?.category === 'capsules') {
        paymentType = 'capsule'
        console.log(`[VERIFY-PAYMENT] ✅ Capsule boutique détectée: ${item.id} → paymentType: capsule`)
      }
      // 7. Sinon, par défaut 'capsule'
      else {
        paymentType = 'capsule'
        console.log(`[VERIFY-PAYMENT] ⚠️ Type par défaut utilisé pour ${item.id}: capsule (product: ${product ? 'trouvé' : 'non trouvé'}, category: ${product?.category || 'N/A'})`)
      }
      
      console.log(`[VERIFY-PAYMENT] Type de paiement final pour ${item.id}:`, paymentType, { category: product?.category, isPack: product?.is_pack })
      
      // Calculer le montant unitaire : priorité au prix du produit, sinon au prix de l'item
      let unitAmount = 0
      if (product?.price) {
        unitAmount = parseFloat(product.price)
      } else if (item.price) {
        unitAmount = parseFloat(item.price.toString())
      } else {
        console.warn(`[VERIFY-PAYMENT] ⚠️ Aucun prix trouvé pour ${item.id}, utilisation de 0`)
        unitAmount = 0
      }
      
      console.log(`[VERIFY-PAYMENT] Montant unitaire pour ${item.id}:`, unitAmount, `(depuis product: ${product?.price || 'N/A'}, depuis item: ${item.price || 'N/A'})`)
      
      // Créer UN paiement par quantité pour tous les produits
      // Exemple : quantity = 3 → 3 paiements distincts (3 analyses possibles)
      for (let qty = 0; qty < item.quantity; qty++) {
        paymentEntries.push({
          user_id: user.id,
          product_id: item.id,
          payment_type: paymentType,
          amount: unitAmount,
          currency: 'EUR',
          status: 'success',
          method: 'Stripe',
          transaction_id: `${sessionId}-${item.id}-${qty}`,
          created_at: new Date().toISOString()
        })
      }
    }

    // Insérer les paiements
    console.log(`[VERIFY-PAYMENT] ===== INSERTION DE ${paymentEntries.length} PAIEMENT(S) =====`)
    console.log(`[VERIFY-PAYMENT] Paiements à insérer:`, paymentEntries.map(p => ({
      product_id: p.product_id,
      payment_type: p.payment_type,
      amount: p.amount,
      transaction_id: p.transaction_id
    })))
    
    if (paymentEntries.length === 0) {
      console.error('[VERIFY-PAYMENT] ❌ ERREUR: Aucun paiement à insérer!')
      return NextResponse.json({
        success: false,
        error: 'Aucun paiement à insérer'
      }, { status: 400 })
    }
    
    // IMPORTANT: Utiliser supabaseAdmin pour l'insertion des paiements
    // car cela nécessite des permissions élevées (bypass RLS)
    if (!supabaseAdmin) {
      console.error('[VERIFY-PAYMENT] ❌ supabaseAdmin non initialisé')
      return NextResponse.json({
        success: false,
        error: 'Erreur serveur: supabaseAdmin non initialisé'
      }, { status: 500 })
    }
    
    // Vérifier la structure des paiements avant insertion
    console.log(`[VERIFY-PAYMENT] ===== VÉRIFICATION AVANT INSERTION =====`)
    console.log(`[VERIFY-PAYMENT] Nombre de paiements à insérer: ${paymentEntries.length}`)
    
    // Valider chaque paiement avant insertion
    for (let i = 0; i < paymentEntries.length; i++) {
      const entry = paymentEntries[i]
      console.log(`[VERIFY-PAYMENT] Paiement ${i + 1}/${paymentEntries.length}:`, {
        user_id: entry.user_id,
        product_id: entry.product_id,
        payment_type: entry.payment_type,
        amount: entry.amount,
        currency: entry.currency,
        status: entry.status,
        method: entry.method,
        transaction_id: entry.transaction_id,
        created_at: entry.created_at
      })
      
      // Validation des champs requis
      if (!entry.user_id) {
        console.error(`[VERIFY-PAYMENT] ❌ Paiement ${i + 1}: user_id manquant!`)
      }
      if (!entry.product_id) {
        console.error(`[VERIFY-PAYMENT] ❌ Paiement ${i + 1}: product_id manquant!`)
      }
      if (!entry.payment_type) {
        console.error(`[VERIFY-PAYMENT] ❌ Paiement ${i + 1}: payment_type manquant!`)
      }
      if (entry.amount === undefined || entry.amount === null) {
        console.error(`[VERIFY-PAYMENT] ❌ Paiement ${i + 1}: amount manquant ou invalide!`)
      }
    }
    
    // Essayer d'insérer les paiements un par un si l'insertion en lot échoue
    let insertedPayments: any[] = []
    let paymentError: any = null
    
    try {
      const { data: insertedPaymentsData, error: insertError } = await supabaseAdmin
        .from('payments')
        .insert(paymentEntries)
        .select()
      
      if (insertError) {
        paymentError = insertError
        console.error('[VERIFY-PAYMENT] ❌ ERREUR insertion en lot:', insertError)
        
        // Essayer d'insérer un par un pour identifier le paiement problématique
        console.log('[VERIFY-PAYMENT] ⚠️ Tentative insertion un par un...')
        for (let i = 0; i < paymentEntries.length; i++) {
          const entry = paymentEntries[i]
          const { data: singleData, error: singleError } = await supabaseAdmin
            .from('payments')
            .insert(entry)
            .select()
          
          if (singleError) {
            console.error(`[VERIFY-PAYMENT] ❌ Erreur insertion paiement ${i + 1}:`, singleError)
            console.error(`[VERIFY-PAYMENT] Paiement problématique:`, JSON.stringify(entry, null, 2))
          } else {
            console.log(`[VERIFY-PAYMENT] ✅ Paiement ${i + 1} inséré avec succès:`, singleData?.[0])
            if (singleData && singleData.length > 0) {
              insertedPayments.push(singleData[0])
            }
          }
        }
      } else {
        insertedPayments = insertedPaymentsData || []
        console.log(`[VERIFY-PAYMENT] ✅ ${insertedPayments.length} paiement(s) inséré(s) avec succès en lot`)
      }
    } catch (insertException: any) {
      console.error('[VERIFY-PAYMENT] ❌ EXCEPTION lors de l\'insertion:', insertException)
      console.error('[VERIFY-PAYMENT] Stack trace:', insertException.stack)
      paymentError = insertException
    }
    
    // Si certains paiements ont échoué, on continue quand même si au moins un a réussi
    // On retourne un succès partiel plutôt qu'une erreur complète
    if (paymentError && insertedPayments.length === 0) {
      // Si aucun paiement n'a été inséré, c'est une erreur critique
      console.error('[VERIFY-PAYMENT] ❌ ERREUR insertion paiements:', paymentError)
      console.error('[VERIFY-PAYMENT] Code erreur:', paymentError.code)
      console.error('[VERIFY-PAYMENT] Message erreur:', paymentError.message)
      console.error('[VERIFY-PAYMENT] Hint:', paymentError.hint)
      console.error('[VERIFY-PAYMENT] Détails erreur:', JSON.stringify(paymentError, null, 2))
      console.error('[VERIFY-PAYMENT] Paiements tentés:', JSON.stringify(paymentEntries, null, 2))
      console.error('[VERIFY-PAYMENT] Nombre de paiements tentés:', paymentEntries.length)
      console.error('[VERIFY-PAYMENT] Paiements insérés avec succès:', insertedPayments.length)
      
      // Renvoyer l'erreur détaillée au client
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'insertion des paiements',
        details: paymentError.message || paymentError,
        code: paymentError.code,
        hint: paymentError.hint,
        paymentsInserted: insertedPayments.length,
        paymentsAttempted: paymentEntries.length
      }, { status: 500 })
    } else if (paymentError && insertedPayments.length > 0) {
      // Certains paiements ont été insérés avec succès, c'est un succès partiel
      console.warn(`[VERIFY-PAYMENT] ⚠️ Succès partiel: ${insertedPayments.length}/${paymentEntries.length} paiement(s) inséré(s)`)
      console.warn('[VERIFY-PAYMENT] Erreur lors de l\'insertion en lot:', paymentError)
      // On continue car au moins certains paiements ont été insérés
    }
    
    if (insertedPayments.length > 0) {
      console.log(`[VERIFY-PAYMENT] ✅ ${insertedPayments.length}/${paymentEntries.length} paiement(s) inséré(s) avec succès`)
      console.log('[VERIFY-PAYMENT] Paiements insérés:', insertedPayments.map(p => ({
        id: p.id,
        product_id: p.product_id,
        payment_type: p.payment_type,
        amount: p.amount
      })))
      
      // Vérifier les types de paiements insérés
      const byType = insertedPayments.reduce((acc: any, p: any) => {
        const type = p.payment_type || 'non défini'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      console.log('[VERIFY-PAYMENT] Paiements insérés par type:', byType)
    }

    // Créer les capsules achetées (user_capsules)
    // LOGIQUE: Seulement si category = 'capsules' OU capsule prédéfinie (capsule1-5) OU pack
    // EXCLURE "analyse-financiere", "ebook", "abonnement"
    const capsuleEntries = []
    for (const item of items) {
      // Vérifier si c'est une capsule prédéfinie (capsule1-5) - toujours ajoutée
      const isPredefinedCapsule = /^capsule[1-5]$/.test(item.id)
      if (isPredefinedCapsule) {
        console.log(`✅ Capsule prédéfinie ${item.id} ajoutée`)
        capsuleEntries.push({
          user_id: user.id,
          capsule_id: item.id,
          created_at: new Date().toISOString()
        })
        continue
      }
      
      // EXCLURE explicitement "analyse-financiere", ebooks et abonnements
      if (item.id === 'analyse-financiere') {
        console.log(`⏭️ Analyse financière ignorée - n'apparaît jamais dans "Mes achats"`)
        continue
      }
      
      const product = products.find(p => p.id === item.id)
      
      if (!product) {
        console.log(`⏭️ Produit ${item.id} ignoré car non trouvé dans products`)
        continue
      }
      
      // Vérifier la catégorie du produit
      const productCategory = (product as any)?.category || 'capsules'
      
      // EXCLURE uniquement "analyse-financiere" et "abonnement" (les abonnements ne doivent pas apparaître dans "Mes achats")
      // Les ebooks et packs DOIVENT apparaître dans "Mes achats"
      if (productCategory === 'abonnement' || productCategory === 'analyse-financiere') {
        console.log(`⏭️ Produit ${item.id} ignoré - catégorie: ${productCategory}`)
        continue
      }
      
      // Si c'est un ebook, l'ajouter directement (sans créer de sessions)
      if (productCategory === 'ebook') {
        console.log(`✅ Ebook ${item.id} ajouté à "Mes achats"`)
        capsuleEntries.push({
          user_id: user.id,
          capsule_id: item.id,
          created_at: new Date().toISOString()
        })
        continue
      }
      
      // Si c'est un pack (category === 'pack' ou is_pack)
      // IMPORTANT: Le pack est un produit indépendant, il n'achète pas toutes les capsules
      if (productCategory === 'pack' || (product as any)?.is_pack) {
        console.log(`✅ Pack détecté ${item.id}, ajout du pack uniquement (pas les capsules individuelles)`)
        // Ajouter uniquement le pack lui-même dans user_capsules
        capsuleEntries.push({
          user_id: user.id,
          capsule_id: item.id,
          created_at: new Date().toISOString()
        })
      } 
      // Si c'est une capsule de la boutique (category === 'capsules')
      else if (productCategory === 'capsules') {
        console.log(`✅ Capsule boutique ${item.id} ajoutée`)
        capsuleEntries.push({
          user_id: user.id,
          capsule_id: item.id,
          created_at: new Date().toISOString()
        })
      }
    }

    console.log(`[VERIFY-PAYMENT] ${capsuleEntries.length} capsule(s) à créer pour utilisateur ${user.id}`)
    console.log('[VERIFY-PAYMENT] Capsules à créer:', capsuleEntries.map(c => c.capsule_id))
    
    // Insérer les capsules achetées avec supabaseAdmin
    if (capsuleEntries.length > 0) {
      const { data: insertedCapsules, error: capsuleError } = await supabaseAdmin
        .from('user_capsules')
        .insert(capsuleEntries)
        .select()
      
      if (capsuleError) {
        console.error('[VERIFY-PAYMENT] ❌ Erreur insertion capsules:', capsuleError)
        console.error('[VERIFY-PAYMENT] Capsules tentées:', JSON.stringify(capsuleEntries, null, 2))
      } else {
        console.log(`[VERIFY-PAYMENT] ✅ ${insertedCapsules?.length || 0} capsule(s) insérée(s) avec succès`)
        console.log('[VERIFY-PAYMENT] Capsules insérées:', insertedCapsules?.map(c => c.capsule_id))
      }
    } else {
      console.log('[VERIFY-PAYMENT] ℹ️ Aucune capsule à insérer (analyse financière, ebook ou abonnement)')
    }

    // Vérifier que les paiements ont bien été insérés avant de retourner success
    if (paymentEntries.length > 0 && insertedPayments) {
      // Re-vérifier que les paiements existent bien dans la DB
      const { data: verificationPayments } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .in('transaction_id', paymentEntries.map(p => p.transaction_id))
      
      console.log(`[VERIFY-PAYMENT] 🔍 Vérification finale: ${verificationPayments?.length || 0} paiement(s) trouvé(s) dans DB`)
      
      if (!verificationPayments || verificationPayments.length === 0) {
        console.error('[VERIFY-PAYMENT] ⚠️ ATTENTION: Les paiements ont été créés mais ne sont pas retrouvés en DB')
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Paiement vérifié et capsules créées',
      paymentsCreated: paymentEntries.length,
      paymentsInserted: insertedPayments?.length || 0
    })

  } catch (error: any) {
    console.error('[VERIFY-PAYMENT] ❌ ERREUR GLOBALE:', error)
    console.error('[VERIFY-PAYMENT] Stack trace:', error.stack)
    console.error('[VERIFY-PAYMENT] Détails erreur:', JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

