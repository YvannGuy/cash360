'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { OM_WAVE_CONFIG, EUR_TO_FCFA_RATE } from '@/config/omWave'
import { createClientBrowser } from '@/lib/supabase'
import type { CartItem } from '@/lib/CartContext'

interface ModalOMWaveProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  cartItems: CartItem[]
  productName: string
  amountEUR: number
  amountFCFA: number
}

const operatorSchema = z.enum(['orange_money', 'wave', 'congo_mobile_money'])

const proofSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  msisdn: z.string().min(10, 'Numéro invalide (min 10 chiffres)'),
  operator: operatorSchema,
  amountFcfa: z.number().positive('Montant invalide'),
  txRef: z.string().optional(),
  file: z
    .instanceof(File, { message: 'Fichier requis' })
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Fichier trop volumineux (max 10 Mo)')
    .refine((file) => ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type), 
      'Format invalide (PDF, PNG, JPG uniquement)'),
  confirmed: z.boolean().refine(val => val === true, 'Vous devez confirmer avoir effectué le paiement')
})

type ProofFormData = z.infer<typeof proofSchema>

export default function ModalOMWave({ isOpen, onClose, orderId, cartItems, productName, amountEUR, amountFCFA }: ModalOMWaveProps) {
  const [step, setStep] = useState<'operator' | 'details' | 'proof'>('operator')
  const [selectedOperator, setSelectedOperator] = useState<'orange_money' | 'wave' | 'congo_mobile_money' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, control } = useForm<ProofFormData>({
    resolver: zodResolver(proofSchema),
    defaultValues: {
      name: '',
      email: '',
      msisdn: '',
      operator: 'orange_money' as const,
      amountFcfa: amountFCFA,
      txRef: '',
      file: undefined as any,
      confirmed: false
    }
  })

  const watchedOperator = watch('operator')
  const watchedAmountFcfa = watch('amountFcfa')

  useEffect(() => {
    if (watchedOperator) {
      setSelectedOperator(watchedOperator)
      setValue('operator', watchedOperator)
    }
  }, [watchedOperator, setValue])

  // Charger les infos utilisateur au montage
  useEffect(() => {
    if (isOpen) {
      const loadUserInfo = async () => {
        try {
          const supabase = createClientBrowser()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            setUserEmail(user.email || '')
            // Extraire le nom depuis l'email
            const nameFromEmail = user.email?.split('@')[0] || ''
            setUserName(nameFromEmail)
            setValue('name', nameFromEmail)
            setValue('email', user.email || '')
          }
        } catch (err) {
          console.error('Erreur chargement user:', err)
        }
      }
      loadUserInfo()
    } else {
      // Reset form quand modale fermée
      reset()
      setStep('operator')
      setSelectedOperator(null)
      setError(null)
    }
  }, [isOpen, setValue, reset])

  // Gérer ESC et focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'

    // Focus trap
    const modalContent = document.querySelector('[role="dialog"]')
    const focusableElements = modalContent?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements?.[0] as HTMLElement
    firstElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleOperatorSelect = (operator: 'orange_money' | 'wave' | 'congo_mobile_money') => {
    setSelectedOperator(operator)
    setValue('operator', operator)
    setValue('amountFcfa', amountFCFA)
    setStep('details')
  }

  const handleSubmitProof = async (data: ProofFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('productName', productName)
      // Envoyer les cartItems pour créer une commande par produit
      formData.append('cartItems', JSON.stringify(cartItems))
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('msisdn', data.msisdn)
      formData.append('operator', data.operator)
      formData.append('amountFcfa', data.amountFcfa.toString())
      if (data.txRef) {
        formData.append('txRef', data.txRef)
      }
      formData.append('file', data.file)

      const response = await fetch('/api/mobile-money/submit', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi de la preuve')
      }

      // Succès → rediriger
      window.location.href = `/commande/soumise?order=${orderId}`
    } catch (err: any) {
      console.error('Erreur envoi preuve:', err)
      setError(err.message || 'Erreur lors de l\'envoi. Veuillez réessayer.')
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const operatorConfig = selectedOperator ? OM_WAVE_CONFIG[selectedOperator] : null
  const operatorLabel = selectedOperator === 'orange_money' ? 'Orange Money' : selectedOperator === 'wave' ? 'Wave' : 'Mobile Money RDC'

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modale */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-10"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
            Payer avec Mobile Money
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Étape 1: Choix opérateur */}
          {step === 'operator' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Choisissez l'opérateur que vous souhaitez utiliser.</li>
                  <li>Payez au numéro affiché ou scannez le QR code.</li>
                  <li>Indiquez la référence <strong>C360-AFRIQUE</strong> dans votre paiement.</li>
                  <li>Déposez votre preuve ci-dessous et validez.</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Orange Money */}
                <button
                  onClick={() => handleOperatorSelect('orange_money')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-[#FEBE02] hover:bg-yellow-50 transition-all text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <img src="/images/orange1.png" alt="Orange Money" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Orange Money</h3>
                  <p className="text-sm text-gray-600">Afrique de l'ouest</p>
                </button>

                {/* Wave */}
                <button
                  onClick={() => handleOperatorSelect('wave')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-[#FEBE02] hover:bg-yellow-50 transition-all text-center relative"
                >
                  <div className="absolute top-2 right-2">
                    <span className="text-2xl">🇨🇮</span>
                  </div>
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <img src="/images/wave1.png" alt="Wave" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Wave</h3>
                  <p className="text-sm text-gray-600">Côte d'Ivoire</p>
                </button>

                {/* Mobile Money RDC */}
                <button
                  onClick={() => handleOperatorSelect('congo_mobile_money')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-[#FEBE02] hover:bg-yellow-50 transition-all text-center relative"
                >
                  <div className="absolute top-2 right-2">
                    <span className="text-2xl">🇨🇩</span>
                  </div>
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-blue-500 to-yellow-500 rounded-lg">
                    <span className="text-white text-2xl font-bold">MM</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Mobile Money</h3>
                  <p className="text-sm text-gray-600">République Démocratique du Congo</p>
                </button>
              </div>
            </div>
          )}

          {/* Étape 2: Détails de paiement */}
          {step === 'details' && operatorConfig && (
            <div className="space-y-6">
              <button
                onClick={() => {
                  setStep('operator')
                  setSelectedOperator(null)
                }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour au choix d'opérateur
              </button>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  Paiement via {operatorLabel}
                </h3>

                <div className="space-y-4">
                  {/* Montant */}
                  <div className="flex justify-between items-center bg-white rounded-lg px-4 py-3 border border-gray-200">
                    <span className="font-semibold text-gray-700">Montant :</span>
                    <span className="text-2xl font-bold text-blue-600">
                      € {amountEUR.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    ≈ {amountFCFA.toLocaleString('fr-FR')} FCFA
                  </div>

                  {/* Numéro */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Numéro :</span>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono font-bold text-blue-600">
                            {operatorConfig.phone}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(operatorConfig.phone)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Copier"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {operatorConfig.name && (
                        <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                          <span className="text-sm text-gray-600">Nom :</span>
                          <span className="font-medium text-gray-900">{operatorConfig.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code (si disponible et pas Congo) */}
                  {operatorConfig.qr && selectedOperator !== 'congo_mobile_money' && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Ou scannez :</p>
                        <div className="relative w-48 h-48 mx-auto border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={operatorConfig.qr}
                            alt={`QR Code ${operatorLabel}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Si l'image n'existe pas, afficher un message
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-sm">QR Code non disponible</div>'
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Référence */}
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-yellow-900">Référence obligatoire :</span>
                      <code className="text-lg font-mono font-bold text-yellow-700">
                        C360-AFRIQUE
                      </code>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText('C360-AFRIQUE')}
                      className="mt-2 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold"
                    >
                      📋 Copier la référence
                    </button>
                  </div>

                  {/* Note internationale */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Note :</strong> Si vous payez depuis un autre pays, utilisez le transfert international compatible 
                      (ex. Orange Money International / Wave).
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('proof')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                J'ai effectué le paiement
              </button>
            </div>
          )}

          {/* Étape 3: Déposer la preuve */}
          {step === 'proof' && (
            <form onSubmit={handleSubmit(handleSubmitProof)} className="space-y-6">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour aux détails de paiement
              </button>

              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Important :</strong> Les paiements sans référence <code>C360-AFRIQUE</code> ou avec montant incorrect 
                  peuvent être retardés. Les preuves illisibles seront refusées.
                </p>
              </div>

              {/* Formulaire */}
              <div className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Numéro utilisé */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro utilisé pour le paiement *
                  </label>
                  <input
                    {...register('msisdn')}
                    type="tel"
                    placeholder={selectedOperator === 'congo_mobile_money' ? '+243 XX XXX XXXX' : '+225 XX XX XX XX XX'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.msisdn && (
                    <p className="mt-1 text-sm text-red-600">{errors.msisdn.message}</p>
                  )}
                </div>

                {/* Opérateur (hidden, déjà défini) */}
                <input {...register('operator')} type="hidden" />
                <input {...register('amountFcfa')} type="hidden" />

                {/* Référence transaction (optionnel) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Référence de transaction (optionnel)
                  </label>
                  <input
                    {...register('txRef')}
                    type="text"
                    placeholder="Ex: 123456789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.txRef && (
                    <p className="mt-1 text-sm text-red-600">{errors.txRef.message}</p>
                  )}
                </div>

                {/* Fichier justificatif */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier justificatif *
                  </label>
                  <Controller
                    name="file"
                    control={control}
                    render={({ field: { onChange, name, onBlur, ref } }) => (
                      <input
                        ref={ref}
                        name={name}
                        onBlur={onBlur}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            onChange(file)
                          } else {
                            onChange(null)
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.file && (
                    <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Formats acceptés : PDF, PNG, JPG (max 10 Mo)
                  </p>
                </div>

                {/* Checkbox confirmation */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      {...register('confirmed')}
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Je confirme avoir payé le montant exact et compris que la validation peut prendre jusqu'à 24 h ouvrées.
                    </span>
                  </label>
                  {errors.confirmed && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmed.message}</p>
                  )}
                </div>
              </div>

              {/* Erreur globale */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer la preuve et finaliser'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

