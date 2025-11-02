'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PaymentSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Attendre 2 secondes puis rediriger vers le dashboard
    const timer = setTimeout(() => {
      router.push('/dashboard?payment=success')
    }, 2000)

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

