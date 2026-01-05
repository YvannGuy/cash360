'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('registrationId')
  const sessionId = searchParams.get('session_id')
  
  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (registrationId) {
      fetchRegistration()
    } else {
      router.push('/masterclass/inscription')
    }
  }, [registrationId, sessionId])

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/masterclass/registration/${registrationId}`)
      const data = await response.json()
      if (data.success) {
        setRegistration(data.registration)
        // Si c'est un paiement Stripe, vérifier le statut
        if (sessionId && data.registration.payment_method === 'stripe') {
          verifyStripePayment()
        }
      }
    } catch (error) {
      console.error('Erreur récupération inscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyStripePayment = async () => {
    try {
      await fetch('/api/masterclass/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, sessionId })
      })
    } catch (error) {
      console.error('Erreur vérification paiement:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FEBE02] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!registration) {
    return null
  }

  const isPaid = registration.payment_status === 'paid'
  const isMobileMoney = registration.payment_method === 'mobile_money'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-16">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/masterclass.jpg"
            alt="Masterclass CASH360 Edition 2026"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 text-center">
              {isPaid ? (
                <>
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-[#012F4E] mb-4">
                      Inscription confirmée !
                    </h2>
                    <p className="text-lg text-gray-700 mb-6">
                      Merci {registration.first_name} ! Votre inscription à la Masterclass Edition 2026 a été confirmée.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-6 mb-6">
                    <h3 className="font-bold text-[#012F4E] mb-4">Détails de votre inscription</h3>
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nom:</span>
                        <span className="font-semibold">{registration.first_name} {registration.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold">{registration.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold">
                          {registration.registration_type === 'pitch' ? 'Pitch Entrepreneur' : 'Participant'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-gray-900 font-bold">Montant payé:</span>
                        <span className="text-xl font-bold text-[#012F4E]">15$</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6 text-left">
                    <p className="text-sm text-blue-900">
                      <strong>Prochaines étapes :</strong> Vous recevrez un email de confirmation avec tous les détails de l'événement dans les prochaines heures. 
                      {registration.registration_type === 'pitch' && ' Les détails pour la présentation de votre projet vous seront communiqués par email.'}
                    </p>
                  </div>
                </>
              ) : isMobileMoney ? (
                <>
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-[#012F4E] mb-4">
                      Paiement en attente de validation
                    </h2>
                    <p className="text-lg text-gray-700 mb-6">
                      Merci {registration.first_name} ! Votre inscription a été enregistrée.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6 text-left">
                    <p className="text-sm text-yellow-900">
                      <strong>Important :</strong> Votre paiement Mobile Money est en cours de validation. 
                      Une fois la preuve de paiement vérifiée (sous 24h), vous recevrez un email de confirmation avec tous les détails de l'événement.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-[#012F4E] mb-4">
                    Paiement en cours...
                  </h2>
                  <p className="text-lg text-gray-700">
                    Veuillez patienter pendant que nous vérifions votre paiement.
                  </p>
                </>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Pour toute question, contactez-nous :
                </p>
                <a
                  href="https://wa.me/33756848734"
                  className="inline-block text-[#FEBE02] font-semibold hover:underline"
                >
                  +33 7 56 84 87 34
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FEBE02] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}

