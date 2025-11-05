'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

function CommandeSoumiseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const order = searchParams.get('order')
    setOrderId(order)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 ml-2 sm:ml-16 mt-4">
              <button
                onClick={() => router.push('/')}
                className="cursor-pointer"
              >
                <Image
                  src="/images/logo/logofinal.png"
                  alt="Cash360"
                  width={540}
                  height={540}
                  className="h-16 sm:h-32 md:h-42 w-auto hover:opacity-80 transition-opacity duration-200"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Card de confirmation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header avec icône de succès */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ✅ Preuve envoyée avec succès !
            </h1>
            <p className="text-green-50 text-lg">
              Votre paiement Mobile Money est en cours de vérification
            </p>
          </div>

          {/* Contenu */}
          <div className="px-8 py-12">
            <div className="space-y-6">
              {/* Message principal */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-900 text-lg leading-relaxed">
                  Merci ! Nous avons bien reçu votre preuve de paiement Mobile Money.
                  Notre équipe va procéder à la vérification dans les plus brefs délais.
                </p>
              </div>

              {/* Détails de la commande */}
              {orderId && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Détails de votre commande
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <span className="text-gray-700 font-medium">Référence :</span>
                      <code className="text-lg font-mono font-bold text-blue-600">
                        C360-AFRIQUE
                      </code>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <span className="text-gray-700 font-medium">Statut :</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                        ⏳ En attente de validation
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-gray-700 font-medium">Délai :</span>
                      <span className="text-gray-900 font-semibold">
                        Jusqu'à 24 heures ouvrées
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations importantes */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
                <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  À retenir
                </h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <span>✅</span>
                    <span>Vous recevrez un email de confirmation une fois le paiement validé</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>⏱️</span>
                    <span>Le délai de validation est de <strong>24 heures ouvrées maximum</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📧</span>
                    <span>Conservez cet accusé de réception et la référence <code className="bg-yellow-100 px-1 rounded">C360-AFRIQUE</code></span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="pt-6 space-y-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-6 py-3 bg-[#00A1C6] text-white rounded-lg hover:bg-[#0089a3] transition-colors font-semibold text-lg"
                >
                  Retour au tableau de bord
                </button>
                <button
                  onClick={() => router.push('/dashboard?tab=formations')}
                  className="w-full px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Voir mes commandes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-2">
            Une question sur votre commande ?
          </p>
          <a
            href="mailto:cash@cash360.finance"
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contactez-nous
          </a>
        </div>
      </div>
    </div>
  )
}

export default function CommandeSoumisePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <CommandeSoumiseContent />
    </Suspense>
  )
}

