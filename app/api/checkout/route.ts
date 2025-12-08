import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Récupérer les items du panier depuis la requête
    const { items, total } = await request.json()
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Panier vide ou invalide' },
        { status: 400 }
      )
    }

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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Valider que les produits existent dans la DB
    const productIds = items.map(item => item.id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
    
    if (productsError || !products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Produits invalides' },
        { status: 400 }
      )
    }

    // Calculer le montant total depuis les produits DB (sécurité)
    const calculatedTotal = items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.id)
      return sum + (parseFloat(product?.price) || 0) * item.quantity
    }, 0)

    if (Math.abs(calculatedTotal - total) > 0.01) {
      return NextResponse.json(
        { error: 'Montant total invalide' },
        { status: 400 }
      )
    }

    // Créer les paiements
    // IMPORTANT : Pour l'analyse financière avec quantité > 1, créer un paiement par quantité
    const paymentEntries = []
    
    for (const item of items) {
      const product = products.find(p => p.id === item.id)
      
      // Déterminer le type de paiement selon le produit
      let paymentType = 'capsule' // Par défaut
      
      // Vérifier d'abord si c'est l'analyse financière (par ID ou catégorie)
      if (item.id === 'analyse-financiere' || product?.category === 'analyse-financiere' || product?.id === 'analyse-financiere') {
        paymentType = 'analysis'
      } 
      // Vérifier les packs (par catégorie ou is_pack)
      else if (product?.category === 'pack' || product?.is_pack) {
        paymentType = 'pack'
      } 
      // Vérifier les ebooks
      else if (product?.category === 'ebook') {
        paymentType = 'ebook'
      } 
      // Vérifier les abonnements
      else if (product?.category === 'abonnement') {
        paymentType = 'abonnement'
      } 
      // Vérifier les capsules prédéfinies (capsule1-5)
      else if (/^capsule[1-5]$/.test(item.id)) {
        paymentType = 'capsule'
      } 
      // Vérifier les capsules de la boutique (par catégorie)
      else if (product?.category === 'capsules') {
        paymentType = 'capsule'
      }
      // Sinon, par défaut 'capsule' pour les capsules prédéfinies non reconnues
      
      const unitAmount = parseFloat(product?.price || '0')
      
      // Créer UN paiement par quantité pour l'analyse financière
      // Exemple : quantity = 3 → 3 paiements distincts (3 analyses possibles)
      for (let qty = 0; qty < item.quantity; qty++) {
        paymentEntries.push({
          user_id: user.id,
          product_id: item.id,
          payment_type: paymentType,
          amount: unitAmount,
          currency: 'EUR',
          status: 'success', // TODO: Intégrer un vrai système de paiement (Stripe, PayPal, etc.)
          method: 'PayPal', // TODO: Déterminer dynamiquement
          transaction_id: `paypal-${Date.now()}-${item.id}-${qty}`,
          created_at: new Date().toISOString()
        })
      }
    }

    // Insérer les paiements
    const { error: paymentsError } = await supabase
      .from('payments')
      .insert(paymentEntries)

    if (paymentsError) {
      console.error('Erreur insertion paiements:', paymentsError)
      return NextResponse.json(
        { error: 'Erreur lors du paiement' },
        { status: 500 }
      )
    }

    // Créer les capsules achetées (user_capsules)
    // LOGIQUE: Seulement si category = 'capsules' OU capsule prédéfinie (capsule1-5) OU pack
    // EXCLURE "analyse-financiere", "ebook", "abonnement"
    const capsuleEntries = []
    for (const item of items) {
      // Vérifier si c'est une capsule prédéfinie (capsule1-5) - toujours ajoutée
      const isPredefinedCapsule = /^capsule[1-5]$/.test(item.id)
      if (isPredefinedCapsule) {
        console.log(`[CHECKOUT] ✅ Capsule prédéfinie ${item.id} ajoutée`)
        capsuleEntries.push({
          user_id: user.id,
          capsule_id: item.id,
          created_at: new Date().toISOString()
        })
        continue
      }
      
      // EXCLURE explicitement "analyse-financiere", ebooks et abonnements
      if (item.id === 'analyse-financiere') {
        console.log(`[CHECKOUT] ⏭️ Analyse financière ignorée - n'apparaît jamais dans "Mes achats"`)
        continue
      }
      
      const product = products.find(p => p.id === item.id)
      
      if (!product) {
        console.log(`[CHECKOUT] ⏭️ Produit ${item.id} ignoré car non trouvé dans products`)
        continue
      }
      
      // Vérifier la catégorie du produit
      const productCategory = (product as any)?.category || 'capsules'
      
      // Seules les capsules (catégorie 'capsules') et les packs doivent apparaître dans "Mes achats"
      if (productCategory === 'ebook' || productCategory === 'abonnement' || productCategory === 'analyse-financiere') {
        console.log(`[CHECKOUT] ⏭️ Produit ${item.id} ignoré - catégorie: ${productCategory}`)
        continue
      }
      
      // Si c'est un pack (category === 'pack' ou is_pack)
      if (productCategory === 'pack' || (product as any)?.is_pack) {
        console.log(`[CHECKOUT] ✅ Pack détecté ${item.id}, ajout des capsules individuelles`)
        // Récupérer toutes les capsules de la catégorie 'capsules'
        const { data: allCapsules } = await supabase
          .from('products')
          .select('id, category')
          .eq('category', 'capsules')
          .neq('id', 'analyse-financiere')
        
        if (allCapsules && allCapsules.length > 0) {
          for (const capsule of allCapsules) {
            capsuleEntries.push({
              user_id: user.id,
              capsule_id: capsule.id,
              created_at: new Date().toISOString()
            })
          }
        }
        // Ajouter aussi les 5 capsules prédéfinies
        for (let i = 1; i <= 5; i++) {
          capsuleEntries.push({
            user_id: user.id,
            capsule_id: `capsule${i}`,
            created_at: new Date().toISOString()
          })
        }
      } 
      // Si c'est une capsule, masterclass ou coaching de la boutique
      else if (productCategory === 'capsules' || productCategory === 'masterclass' || productCategory === 'coaching') {
        console.log(`[CHECKOUT] ✅ Produit boutique ${item.id} (${productCategory}) ajouté`)
        capsuleEntries.push({
          user_id: user.id,
          capsule_id: item.id,
          created_at: new Date().toISOString()
        })
      }
    }

    // Insérer les capsules achetées
    if (capsuleEntries.length > 0) {
      const { error: capsulesError } = await supabase
        .from('user_capsules')
        .insert(capsuleEntries)

      if (capsulesError) {
        console.error('Erreur insertion capsules:', capsulesError)
        // Ne pas échouer le paiement si l'insertion capsules échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Paiement effectué avec succès',
      payments: paymentEntries.length
    })

  } catch (error) {
    console.error('Erreur checkout:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

