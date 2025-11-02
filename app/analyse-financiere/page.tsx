'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { analysisFormSchema } from '@/lib/validation'
import Field from '@/components/Field'
import UploadDropzone from '@/components/UploadDropzone'
import { createClientBrowser } from '@/lib/supabase'
import { useLanguage } from '@/lib/LanguageContext'
import LanguageSwitch from '@/components/LanguageSwitch'
import LegalModal from '@/components/LegalModal'

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
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relevesFiles, setRelevesFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    message: '',
    modePaiement: 'paypal', // Valeur par défaut
    consentement: false
  })

  const [supabase, setSupabase] = useState<any>(null)
  const [hasPaid, setHasPaid] = useState(false)

  // Fonction pour extraire les initiales de l'email
  const getInitials = (email: string | undefined): string => {
    if (!email) return ''
    const localPart = email.split('@')[0] // Partie avant @
    const parts = localPart.split('.') // Séparer par les points
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return localPart.substring(0, 2).toUpperCase()
  }

  useEffect(() => {
    setMounted(true)
    // Initialiser Supabase côté client uniquement
    setSupabase(createClientBrowser())
  }, [])

  useEffect(() => {
    if (!supabase) return
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }))
      
      // Vérifier si l'utilisateur a déjà payé
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', 'analyse-financiere')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (payment && payment.length > 0) {
        setHasPaid(true)
      }
      
      setLoading(false)
    }

    checkUser()
  }, [supabase, router])

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/')
  }

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
      analysisFormSchema.parse({
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        message: formData.message || undefined,
        modePaiement: formData.modePaiement as 'paypal' | 'virement',
        consentement: formData.consentement,
        statements: relevesFiles
      })
    } catch (error: any) {
      error.errors?.forEach((err: any) => {
        newErrors[err.path[0]] = err.message
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePayment = async () => {
    if (!supabase) return

    setIsSubmitting(true)
    
    try {
      // Créer une session Stripe Checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'analyse-financiere', quantity: 1 }],
          total: 39.99,
          source: 'analysis' // Indiquer que c'est pour l'analyse
        })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Sauvegarder dans sessionStorage pour le retour
        sessionStorage.setItem('stripe_checkout_items', JSON.stringify([{ id: 'analyse-financiere', quantity: 1 }]))
        sessionStorage.setItem('stripe_checkout_source', 'analysis')
        // Rediriger vers Stripe Checkout
        window.location.href = data.url
      } else {
        alert(`Erreur: ${data.error || 'Erreur lors de la création de la session de paiement'}`)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Erreur checkout:', error)
      alert('Erreur lors du traitement du paiement')
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) return
    
    // Vérifier que le paiement a été effectué
    if (!hasPaid) {
      setErrors({ submit: 'Vous devez effectuer le paiement avant de soumettre vos relevés.' })
      return
    }
    
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

      
      
      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {}
      
      if (session?.access_token) {
        headers['authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
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
      setErrors({ submit: error instanceof Error ? error.message : (mounted ? t.financialAnalysis.errorSubmit : 'Une erreur est survenue') })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{mounted ? t.financialAnalysis.loading : 'Chargement...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplifié */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/images/logo/logofinal.png"
                alt="Cash360"
                width={192}
                height={192}
                className="h-20 sm:h-32 md:h-48 w-auto"
              />
            </div>

            {/* Informations de connexion */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <LanguageSwitch />
                  <div className="hidden sm:flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {getInitials(user.email)}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-xs sm:text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 px-2 sm:px-3 py-2 rounded-lg hover:bg-red-50 whitespace-nowrap"
                  >
                    {t.financialAnalysis.signOut}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Analyse personnalisée de votre situation financière
          </h1>
          <p className="text-sm text-gray-600">Service d’accompagnement à visée éducative (non soumis à agrément financier).</p>
        </div>

        {/* Étapes du processus */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.financialAnalysis.processSteps}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t.financialAnalysis.step1}</p>
                <p className="text-xs text-gray-600">{t.financialAnalysis.step1Desc}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t.financialAnalysis.step2}</p>
                <p className="text-xs text-gray-600">{t.financialAnalysis.step2Desc}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t.financialAnalysis.step3}</p>
                <p className="text-xs text-gray-600">{t.financialAnalysis.step3Desc}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">✓</div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t.financialAnalysis.step4}</p>
                <p className="text-xs text-gray-600">{t.financialAnalysis.step4Desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pourquoi cette analyse ? */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pourquoi cette analyse ?</h3>
            <p className="text-gray-700 leading-relaxed">
              Cette étude vous aide à comprendre vos habitudes de dépenses, à identifier des pistes d’amélioration et à poser les bases d’une gestion financière plus claire et sereine. Le contenu et les recommandations sont pédagogiques et adaptés à votre situation.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Informations personnelles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.financialAnalysis.yourInfo}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label={t.financialAnalysis.firstName}
                name="prenom"
                required
                value={formData.prenom}
                onChange={handleInputChange}
                error={errors.prenom}
              />
              
              <Field
                label={t.financialAnalysis.lastName}
                name="nom"
                required
                value={formData.nom}
                onChange={handleInputChange}
                error={errors.nom}
              />
              
              <Field
                label={t.financialAnalysis.email}
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
                label={t.financialAnalysis.message}
                name="message"
                type="textarea"
                value={formData.message}
                onChange={handleInputChange}
                error={errors.message}
                placeholder={t.financialAnalysis.messagePlaceholder}
              />
            </div>
          </div>

          {/* Mode de paiement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Mode de paiement</h2>
            <p className="text-xs text-gray-600 mb-4">Régler 39,99 €</p>
            
            {hasPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-800 font-medium">Paiement effectué</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Redirection...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Régler avec Stripe
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Paiement sécurisé par Stripe
                </p>
              </div>
            )}
            
            {errors.modePaiement && (
              <p className="text-sm text-red-600 mt-2">{errors.modePaiement}</p>
            )}
          </div>

          {/* Upload des relevés */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t.financialAnalysis.uploadStatements}
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
                    {t.financialAnalysis.fileNamingTitle}
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p className="mb-2">
                      {t.financialAnalysis.fileNamingDesc}
                    </p>
                    <div className="bg-white rounded p-3 border border-amber-200">
                      <p className="font-medium text-gray-900 mb-1">{t.financialAnalysis.fileNamingExample}</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">jeangouillonreleve1.jpg</code></li>
                        <li>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">jeangouillonreleve2.jpg</code></li>
                        <li>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">jeangouillonreleve3.jpg</code></li>
                      </ul>
                    </div>
                    <p className="mt-2 text-xs text-amber-600">
                      {t.financialAnalysis.fileNamingFormat}
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
              <label htmlFor="consentement" className="ml-3 text-sm text-gray-700 leading-relaxed">
                J’accepte que mes données soient traitées par Cash360 aux seules fins d’une analyse pédagogique de ma situation financière.
                <br />
                Mes fichiers sont stockés de manière privée et supprimés au plus tard 6 mois après l’analyse.
                <br />
                Je peux exercer mes droits (accès, rectification, suppression) en écrivant à <a className="text-blue-600 underline" href="mailto:cash@cash360.finance">cash@cash360.finance</a>.
                <br />
                J’ai pris connaissance de la <button type="button" onClick={() => setShowPrivacy(true)} className="text-blue-600 underline">politique de confidentialité (RGPD)</button>.
                <span className="text-red-500"> *</span>
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
              disabled={isSubmitting || !hasPaid}
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
            {!hasPaid && (
              <p className="text-xs text-red-600 mt-2">
                Effectuez le paiement d'abord pour soumettre vos relevés
              </p>
            )}
          </div>
        </form>
        </div>
      </div>
      {/* Modal politique de confidentialité */}
      <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} type="privacy" />
    </div>
  )
}
