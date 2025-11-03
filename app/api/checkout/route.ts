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
    const paymentEntries = await Promise.all(
      items.map(async (item: any) => {
        const product = products.find(p => p.id === item.id)
        const paymentType = product?.is_pack ? 'pack' : 'capsule'
        
        return {
          user_id: user.id,
          product_id: item.id,
          payment_type: paymentType,
          amount: parseFloat(product.price) * item.quantity,
          currency: 'EUR',
          status: 'success', // TODO: Intégrer un vrai système de paiement (Stripe, PayPal, etc.)
          method: 'PayPal', // TODO: Déterminer dynamiquement
          created_at: new Date().toISOString()
        }
      })
    )

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
    const capsuleEntries = []
    for (const item of items) {
      const product = products.find(p => p.id === item.id)
      
      // Si c'est un pack, on ajoute toutes les capsules individuelles
      if (product?.is_pack) {
        // Récupérer toutes les capsules individuelles
        const { data: allCapsules } = await supabase
          .from('products')
          .select('id')
          .eq('is_pack', false)
          .neq('id', 'analyse-financiere') // Exclure l'analyse financière des capsules pack
        
        if (allCapsules && allCapsules.length > 0) {
          for (const capsule of allCapsules) {
            capsuleEntries.push({
              user_id: user.id,
              capsule_id: capsule.id,
              created_at: new Date().toISOString()
            })
          }
        }
      } else {
        // Sinon, on ajoute juste la capsule achetée
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

