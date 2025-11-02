'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClientBrowser } from '@/lib/supabase'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setSupabase(createClientBrowser())
  }, [])

  useEffect(() => {
    const verifyAndCreate = async () => {
      console.log('🔍 Vérification paiement - sessionId:', sessionId)
      if (!sessionId || !supabase) {
        console.log('❌ Pas de sessionId ou supabase:', { sessionId, hasSupabase: !!supabase })
        return
      }

      try {
        // Vérifier si le paiement a déjà été traité
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('👤 Utilisateur:', user?.id, authError)
        if (!user) return

        // Vérifier si le paiement a déjà été traité
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('transaction_id', sessionId)
          .eq('status', 'success')
          .limit(1)

        console.log('💳 Paiement existant:', existingPayment?.length)

        // Si pas de paiement, on vérifie avec l'API
        if (!existingPayment || existingPayment.length === 0) {
          // Récupérer le panier depuis sessionStorage
          const cartData = sessionStorage.getItem('stripe_checkout_items')
          console.log('🛒 Panier sessionStorage:', cartData)
          if (cartData) {
            const items = JSON.parse(cartData)
            console.log('📋 Items à créer:', items)
            
            // Appeler l'API pour créer les paiements/capsules manuellement
            const response = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, items })
            })
            
            const result = await response.json()
            console.log('✅ Réponse API verify-payment:', result)
            
            // Nettoyer sessionStorage
            sessionStorage.removeItem('stripe_checkout_items')
          }
        }
      } catch (error) {
        console.error('❌ Erreur vérification paiement:', error)
      }
    }

    verifyAndCreate()
  }, [sessionId, supabase])

  useEffect(() => {
    // Attendre 3 secondes puis rediriger selon la source
    const timer = setTimeout(() => {
      const source = sessionStorage.getItem('stripe_checkout_source')
      if (source === 'analysis') {
        router.push('/analyse-financiere')
      } else {
        router.push('/dashboard?payment=success')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>
        
        <p className="text-gray-600 mb-6">
          Votre paiement a été traité avec succès. Vos capsules sont maintenant disponibles.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Redirection en cours...</span>
        </div>

        <div className="flex-shrink-0">
          <Image
            src="/images/logo/logofinal.png"
            alt="Cash360"
            width={100}
            height={100}
            className="h-16 w-auto mx-auto"
          />
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}

