'use client'

import { useLanguage } from '@/lib/LanguageContext'
import { useState } from 'react'

export default function PaymentMethods() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'international' | 'africa'>('international')

  return (
    <section id="payment-methods" className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#012F4E] mb-4">
              Moyens de paiement disponibles
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Paiement sécurisé depuis n'importe où dans le monde ou depuis l'Afrique
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-xl p-1 shadow-md border border-gray-200">
              <button
                onClick={() => setActiveTab('international')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'international'
                    ? 'bg-gradient-to-r from-[#FEBE02] to-[#F99500] text-[#012F4E] shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Paiement International
              </button>
              <button
                onClick={() => setActiveTab('africa')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'africa'
                    ? 'bg-gradient-to-r from-[#FEBE02] to-[#F99500] text-[#012F4E] shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Paiement Afrique
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
            {activeTab === 'international' ? (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-[#012F4E] mb-4 flex items-center gap-3">
                    <svg className="w-8 h-8 text-[#FEBE02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Paiement par carte bancaire
                  </h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Payez en toute sécurité avec votre carte bancaire via Stripe, notre partenaire de paiement certifié PCI-DSS.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700">CB</span>
                    </div>
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700">Visa</span>
                    </div>
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700">Mastercard</span>
                    </div>
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700">Apple Pay</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Comment payer :</strong> Sélectionnez "Paiement international" lors de votre achat, entrez les informations de votre carte, et le paiement est traité instantanément. Vous recevrez une confirmation par email.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-8">
                  <h3 className="text-xl font-bold text-[#012F4E] mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#FEBE02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Sécurité garantie
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Chiffrement SSL/TLS pour toutes les transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Certification PCI-DSS niveau 1</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Aucune donnée bancaire stockée sur nos serveurs</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-[#012F4E] mb-4 flex items-center gap-3">
                    <svg className="w-8 h-8 text-[#FEBE02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Mobile Money
                  </h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Payez facilement avec votre téléphone mobile via Wave ou Orange Money, disponibles en Afrique de l'Ouest et Centrale.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                      <div className="flex-shrink-0">
                        <img 
                          src="/images/orange1.png" 
                          alt="Orange Money" 
                          className="h-12 w-auto"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Orange Money</h4>
                        <p className="text-sm text-gray-600">Disponible dans plusieurs pays</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="flex-shrink-0">
                        <img 
                          src="/images/wave1.png" 
                          alt="Wave" 
                          className="h-12 w-auto"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Wave</h4>
                        <p className="text-sm text-gray-600">Paiement mobile sécurisé</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
                    <p className="text-sm text-yellow-900">
                      <strong>Comment payer :</strong> Sélectionnez "Paiement Afrique" lors de votre achat, choisissez Wave ou Orange Money, suivez les instructions pour effectuer le paiement depuis votre application mobile, puis téléchargez la preuve de paiement. Votre commande sera validée manuellement sous 24h après réception de la preuve.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Étapes du paiement Mobile Money :</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                      <li>Sélectionnez "Paiement Mobile Money" lors de votre achat</li>
                      <li>Choisissez votre opérateur (Wave ou Orange Money)</li>
                      <li>Effectuez le paiement depuis votre application mobile</li>
                      <li>Téléchargez la capture d'écran de la confirmation de paiement</li>
                      <li>Votre commande sera validée sous 24h après vérification</li>
                    </ol>
                  </div>
                </div>

                <div className="border-t pt-8">
                  <h3 className="text-xl font-bold text-[#012F4E] mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#FEBE02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Validation manuelle
                  </h3>
                  <p className="text-gray-700">
                    Les paiements Mobile Money nécessitent une validation manuelle de notre équipe pour garantir la sécurité. Une fois votre preuve de paiement reçue et vérifiée, votre abonnement sera activé dans un délai maximum de 24 heures.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

