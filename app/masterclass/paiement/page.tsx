'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import ModalOMWave from '@/components/ModalOMWave'
import { USD_TO_CDF_RATE } from '@/config/omWave'

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const registrationId = searchParams.get('registrationId')
  
  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'mobile_money' | null>(null)
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (registrationId) {
      fetchRegistration()
    } else {
      router.push('/masterclass/inscription')
    }
  }, [registrationId])

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/masterclass/registration/${registrationId}`)
      const data = await response.json()
      if (data.success) {
        setRegistration(data.registration)
      } else {
        router.push('/masterclass/inscription')
      }
    } catch (error) {
      console.error('Erreur récupération inscription:', error)
      router.push('/masterclass/inscription')
    } finally {
      setLoading(false)
    }
  }

  const generateOrderId = () => {
    return `MC${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }

  const handleStripePayment = async () => {
    if (!registrationId) return

    try {
      const response = await fetch('/api/masterclass/payment/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          amount: 15.00,
          currency: 'USD'
        }),
      })

      const data = await response.json()
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        alert('Erreur lors de la création de la session de paiement')
      }
    } catch (error) {
      console.error('Erreur paiement Stripe:', error)
      alert('Une erreur est survenue')
    }
  }

  const handleMobileMoneyClick = () => {
    const newOrderId = generateOrderId()
    setOrderId(newOrderId)
    setShowMobileMoneyModal(true)
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section avec image en fond */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-100">
        {/* Image de fond */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/kincashform.jpg"
            alt="Masterclass CASH360 Edition 2026"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>

        {/* Contenu - Formulaire positionné dans l'espace carré noir */}
        <div className="relative z-10 w-full h-full flex items-start justify-start px-4 sm:px-6 lg:px-8 xl:px-12 pt-24 sm:pt-28 lg:pt-32 pb-8">
          <div className="max-w-md w-full">
            {/* Formulaire de paiement */}
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-5 lg:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1 text-center">
                Finaliser votre paiement
              </h2>
              <p className="text-center text-gray-600 mb-4 text-xs">
                MASTERCLA$$ EDITION 2026 • KINSHASA • SAMEDI 28 FÉVRIER
              </p>

              {/* Récapitulatif */}
              <div className="mb-4 space-y-2">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="font-semibold text-gray-900 mb-2 text-xs">Récapitulatif de l'inscription</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nom:</span>
                      <span className="font-medium">{registration.first_name} {registration.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-xs break-all">{registration.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-xs">
                        {registration.registration_type === 'pitch' ? 'Pitch Entrepreneur' : 'Participant'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="text-gray-900 font-semibold text-xs">Montant:</span>
                      <span className="text-sm font-bold text-[#012F4E]">15$</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Méthodes de paiement */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3 text-xs">Choisissez votre moyen de paiement</h3>

                {/* Paiement International (Stripe) */}
                <button
                  onClick={handleStripePayment}
                  className="w-full p-3 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 text-xs">Paiement International</h4>
                      <p className="text-xs text-gray-600">Carte bancaire (CB, Visa, Mastercard), Apple Pay, PayPal</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Paiement Mobile Money Congo */}
                <button
                  onClick={handleMobileMoneyClick}
                  className="w-full p-3 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 text-xs">Paiement Mobile Money</h4>
                      <p className="text-xs text-gray-600">Congo (RDC) - Mobile Money</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Informations */}
              <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-600 mb-1">
                  Questions ?
                </p>
                <a
                  href="https://wa.me/33756848734"
                  className="text-[#FEBE02] font-semibold text-xs hover:underline"
                >
                  +33 7 56 84 87 34
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Mobile Money */}
      {showMobileMoneyModal && orderId && registration && (
        <ModalOMWave
          isOpen={showMobileMoneyModal}
          onClose={() => setShowMobileMoneyModal(false)}
          cartItems={[{
            id: 'masterclass-2026',
            title: 'Masterclass Edition 2026',
            img: '/images/masterclass.jpg',
            price: 15,
            quantity: 1,
            category: 'masterclass'
          }]}
          orderId={orderId}
          productName="Masterclass Edition 2026"
          amountUSD={15}
          amountCDF={Math.round(15 * USD_TO_CDF_RATE)}
          allowedOperators={['congo_mobile_money']}
          prefillName={`${registration.first_name} ${registration.last_name}`}
          prefillEmail={registration.email}
          prefillPhone={registration.phone}
          onSuccess={async () => {
            // Mettre à jour le statut de l'inscription
            try {
              await fetch(`/api/masterclass/payment/mobile-money`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  registrationId: registrationId,
                  orderId: orderId
                })
              })
              router.push(`/masterclass/confirmation?registrationId=${registrationId}`)
            } catch (error) {
              console.error('Erreur mise à jour inscription:', error)
              router.push(`/masterclass/confirmation?registrationId=${registrationId}`)
            }
          }}
        />
      )}

      <Footer />
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FEBE02] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}

