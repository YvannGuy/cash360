'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'
import { useCart } from '@/lib/CartContext'
import { useCurrency } from '@/lib/CurrencyContext'
import { tracking } from '@/lib/tracking'
import LanguageSwitch from '@/components/LanguageSwitch'
import CurrencySelector from '@/components/CurrencySelector'
import PayWithOMWaveButton from '@/components/PayWithOMWaveButton'

export default function CartPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { cartItems, updateQuantity, removeFromCart, getSubtotal, clearCart } = useCart()
  const { format: formatPrice, currency: currentCurrency } = useCurrency()
  
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const subtotal = getSubtotal()
  const total = subtotal
  
  // Générer un orderId unique pour Mobile Money
  const generateOrderId = () => {
    return `MM${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }
  
  const [orderId, setOrderId] = useState(() => generateOrderId())
  
  // Récupérer les noms de produits pour Mobile Money
  const productNames = cartItems.map(item => item.title).join(', ')
  
  const handleCheckout = async () => {
    if (!termsAccepted) {
      alert('Veuillez accepter les conditions générales de vente')
      return
    }
    
    if (cartItems.length === 0) {
      alert('Votre panier est vide')
      return
    }

    setIsProcessing(true)

    // Tracker le début du checkout
    tracking.checkoutStarted(total, cartItems.length)

    try {
      // Créer une session Stripe Checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          total: total
        })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Sauvegarder le panier dans sessionStorage pour la page de succès
        sessionStorage.setItem('stripe_checkout_items', JSON.stringify(cartItems))
        // Rediriger vers Stripe Checkout
        window.location.href = data.url
      } else {
        alert(`Erreur: ${data.error || 'Erreur lors de la création de la session de paiement'}`)
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Erreur checkout:', error)
      alert('Erreur lors du traitement du paiement')
      setIsProcessing(false)
    }
  }

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
            
            {/* Language Switch & Currency */}
            <div className="flex items-center gap-3 mr-2 sm:mr-20">
              <CurrencySelector />
              <LanguageSwitch />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back to Boutique Button */}
        <button
          onClick={() => router.push('/dashboard?tab=boutique')}
          className="inline-flex items-center gap-2 text-[#012F4E] hover:text-[#00A1C6] transition-colors font-medium mb-6"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la boutique
        </button>

        {/* Title and Subtitle */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>
            Votre panier
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Vérifiez les éléments avant de passer au paiement.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-lg bg-gray-100 mb-6">
                  <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Votre panier est vide</h3>
                <p className="text-gray-600 mb-6">Découvrez nos formations et commencez votre apprentissage.</p>
                <button
                  onClick={() => router.push('/dashboard?tab=boutique')}
                  className="inline-flex items-center px-6 py-3 bg-[#00A1C6] text-white rounded-lg hover:bg-[#012F4E] transition-colors font-medium"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                >
                  Explorer la boutique
                </button>
              </div>
            ) : (
              <>
                {cartItems.map((item) => (
                  <div key={`${item.id}-${currentCurrency}`} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 border-2 border-[#012F4E]">
                        <Image
                          src={item.img}
                          alt={item.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Formation complète pour maîtriser vos finances
                        </p>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between">
                          {/* Quantity Control */}
                          {(() => {
                            const itemCategory = item.category || 'capsules'
                            const maxQuantity = itemCategory === 'analyse-financiere' ? Infinity : 1
                            const isAtMax = itemCategory !== 'analyse-financiere' && item.quantity >= maxQuantity
                            
                            return (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="text-base font-medium text-gray-900 w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={isAtMax}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={isAtMax ? 'Quantité maximale atteinte (1)' : 'Augmenter la quantité'}
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              </div>
                            )
                          })()}

                          {/* Price */}
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 hover:bg-red-50 rounded transition-colors"
                            >
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Continue Shopping Link */}
                <button
                  onClick={() => router.push('/dashboard?tab=boutique')}
                  className="inline-flex items-center gap-2 text-[#012F4E] hover:text-[#00A1C6] transition-colors font-medium"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Continuer vos achats
                </button>
              </>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>
                Résumé de commande
              </h2>

              {/* Pricing Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total :</span>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#00A1C6] border-gray-300 rounded focus:ring-[#00A1C6]"
                  />
                  <span className="text-sm text-gray-700" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    J'ai lu et j'accepte les{' '}
                    <Link href="/cgv" className="text-[#00A1C6] hover:underline" target="_blank">
                      conditions générales de vente
                    </Link>
                  </span>
                </label>
              </div>

              {/* Checkout Button - Stripe */}
              <div className="mb-3">
                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || !termsAccepted || isProcessing}
                  className="w-full px-4 py-3 bg-[#FEBE02] text-white rounded-lg font-bold hover:bg-[#e0a900] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}
                >
                  {isProcessing ? 'Traitement en cours...' : 'Paiement'}
                </button>
                
                {/* Payment Methods Accepted */}
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-800 mb-2 text-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>
                    NOUS ACCEPTONS :
                  </p>
                  <div className="flex justify-center">
                    <Image
                      src="/images/pay.png"
                      alt="Méthodes de paiement acceptées"
                      width={600}
                      height={100}
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2 text-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  Zone Euro et autres régions (hors Afrique)
                </p>
              </div>

              {/* Séparateur */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500 font-medium">OU</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Mobile Money Button */}
              {cartItems.length > 0 && termsAccepted && (
                <div className="mb-3">
                  <PayWithOMWaveButton
                    orderId={orderId}
                    cartItems={cartItems}
                    amountEUR={total}
                  />
                  
                  {/* Payment Methods Accepted - Mobile Money */}
                  <div className="mt-3">
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>
                        NOUS ACCEPTONS :
                      </p>
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/orange1.png"
                          alt="Orange Money"
                          width={60}
                          height={40}
                          className="h-auto"
                        />
                        <Image
                          src="/images/wave1.png"
                          alt="Wave"
                          width={60}
                          height={40}
                          className="h-auto"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    Afrique de l'Ouest et Centrale
                  </p>
                </div>
              )}

              {/* Security and Support Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-3 text-[10px] text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0 text-[#00A1C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0 text-[#00A1C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Données protégées</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0 text-[#00A1C6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Support 24h/24</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Modal */}
    </div>
  )
}

