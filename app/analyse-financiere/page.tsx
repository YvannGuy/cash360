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
  message: string
  modePaiement: string
  consentement: boolean
}

interface FormErrors {
  [key: string]: string
}

export default function AnalyseFinancierePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relevesFiles, setRelevesFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    message: '',
    modePaiement: 'paypal', // Valeur par défaut
    consentement: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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



  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    try {
      clientInfoSchema.parse({
        ...formData,
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

    // Validation du mode de paiement
    if (!formData.modePaiement) {
      newErrors.modePaiement = 'Veuillez sélectionner un mode de paiement'
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
      console.log('📋 Données du formulaire:', formData)
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
        </div>

        {/* Étapes du processus */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Étapes du processus</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Entrer vos informations</p>
                <p className="text-xs text-gray-600">Nom, email, message</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Mode de paiement</p>
                <p className="text-xs text-gray-600">Régler la somme de 39,99€</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Télécharger vos relevés</p>
                <p className="text-xs text-gray-600">3 derniers relevés bancaires</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">✓</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Finaliser</p>
                <p className="text-xs text-gray-600">Envoyer mes relevés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              Je suis très heureuse d'avoir pu échanger avec vous concernant l'état de vos finances. Comme évoqué par téléphone, j'aurai besoin de vos trois derniers relevés de compte afin d'analyser en profondeur vos dépenses. Cela me permettra de vous accompagner au mieux, de détecter d'éventuelles anomalies financières et de vous proposer la solution et le module d'accompagnement les plus adaptés pour redonner un nouveau souffle à vos finances.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-8">

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

          {/* Mode de paiement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mode de paiement</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="paypal"
                  name="modePaiement"
                  type="radio"
                  value="paypal"
                  checked={formData.modePaiement === 'paypal'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="paypal" className="ml-3 text-sm font-medium text-gray-700">
                  PayPal
                </label>
              </div>
              
              {formData.modePaiement === 'paypal' && (
                <div className="ml-7 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    Cliquez sur le bouton ci-dessous pour effectuer votre paiement PayPal :
                  </p>
                  <a
                    href="https://paypal.me/mbde510"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.068-.405c-.78-4.09-3.356-5.76-7.13-5.76H5.998c-.524 0-.968.382-1.05.9L2.47 20.597h4.606l1.12-7.106c.082-.518.526-.9 1.05-.9h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437.292-1.867-.002-3.137-1.012-4.287z"/>
                    </svg>
                    Payer avec PayPal
                  </a>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  id="virement"
                  name="modePaiement"
                  type="radio"
                  value="virement"
                  checked={formData.modePaiement === 'virement'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="virement" className="ml-3 text-sm font-medium text-gray-700">
                  Virement bancaire
                </label>
              </div>
              
              {formData.modePaiement === 'virement' && (
                <div className="ml-7 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-3">Virement bancaire</h3>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Bénéficiaire :</strong> Myriam Konan</p>
                    <p><strong>IBAN :</strong> FR76 2823 3000 0102 8891 4178 672</p>
                    <p><strong>BIC :</strong> REVOFRP2</p>
                    <p><strong>Banque :</strong> Revolut Bank UAB</p>
                    <p><strong>Adresse :</strong> 10 avenue Kléber, 75116 Paris, France</p>
                  </div>
                </div>
              )}
            </div>
            
            {errors.modePaiement && (
              <p className="text-sm text-red-600 mt-2">{errors.modePaiement}</p>
            )}
          </div>

          {/* Upload des relevés */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vos trois derniers relevés bancaires
            </h2>
            
            {/* Avertissement pour le nommage des fichiers */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    ⚠️ Important : Nommage des fichiers
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p className="mb-2">
                      Pour une bonne gestion de chaque dossier, veuillez nommer vos 3 relevés de manière claire et identifiante :
                    </p>
                    <div className="bg-white rounded p-3 border border-amber-200">
                      <p className="font-medium text-gray-900 mb-1">Exemple de nommage :</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">jeangouillonreleve1.jpg</code></li>
                        <li>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">jeangouillonreleve2.jpg</code></li>
                        <li>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">jeangouillonreleve3.jpg</code></li>
                      </ul>
                    </div>
                    <p className="mt-2 text-xs text-amber-600">
                      Format recommandé : <strong>prénomnomreleve1/2/3.extension</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
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
