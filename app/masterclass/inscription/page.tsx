'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import Image from 'next/image'

export default function MasterclassInscriptionPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    registrationType: 'participant' as 'participant' | 'pitch',
    projectDescription: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/masterclass/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      // Rediriger vers la page de paiement
      router.push(`/masterclass/paiement?registrationId=${data.registrationId}`)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        .PhoneInput {
          display: flex;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }
        .PhoneInput:focus-within {
          outline: 2px solid #FEBE02;
          outline-offset: 0;
          border-color: transparent;
        }
        .PhoneInputCountry {
          border-right: 1px solid #d1d5db;
          border-radius: 0.375rem 0 0 0.375rem;
        }
        .PhoneInputInput {
          border: none;
          padding: 0.375rem 0.5rem;
          font-size: 0.875rem;
          flex: 1;
        }
        .PhoneInputInput:focus {
          outline: none;
        }
      `}</style>
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
            {/* Formulaire d'inscription */}
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-5 lg:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#012F4E] mb-1 text-center">
                Inscription
              </h2>
              <p className="text-center text-gray-600 mb-4 text-xs">
                MASTERCLA$$ EDITION 2026 • KINSHASA • SAMEDI 28 FÉVRIER
              </p>

              {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-xs">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Nom et Prénom */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#FEBE02] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#FEBE02] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#FEBE02] focus:border-transparent"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <div className="text-sm">
                    <PhoneInput
                      international
                      defaultCountry="CD"
                      value={formData.phone}
                      onChange={(value) => setFormData({ ...formData, phone: value || '' })}
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                {/* Pays */}
                <div>
                  <label htmlFor="country" className="block text-xs font-semibold text-gray-700 mb-1">
                    Pays
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Ex: RDC"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#FEBE02] focus:border-transparent"
                  />
                </div>

                {/* Type d'inscription */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Type d'inscription *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:border-[#FEBE02] transition-colors">
                      <input
                        type="radio"
                        name="registrationType"
                        value="participant"
                        checked={formData.registrationType === 'participant'}
                        onChange={(e) => setFormData({ ...formData, registrationType: e.target.value as 'participant' | 'pitch' })}
                        className="mr-2 w-3 h-3 text-[#FEBE02] focus:ring-[#FEBE02]"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 text-xs">Participant</span>
                        <p className="text-xs text-gray-600">Assister à la masterclass</p>
                      </div>
                    </label>
                    <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:border-[#FEBE02] transition-colors">
                      <input
                        type="radio"
                        name="registrationType"
                        value="pitch"
                        checked={formData.registrationType === 'pitch'}
                        onChange={(e) => setFormData({ ...formData, registrationType: e.target.value as 'participant' | 'pitch' })}
                        className="mr-2 w-3 h-3 text-[#FEBE02] focus:ring-[#FEBE02]"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 text-xs">Pitch Entrepreneur</span>
                        <p className="text-xs text-gray-600">Concourir pour 1500$</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Description du projet (si pitch) */}
                {formData.registrationType === 'pitch' && (
                  <div>
                    <label htmlFor="projectDescription" className="block text-xs font-semibold text-gray-700 mb-1">
                      Description du projet *
                    </label>
                    <textarea
                      id="projectDescription"
                      required={formData.registrationType === 'pitch'}
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      rows={3}
                      placeholder="Décrivez votre projet..."
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#FEBE02] focus:border-transparent"
                    />
                  </div>
                )}

                {/* Prix */}
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300 rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-xs">Prix d'entrée</span>
                    <span className="text-lg font-bold text-[#012F4E]">15$</span>
                  </div>
                </div>

                {/* Bouton de soumission */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#FEBE02] to-[#F99500] text-[#012F4E] font-bold text-sm rounded-lg hover:from-[#ffd24f] hover:to-[#ffae33] transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Traitement...' : 'Continuer vers le paiement'}
                </button>
              </form>

              {/* Informations de contact */}
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

      <Footer />
    </div>
  )
}

