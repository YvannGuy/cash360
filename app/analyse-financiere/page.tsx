'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clientInfoSchema } from '@/lib/validation'
import Field from '@/components/Field'
import UploadDropzone from '@/components/UploadDropzone'

interface FormData {
  prenom: string
  nom: string
  email: string
  telephone: string
  message: string
  paymentMethod: 'virement' | 'paypal' | ''
  consentement: boolean
}

interface FormErrors {
  [key: string]: string
}

export default function AnalyseFinancierePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relevesFiles, setRelevesFiles] = useState<File[]>([])
  const [virementJustificatif, setVirementJustificatif] = useState<File | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    message: '',
    paymentMethod: '',
    consentement: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePaymentMethodChange = (method: 'virement' | 'paypal') => {
    setFormData(prev => ({ ...prev, paymentMethod: method }))
    setErrors(prev => ({ ...prev, paymentMethod: '' }))
  }

  const handleVirementJustificatifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setVirementJustificatif(file)
    setErrors(prev => ({ ...prev, virementJustificatif: '' }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    try {
      clientInfoSchema.parse({
        ...formData,
        telephone: formData.telephone || undefined,
        message: formData.message || undefined
      })
    } catch (error: any) {
      error.errors?.forEach((err: any) => {
        newErrors[err.path[0]] = err.message
      })
    }

    // Validation spécifique pour les fichiers
    if (relevesFiles.length !== 3) {
      newErrors.releves = 'Vous devez téléverser exactement 3 relevés'
    }

    if (formData.paymentMethod === 'virement' && !virementJustificatif) {
      newErrors.virementJustificatif = 'Le justificatif de virement est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const submitFormData = new FormData()
      
      // Ajouter les données du formulaire
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          submitFormData.append(key, value.toString())
        } else {
          submitFormData.append(key, value)
        }
      })
      
      // Ajouter les fichiers
      relevesFiles.forEach(file => {
        submitFormData.append('releves', file)
      })
      
      if (virementJustificatif) {
        submitFormData.append('virementJustificatif', virementJustificatif)
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: submitFormData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi')
      }
      
      // Redirection vers la page de succès
      router.push(`/analyse-financiere/succes?ticket=${result.ticket}`)
      
    } catch (error) {
      console.error('Erreur soumission:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Une erreur est survenue' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Analyse approfondie de vos finances
          </h1>
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-lg font-semibold">
            59,99 €
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              Bonjour,<br/><br/>
              Je suis très heureuse d'avoir pu échanger avec vous concernant l'état de vos finances.<br/><br/>
              Comme évoqué par téléphone, j'aurai besoin de vos <strong>trois derniers relevés de compte</strong> afin d'analyser en profondeur vos dépenses. Cela me permettra de vous accompagner au mieux, de détecter d'éventuelles <strong>anomalies financières</strong> et de vous proposer la <strong>solution</strong> et le <strong>module d'accompagnement</strong> les plus adaptés pour redonner un nouveau souffle à vos finances.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mode de paiement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mode de paiement</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="virement"
                  name="paymentMethod"
                  type="radio"
                  checked={formData.paymentMethod === 'virement'}
                  onChange={() => handlePaymentMethodChange('virement')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="virement" className="ml-3 text-sm font-medium text-gray-700">
                  Virement bancaire
                </label>
              </div>
              
              {formData.paymentMethod === 'virement' && (
                <div className="ml-7 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Informations bancaires :</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Bénéficiaire :</strong> Myriam Konan</div>
                    <div><strong>IBAN :</strong> FR76 2823 3000 0102 8891 4178 672</div>
                    <div><strong>BIC :</strong> REVOFRP2</div>
                    <div><strong>Banque :</strong> Revolut Bank UAB</div>
                    <div><strong>Adresse :</strong> 10 avenue Kléber, 75116 Paris, France</div>
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="virementJustificatif" className="block text-sm font-medium text-gray-700 mb-2">
                      Justificatif de virement <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="virementJustificatif"
                      name="virementJustificatif"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleVirementJustificatifChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {errors.virementJustificatif && (
                      <p className="text-sm text-red-600 mt-1">{errors.virementJustificatif}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  id="paypal"
                  name="paymentMethod"
                  type="radio"
                  checked={formData.paymentMethod === 'paypal'}
                  onChange={() => handlePaymentMethodChange('paypal')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="paypal" className="ml-3 text-sm font-medium text-gray-700">
                  PayPal
                </label>
              </div>
              
              {formData.paymentMethod === 'paypal' && (
                <div className="ml-7 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Après paiement, revenez sur cette page pour envoyer vos relevés.
                  </p>
                  <a
                    href="https://paypal.me/mbde510/59.99"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Payer avec PayPal
                  </a>
                </div>
              )}
              
              {errors.paymentMethod && (
                <p className="text-sm text-red-600">{errors.paymentMethod}</p>
              )}
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vos informations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Prénom"
                name="prenom"
                required
                value={formData.prenom}
                onChange={handleInputChange}
                error={errors.prenom}
              />
              
              <Field
                label="Nom"
                name="nom"
                required
                value={formData.nom}
                onChange={handleInputChange}
                error={errors.nom}
              />
              
              <Field
                label="Email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
              />
              
              <Field
                label="Téléphone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleInputChange}
                error={errors.telephone}
              />
            </div>
            
            <div className="mt-6">
              <Field
                label="Message (optionnel)"
                name="message"
                type="textarea"
                value={formData.message}
                onChange={handleInputChange}
                error={errors.message}
                placeholder="Ajoutez toute information que vous jugez utile pour l'analyse..."
              />
            </div>
          </div>

          {/* Upload des relevés */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vos trois derniers relevés bancaires
            </h2>
            
            <UploadDropzone
              onFilesChange={setRelevesFiles}
              files={relevesFiles}
              error={errors.releves}
              required
            />
          </div>

          {/* Consentement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start">
              <input
                id="consentement"
                name="consentement"
                type="checkbox"
                checked={formData.consentement}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="consentement" className="ml-3 text-sm text-gray-700">
                J'accepte que mes données soient traitées par Cash360 aux seules fins d'analyse, 
                conformément à la réglementation en vigueur. <span className="text-red-500">*</span>
              </label>
            </div>
            {errors.consentement && (
              <p className="text-sm text-red-600 mt-1">{errors.consentement}</p>
            )}
          </div>

          {/* Erreur de soumission */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                'Envoyer mes relevés et finaliser'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
