import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClientServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeGraceUntil } from '@/lib/subscriptionAccess'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover'
})

const SUBSCRIPTION_PLAN_CODE = 'sagesse-salomon'
const SUBSCRIPTION_GRACE_DAYS = Number(process.env.SALOMON_GRACE_DAYS || '3')

const resolveCustomerId = (customer: Stripe.Customer | Stripe.DeletedCustomer | string | null): string | null => {
  if (!customer) return null
  if (typeof customer === 'string') return customer
  if ('id' in customer && !customer.deleted) return customer.id
  return null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin non configuré' }, { status: 500 })
    }

    // Récupérer le customer_id Stripe de l'utilisateur s'il existe
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('[SYNC] 🔍 Recherche abonnement pour:', {
      userId: user.id,
      email: user.email,
      existingSub: existingSub ? {
        stripe_customer_id: existingSub.stripe_customer_id,
        stripe_subscription_id: existingSub.stripe_subscription_id,
        status: existingSub.status
      } : null
    })

    let subscription: Stripe.Subscription | null = null

    // Si on a un subscription_id, récupérer directement MAIS toujours chercher les actifs
    // même si celui-ci est actif (pour prendre le plus récent)
    if (existingSub?.stripe_subscription_id) {
      try {
        const retrievedSub = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id)
        console.log('[SYNC] 📋 Abonnement stocké trouvé:', {
          id: retrievedSub.id,
          status: retrievedSub.status,
          created: new Date(retrievedSub.created * 1000).toISOString()
        })
        // Ne prendre que si l'abonnement est actif ou trialing
        if (retrievedSub.status === 'active' || retrievedSub.status === 'trialing') {
          subscription = retrievedSub
          console.log('[SYNC] ✅ Abonnement actif trouvé via subscription_id:', retrievedSub.id, 'status:', retrievedSub.status)
        } else {
          console.log('[SYNC] ⚠️ Abonnement stocké est annulé (status:', retrievedSub.status, '), recherche d\'un actif...')
        }
      } catch (error) {
        console.error('[SYNC] Erreur récupération subscription:', error)
      }
    }

    // TOUJOURS chercher les abonnements actifs, même si on a déjà trouvé un abonnement annulé
    // Chercher dans les customers Stripe (priorité aux abonnements actifs)
    if (existingSub?.stripe_customer_id) {
      try {
        // Récupérer TOUS les abonnements actifs et trialing pour prendre le plus récent
        const activeSubscriptions = await stripe.subscriptions.list({
          customer: existingSub.stripe_customer_id,
          status: 'active',
          limit: 100
        })
        const trialingSubscriptions = await stripe.subscriptions.list({
          customer: existingSub.stripe_customer_id,
          status: 'trialing',
          limit: 100
        })
        
        // Combiner et trier par date de création (plus récent en premier)
        const allActive = [...activeSubscriptions.data, ...trialingSubscriptions.data]
        if (allActive.length > 0) {
          const sorted = allActive.sort((a, b) => b.created - a.created)
          const mostRecentActive = sorted[0]
          // Toujours prendre le plus récent actif, même si on avait déjà trouvé un abonnement
          if (!subscription || subscription.status === 'canceled' || mostRecentActive.created > subscription.created) {
            subscription = mostRecentActive
            console.log('[SYNC] ✅ Abonnement actif/trialing le plus récent trouvé via customer_id:', {
              subscriptionId: subscription.id,
              status: subscription.status,
              created: new Date(subscription.created * 1000).toISOString(),
              totalFound: allActive.length,
              replacedPrevious: !!subscription && subscription.status === 'canceled'
            })
          }
        } else {
          // En dernier recours, prendre le plus récent NON annulé
          const allSubscriptions = await stripe.subscriptions.list({
            customer: existingSub.stripe_customer_id,
            status: 'all',
            limit: 100
          })
          if (allSubscriptions.data.length > 0) {
            // Filtrer les abonnements non annulés et trier par date de création (plus récent en premier)
            const nonCanceled = allSubscriptions.data.filter(s => s.status !== 'canceled')
            if (nonCanceled.length > 0) {
              const sorted = nonCanceled.sort((a, b) => b.created - a.created)
              subscription = sorted[0]
              console.log('[SYNC] ⚠️ Abonnement le plus récent non annulé trouvé (status:', subscription.status, '):', subscription.id)
            } else {
              // Si tous sont annulés, prendre le plus récent quand même
              const sorted = allSubscriptions.data.sort((a, b) => b.created - a.created)
              subscription = sorted[0]
              console.log('[SYNC] ⚠️ Tous les abonnements sont annulés, prise du plus récent:', subscription.id)
            }
          }
        }
      } catch (error) {
        console.error('[SYNC] Erreur liste subscriptions:', error)
      }
    }

    // Si toujours rien, chercher par email
    if (!subscription && user.email) {
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 10
        })
        console.log('[SYNC] 🔍 Recherche par email, customers trouvés:', customers.data.length)
        
        // Collecter tous les abonnements actifs/trialing de tous les customers
        const allActiveSubscriptions: Stripe.Subscription[] = []
        for (const customer of customers.data) {
          const activeSubscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 100
          })
          const trialingSubscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'trialing',
            limit: 100
          })
          allActiveSubscriptions.push(...activeSubscriptions.data, ...trialingSubscriptions.data)
        }
        
        // Prendre le plus récent actif
        if (allActiveSubscriptions.length > 0) {
          const sorted = allActiveSubscriptions.sort((a, b) => b.created - a.created)
          const mostRecentActive = sorted[0]
          // Toujours prendre le plus récent actif, même si on avait déjà trouvé un abonnement annulé
          if (!subscription || (subscription as any).status === 'canceled' || mostRecentActive.created > (subscription as any).created) {
            subscription = mostRecentActive
            console.log('[SYNC] ✅ Abonnement actif/trialing le plus récent trouvé via email:', {
              subscriptionId: subscription.id,
              status: subscription.status,
              created: new Date(subscription.created * 1000).toISOString(),
              totalFound: allActiveSubscriptions.length,
              replacedPrevious: subscription && subscription.status === 'canceled'
            })
          }
        }
      } catch (error) {
        console.error('[SYNC] Erreur recherche par email:', error)
      }
    }

    // Si on a trouvé un abonnement, le synchroniser
    if (subscription) {
      console.log('[SYNC] 🔍 Abonnement trouvé dans Stripe:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
        created: new Date(subscription.created * 1000).toISOString(),
        currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null
      })
      
      // Ne PAS synchroniser un abonnement annulé si on peut trouver un actif
      if (subscription.status === 'canceled') {
        console.log('[SYNC] ⚠️ Abonnement annulé trouvé, recherche d\'un abonnement actif...')
        
        // Chercher un abonnement actif dans tous les customers associés
        let activeSubscription: Stripe.Subscription | null = null
        
        // Chercher par customer_id si disponible
        if (subscription.customer && typeof subscription.customer === 'string') {
          try {
            const activeSubs = await stripe.subscriptions.list({
              customer: subscription.customer,
              status: 'active',
              limit: 100
            })
            const trialingSubs = await stripe.subscriptions.list({
              customer: subscription.customer,
              status: 'trialing',
              limit: 100
            })
            const allActive = [...activeSubs.data, ...trialingSubs.data]
            if (allActive.length > 0) {
              const sorted = allActive.sort((a, b) => b.created - a.created)
              activeSubscription = sorted[0]
              console.log('[SYNC] ✅ Abonnement actif trouvé pour remplacer l\'annulé:', activeSubscription.id)
            }
          } catch (error) {
            console.error('[SYNC] Erreur recherche abonnement actif:', error)
          }
        }
        
        // Chercher par email si toujours rien
        if (!activeSubscription && user.email) {
          try {
            const customers = await stripe.customers.list({
              email: user.email,
              limit: 10
            })
            for (const customer of customers.data) {
              const activeSubs = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'active',
                limit: 100
              })
              const trialingSubs = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'trialing',
                limit: 100
              })
              const allActive = [...activeSubs.data, ...trialingSubs.data]
              if (allActive.length > 0) {
                const sorted = allActive.sort((a, b) => b.created - a.created)
                activeSubscription = sorted[0]
                console.log('[SYNC] ✅ Abonnement actif trouvé via email:', activeSubscription.id)
                break
              }
            }
          } catch (error) {
            console.error('[SYNC] Erreur recherche par email:', error)
          }
        }
        
        // Si on a trouvé un abonnement actif, l'utiliser à la place
        if (activeSubscription) {
          subscription = activeSubscription
          console.log('[SYNC] ✅ Utilisation de l\'abonnement actif au lieu de l\'annulé')
        } else {
          console.log('[SYNC] ⚠️ Aucun abonnement actif trouvé, synchronisation de l\'annulé')
        }
      }
      
      const firstItem = subscription.items.data[0]
      const status = subscription.status
      const currentPeriodEnd = (subscription as any).current_period_end
      const currentPeriodStart = (subscription as any).current_period_start

      // Récupérer l'abonnement existant pour préserver le marqueur de terminaison manuelle
      const { data: existingSubData } = await supabaseAdmin
        .from('user_subscriptions')
        .select('metadata, updated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      const existingMetadata = (existingSubData?.metadata || {}) as any
      const wasManuallyTerminated = existingMetadata?.manually_terminated_by_admin === true

      // Si l'abonnement a été manuellement terminé par l'admin, vérifier si c'est un nouveau paiement
      if (wasManuallyTerminated && status === 'active') {
        const terminatedAt = existingMetadata?.terminated_at ? new Date(existingMetadata.terminated_at) : null
        const subscriptionCreatedAt = new Date(subscription.created * 1000) // Stripe timestamp en secondes
        
        // Si l'abonnement Stripe a été créé APRÈS la terminaison, c'est un nouveau paiement légitime
        if (terminatedAt && subscriptionCreatedAt > terminatedAt) {
          console.log('[SYNC] ✅ Nouveau paiement Stripe après terminaison, synchronisation autorisée', {
            userId: user.id,
            subscriptionId: subscription.id,
            terminatedAt: terminatedAt.toISOString(),
            subscriptionCreatedAt: subscriptionCreatedAt.toISOString()
          })
          // Le marqueur sera effacé ci-dessous
        } else {
          console.log('[SYNC] ⏸️ Abonnement manuellement terminé par admin, synchronisation Stripe ignorée', {
            userId: user.id,
            subscriptionId: subscription.id,
            terminatedAt: terminatedAt?.toISOString(),
            subscriptionCreatedAt: subscriptionCreatedAt.toISOString()
          })
          return NextResponse.json({
            success: true,
            message: 'Abonnement manuellement terminé, synchronisation ignorée'
          })
        }
      }

      // Effacer le marqueur de terminaison manuelle si c'est un nouvel abonnement actif
      const mergedMetadata = (status === 'active' && wasManuallyTerminated) 
        ? (subscription.metadata || {}) 
        : {
            ...(subscription.metadata || {}),
            ...(wasManuallyTerminated ? { manually_terminated_by_admin: true, terminated_at: existingMetadata?.terminated_at } : {})
          }

      const { error: upsertError } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert(
          {
            user_id: user.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: resolveCustomerId(subscription.customer),
            status,
            plan_id: subscription.metadata?.plan || SUBSCRIPTION_PLAN_CODE,
            price_id: firstItem?.price?.id || null,
            current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : null,
            current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
            grace_until: computeGraceUntil(currentPeriodEnd, SUBSCRIPTION_GRACE_DAYS),
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
            cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            metadata: mergedMetadata,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )

      if (upsertError) {
        console.error('[SYNC] Erreur upsert subscription:', upsertError)
        return NextResponse.json({ error: 'Erreur synchronisation' }, { status: 500 })
      }

      const graceUntil = computeGraceUntil(currentPeriodEnd, SUBSCRIPTION_GRACE_DAYS)
      console.log('[SYNC] ✅ Abonnement synchronisé avec succès:', {
        userId: user.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : null,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
        graceUntil,
        cancel_at_period_end: subscription.cancel_at_period_end,
        priceId: firstItem?.price?.id
      })

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status
        }
      })
    }

    console.log('[SYNC] ⚠️ Aucun abonnement trouvé dans Stripe pour:', {
      userId: user.id,
      email: user.email,
      existingSub: existingSub ? {
        stripe_customer_id: existingSub.stripe_customer_id,
        stripe_subscription_id: existingSub.stripe_subscription_id
      } : null
    })
    
    return NextResponse.json({
      success: false,
      message: 'Aucun abonnement trouvé'
    })
  } catch (error: any) {
    console.error('[SYNC] Erreur:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}

