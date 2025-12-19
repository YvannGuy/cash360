import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

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
            } catch {
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
      // 6. Vérifier les coaching
      else if (product?.category === 'coaching') {
        paymentType = 'coaching'
        console.log(`[VERIFY-PAYMENT] ✅ Coaching détecté: ${item.id} → paymentType: coaching`)
      }
      // 7. Vérifier les masterclass
      else if (product?.category === 'masterclass') {
        paymentType = 'masterclass'
        console.log(`[VERIFY-PAYMENT] ✅ Masterclass détectée: ${item.id} → paymentType: masterclass`)
      }
      // 8. Vérifier les capsules de la boutique (par catégorie)
      else if (product?.category === 'capsules') {
        paymentType = 'capsule'
        console.log(`[VERIFY-PAYMENT] ✅ Capsule boutique détectée: ${item.id} → paymentType: capsule`)
      }
      // 9. Sinon, par défaut 'capsule'
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
      
      // Créer une entrée dans analyses pour chaque NOUVEAU paiement d'analyse financière
      // Fonction helper pour générer un ticket court
      const generateShortTicket = (): string => {
        const numbers = Math.floor(10000 + Math.random() * 90000) // 10000-99999
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const letter = letters[Math.floor(Math.random() * letters.length)]
        return `${numbers}${letter}`
      }
      
      for (const payment of insertedPayments) {
        // Vérifier si c'est un paiement d'analyse financière
        const isAnalysis = payment.product_id === 'analyse-financiere' || 
                          payment.payment_type === 'analysis' ||
                          (products?.find(p => p.id === payment.product_id) as any)?.category === 'analyse-financiere'
        
        if (isAnalysis) {
          try {
            // Récupérer les informations utilisateur
            const userEmail = user.email || ''
            const firstName = user.user_metadata?.first_name || ''
            const lastName = user.user_metadata?.last_name || ''
            const clientName = `${firstName} ${lastName}`.trim() || userEmail.split('@')[0] || 'Client'
            
            // Générer un ticket unique
            const ticket = `CASH-${generateShortTicket()}`
            
            // Créer l'entrée dans analyses - TOUJOURS créer une nouvelle analyse pour chaque nouveau paiement
            const { data: analysis, error: analysisError } = await supabaseAdmin!
              .from('analyses')
              .insert({
                ticket: ticket,
                client_name: clientName,
                client_email: userEmail,
                status: 'en_cours',
                progress: 10,
                mode_paiement: 'Stripe',
                message: null,
                user_id: user.id
              })
              .select()
              .single()
            
            if (analysisError) {
              console.error('[VERIFY-PAYMENT] ❌ Erreur création analyse:', analysisError)
              // Si l'erreur est une contrainte unique ou doublon, c'est OK
              if (analysisError.code === '23505' || analysisError.message?.includes('duplicate')) {
                console.log('[VERIFY-PAYMENT] ⚠️ Analyse déjà existante (doublon détecté), on continue')
              }
            } else {
              console.log(`[VERIFY-PAYMENT] ✅ Nouvelle analyse créée: ${ticket} (ID: ${analysis?.id || 'N/A'}) pour utilisateur ${user.id} (paiement: ${payment.transaction_id})`)
            }
          } catch (error) {
            console.error('[VERIFY-PAYMENT] ❌ Erreur lors de la création de l\'analyse:', error)
          }
        }
      }
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
      // Si c'est une capsule, masterclass ou coaching de la boutique
      else if (productCategory === 'capsules' || productCategory === 'masterclass' || productCategory === 'coaching') {
        console.log(`✅ Produit boutique ${item.id} (${productCategory}) ajouté`)
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
    if (paymentEntries.length > 0 && insertedPayments && insertedPayments.length > 0) {
      // Re-vérifier que les paiements existent bien dans la DB
      const { data: verificationPayments } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .in('transaction_id', paymentEntries.map(p => p.transaction_id))
      
      console.log(`[VERIFY-PAYMENT] 🔍 Vérification finale: ${verificationPayments?.length || 0} paiement(s) trouvé(s) dans DB`)
      
      if (!verificationPayments || verificationPayments.length === 0) {
        console.error('[VERIFY-PAYMENT] ⚠️ ATTENTION: Les paiements ont été créés mais ne sont pas retrouvés en DB')
      } else {
        // Envoyer les emails de confirmation de paiement
        try {
          const userEmail = user.email || ''
          const userName = user.user_metadata?.full_name || 
                          user.user_metadata?.name ||
                          userEmail.split('@')[0] || 
                          'Client'
          const firstName = userName.split(' ')[0] || userName
          
          // Capsules prédéfinies
          const capsuleNames: { [key: string]: string } = {
            'capsule1': "L'éducation financière",
            'capsule2': 'La mentalité de pauvreté',
            'capsule3': "Les lois spirituelles liées à l'argent",
            'capsule4': 'Les combats liés à la prospérité',
            'capsule5': 'Épargne et Investissement'
          }
          
          // Grouper les paiements par produit pour éviter les doublons
          const productsMap = new Map()
          
          for (const payment of verificationPayments) {
            const productId = payment.product_id
            const paymentType = payment.payment_type
            const amount = payment.amount
            
            // Récupérer le nom du produit
            let productName = productId
            
            // Vérifier si c'est une capsule prédéfinie
            if (/^capsule[1-5]$/.test(productId)) {
              productName = capsuleNames[productId] || productId
            } else {
              // Chercher dans les produits récupérés
              const product = products?.find(p => p.id === productId)
              if (product) {
                productName = product.name || productId
              }
            }
            
            // Déterminer le type de produit en français
            let productTypeLabel = 'Produit'
            switch (paymentType) {
              case 'analysis':
                productTypeLabel = 'Analyse financière'
                break
              case 'capsule':
                productTypeLabel = 'Capsule'
                break
              case 'pack':
                productTypeLabel = 'Pack'
                break
              case 'ebook':
                productTypeLabel = 'Ebook'
                break
              case 'abonnement':
                productTypeLabel = 'Abonnement'
                break
              default:
                productTypeLabel = 'Produit'
            }
            
            // Compter les quantités par produit
            if (!productsMap.has(productId)) {
              productsMap.set(productId, {
                id: productId,
                name: productName,
                type: productTypeLabel,
                quantity: 1,
                totalAmount: amount
              })
            } else {
              const existing = productsMap.get(productId)
              existing.quantity += 1
              existing.totalAmount += amount
            }
          }
          
          // Convertir la Map en tableau
          const uniqueProducts = Array.from(productsMap.values())
          
          // Calculer le montant total
          const totalAmount = uniqueProducts.reduce((sum, p) => sum + p.totalAmount, 0)
          
          // Vérifier si les emails ont déjà été envoyés (via webhook) en vérifiant dans les logs ou un flag
          // Pour l'instant, on envoie toujours les emails pour garantir l'envoi
          console.log('[VERIFY-PAYMENT] 📧 Préparation envoi emails pour paiement:', sessionId.replace(/^cs_test_/, '').substring(0, 8))
          
          // Générer et envoyer l'email admin
          const adminEmailHtml = generatePaymentAdminEmailHtml(
            firstName,
            userName,
            userEmail,
            uniqueProducts,
            totalAmount,
            sessionId
          )
          
          const adminEmail = process.env.MAIL_ADMIN || process.env.DESTINATION_EMAIL || 'cash@cash360.finance'
          console.log('[VERIFY-PAYMENT] 📧 Envoi email admin à:', adminEmail)
          try {
            await sendMail({
              to: adminEmail,
              subject: `[Cash360] Nouveau paiement reçu – ${firstName} ${userName} – ${sessionId.replace(/^cs_test_/, '').substring(0, 8)}`,
              html: adminEmailHtml
            })
            console.log('[VERIFY-PAYMENT] ✅ Email admin envoyé avec succès à:', adminEmail)
          } catch (adminEmailError: any) {
            console.error('[VERIFY-PAYMENT] ❌ Erreur envoi email admin:', adminEmailError)
            console.error('[VERIFY-PAYMENT] Détails erreur admin email:', JSON.stringify(adminEmailError, null, 2))
            // Continuer même si l'email admin échoue
          }
          
          // Attendre 1 seconde pour respecter les limites de rate
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Générer et envoyer l'email client
          const clientEmailHtml = generatePaymentClientEmailHtml(
            firstName,
            uniqueProducts,
            totalAmount,
            sessionId
          )
          
          console.log('[VERIFY-PAYMENT] 📧 Envoi email client à:', userEmail)
          await sendMail({
            to: userEmail,
            subject: `Cash360 – Confirmation de paiement – ${sessionId.replace(/^cs_test_/, '').substring(0, 8)}`,
            html: clientEmailHtml
          })
          
          console.log('[VERIFY-PAYMENT] ✅ Email client envoyé avec succès')
        } catch (emailError: any) {
          console.error('[VERIFY-PAYMENT] ❌ Erreur envoi emails:', emailError)
          console.error('[VERIFY-PAYMENT] Détails erreur email:', JSON.stringify(emailError, null, 2))
          // Ne pas bloquer le processus si les emails échouent
        }
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

// Fonction pour générer l'email admin de paiement
function generatePaymentAdminEmailHtml(
  firstName: string,
  fullName: string,
  userEmail: string,
  products: Array<{ id: string; name: string; type: string; quantity: number; totalAmount: number }>,
  totalAmount: number,
  transactionId: string
): string {
  const timestamp = new Date().toLocaleString('fr-FR')
  
  // Générer la liste des produits
  const productsList = products.map(product => `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #3b82f6;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: #1f2937; font-size: 16px;">${product.name}</strong>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${product.type}${product.quantity > 1 ? ` x${product.quantity}` : ''}</p>
        </div>
        <div style="text-align: right;">
          <strong style="color: #1f2937; font-size: 16px;">${product.totalAmount.toFixed(2)} €</strong>
        </div>
      </div>
    </div>
  `).join('')
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e293b, #1e40af); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">💳 Nouveau paiement reçu - Cash360</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</p>
        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">Paiement validé avec succès</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">Informations client</h2>
        
        <div style="margin-bottom: 15px;">
          <strong>Nom complet:</strong> ${fullName}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Email:</strong> ${userEmail}
        </div>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 20px;">
          <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">💳 Produits achetés</h3>
          ${productsList}
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #065f46; font-size: 18px;">Total:</strong>
              <strong style="color: #065f46; font-size: 20px;">${totalAmount.toFixed(2)} €</strong>
            </div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p>Email généré automatiquement le ${timestamp}</p>
      </div>
    </div>
  `
}

// Fonction pour générer l'email client de paiement
function generatePaymentClientEmailHtml(
  firstName: string,
  products: Array<{ id: string; name: string; type: string; quantity: number; totalAmount: number }>,
  totalAmount: number,
  transactionId: string
): string {
  // Générer la liste des produits
  const productsList = products.map(product => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
      <div>
        <span style="color: #1f2937; font-weight: 500; font-size: 15px;">${product.name}</span>
        <span style="color: #6b7280; font-size: 13px; margin-left: 8px;">(${product.type}${product.quantity > 1 ? ` x${product.quantity}` : ''})</span>
      </div>
      <span style="color: #1f2937; font-weight: 600; font-size: 15px;">${product.totalAmount.toFixed(2)} €</span>
    </div>
  `).join('')
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      
      <!-- Header avec logo -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; text-align: center;">
        <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px; font-weight: bold;">✓</span>
        </div>
        <h1 style="margin: 0; font-size: 28px; color: #1f2937; font-weight: 600;">Merci pour votre achat !</h1>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;"><strong style="color: #1f2937;">${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</strong></p>
      </div>

      <!-- Contenu principal -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Bonjour <strong>${firstName}</strong>,<br><br>
          Merci pour votre confiance ! Votre paiement a été validé avec succès.
        </p>

        <!-- Produits achetés -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 20px; text-align: center;">Vos achats</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${productsList}
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #1f2937; font-size: 18px;">Total:</strong>
                <strong style="color: #1f2937; font-size: 20px;">${totalAmount.toFixed(2)} €</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Prochaines étapes -->
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 30px;">
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; margin-right: 12px; color: #3b82f6;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 600;">Accédez à vos achats</h3>
              <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                Vous pouvez maintenant accéder à vos produits dans votre <strong>dashboard</strong> dans l'onglet <strong>"Mes achats"</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Besoin d'aide ?</h3>
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
            Pour toute question concernant votre achat :
          </p>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; margin-right: 8px; color: #6b7280;">
              <svg style="width: 100%; height: 100%;" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
            </div>
            <a href="mailto:cash@cash360.finance" style="color: #3b82f6; text-decoration: none; font-weight: 500;">cash@cash360.finance</a>
          </div>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
            Référencez <strong>${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</strong> dans votre email
          </p>
        </div>

        <!-- Récapitulatif -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Récapitulatif</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Nombre de produits:</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${products.length}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Montant total:</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${totalAmount.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">ID:</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 14px; font-family: monospace;">${transactionId.replace(/^cs_test_/, '').substring(0, 8)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280; font-size: 14px;">Statut :</span>
            <span style="color: #10b981; font-weight: 500; font-size: 14px;">✓ Payé</span>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">Cash360 - Transformation financière et spirituelle</p>
      </div>
    </div>
  `
}

