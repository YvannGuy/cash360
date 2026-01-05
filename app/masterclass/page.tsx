'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useLanguage } from '@/lib/LanguageContext'
import Image from 'next/image'

interface FormStep {
  id: string
  title: string
  fields: string[]
}

export default function MasterclassPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'masterclass' | 'sponsors'>('masterclass')
  const [currentStep, setCurrentStep] = useState(0)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [structureAddressQuery, setStructureAddressQuery] = useState('')
  const [structureAddressSuggestions, setStructureAddressSuggestions] = useState<
    Array<{ id: string; address: string; label: string }>
  >([])
  const [structureAddressLoading, setStructureAddressLoading] = useState(false)

  // États pour le formulaire de sponsoring
  const [sponsorCurrentStep, setSponsorCurrentStep] = useState(0)
  const [sponsorFormSubmitted, setSponsorFormSubmitted] = useState(false)
  const [sponsorIsSubmitting, setSponsorIsSubmitting] = useState(false)
  const [sponsorAddressQuery, setSponsorAddressQuery] = useState('')
  const [sponsorAddressSuggestions, setSponsorAddressSuggestions] = useState<
    Array<{ id: string; address: string; label: string }>
  >([])
  const [sponsorAddressLoading, setSponsorAddressLoading] = useState(false)

  const [sponsorFormData, setSponsorFormData] = useState({
    // 1. Informations sur l'organisation sponsor
    organizationName: '',
    legalForm: '',
    registrationNumber: '',
    organizationAddress: '',
    organizationWebsite: '',
    
    // 2. Contact principal
    contactName: '',
    contactFunction: '',
    contactEmail: '',
    contactPhone: '' as string | undefined,
    
    // 3. Type de partenariat
    partnershipType: '',
    budgetRange: '',
    targetAudience: '',
    
    // 4. Engagement
    termsAccepted: false
  })

  const sponsorFormSteps: FormStep[] = [
    { id: 'organization', title: t.masterclass.sponsorFormSteps.organization, fields: ['organizationName', 'legalForm', 'registrationNumber', 'organizationAddress', 'organizationWebsite'] },
    { id: 'contact', title: t.masterclass.sponsorFormSteps.contact, fields: ['contactName', 'contactFunction', 'contactEmail', 'contactPhone'] },
    { id: 'partnership', title: t.masterclass.sponsorFormSteps.partnership, fields: ['partnershipType', 'budgetRange', 'targetAudience'] },
    { id: 'commitment', title: t.masterclass.sponsorFormSteps.commitment, fields: ['termsAccepted'] }
  ]

  const [formData, setFormData] = useState({
    // 1. Informations sur la structure organisatrice
    structureName: '',
    legalForm: '',
    registrationNumber: '',
    structureAddress: '',
    structureWebsite: '',
    
    // 2. Responsable de l'événement
    responsibleName: '',
    responsibleFunction: '',
    responsibleEmail: '',
    responsiblePhone: '' as string | undefined,
    
    // 3. Informations générales sur l'événement
    city: '',
    country: '',
    proposedDate: '',
    eventType: 'Masterclass',
    
    // 4. Public visé
    targetAudience: '',
    estimatedParticipants: '',
    
    // 5. Format souhaité
    standardFormat: 'Oui',
    customFormat: '',
    pitchEntrepreneurial: 'Non',
    pitchDetails: '',
    
    // 6. Logistique & organisation
    venueIdentified: '',
    venueCapacity: '',
    transport: false,
    accommodation: false,
    logistics: false,
    
    // 7. Conditions financières
    proposedFee: '',
    percentageOnTickets: 'Non',
    percentageDetails: '',
    
    // 8. Communication & visibilité
    communicationChannels: [] as string[],
    sponsors: 'Non',
    
    // 9. Documents requis
    structureDocument: null as File | null,
    identityDocument: null as File | null,
    eventPresentation: null as File | null,
    
    // 10. Engagement & validation
    frameworkAcknowledged: false,
    contractAccepted: false,
    writtenAgreementAccepted: false
  })

  const formSteps: FormStep[] = [
    { id: 'structure', title: t.masterclass.formSteps.structure, fields: ['structureName', 'legalForm', 'registrationNumber', 'structureAddress', 'structureWebsite'] },
    { id: 'responsible', title: t.masterclass.formSteps.responsible, fields: ['responsibleName', 'responsibleFunction', 'responsibleEmail', 'responsiblePhone'] },
    { id: 'event', title: t.masterclass.formSteps.event, fields: ['city', 'country', 'proposedDate', 'eventType'] },
    { id: 'audience', title: t.masterclass.formSteps.audience, fields: ['targetAudience', 'estimatedParticipants'] },
    { id: 'format', title: t.masterclass.formSteps.format, fields: ['standardFormat', 'customFormat', 'pitchEntrepreneurial', 'pitchDetails'] },
    { id: 'logistics', title: t.masterclass.formSteps.logistics, fields: ['venueIdentified', 'venueCapacity', 'transport', 'accommodation', 'logistics'] },
    { id: 'financial', title: t.masterclass.formSteps.financial, fields: ['proposedFee', 'percentageOnTickets', 'percentageDetails'] },
    { id: 'communication', title: t.masterclass.formSteps.communication, fields: ['communicationChannels', 'sponsors'] },
    { id: 'documents', title: t.masterclass.formSteps.documents, fields: ['structureDocument', 'identityDocument', 'eventPresentation'] },
    { id: 'commitment', title: t.masterclass.formSteps.commitment, fields: ['frameworkAcknowledged', 'contractAccepted', 'writtenAgreementAccepted'] }
  ]

  const conferenceImages = [
    { 
      src: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1200&h=800&fit=crop&q=90&auto=format', 
      country: 'France', 
      city: 'Paris',
      fallback: '🇫🇷',
      description: 'Tour Eiffel',
      date: 'Octobre 2026'
    },
    { 
      src: '/images/kinshasa.jpeg', 
      country: 'Congo', 
      city: 'Kinshasa',
      fallback: '🇨🇩',
      description: 'Ville de Kinshasa',
      date: 'Février 2026'
    },
    { 
      src: '/images/abidjan.jpg', 
      country: 'Côte d\'Ivoire', 
      city: 'Abidjan',
      fallback: '🇨🇮',
      description: 'Ville d\'Abidjan',
      date: 'Mai 2026'
    },
    { 
      src: '/images/bordeaux.jpg', 
      country: 'France', 
      city: 'Bordeaux',
      fallback: '🇫🇷',
      description: 'Place de la Bourse',
      date: 'Mars 2026'
    },
    { 
      src: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&h=800&fit=crop&q=90&auto=format', 
      country: 'Maroc', 
      city: 'Casablanca',
      fallback: '🇲🇦',
      description: 'Mosquée Hassan II',
      date: 'Avril 2026'
    },
    { 
      src: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=800&fit=crop&q=90&auto=format', 
      country: 'États-Unis', 
      city: 'New York',
      fallback: '🇺🇸',
      description: 'Skyline de New York',
      date: null
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name === 'transport' || name === 'accommodation' || name === 'logistics') {
        setFormData(prev => ({ ...prev, [name]: checked }))
      } else if (name === 'frameworkAcknowledged' || name === 'contractAccepted' || name === 'writtenAgreementAccepted') {
        setFormData(prev => ({ ...prev, [name]: checked }))
      } else if (name === 'communicationChannels') {
        setFormData(prev => {
          const prevChannels = prev.communicationChannels || []
          if (checked) {
            return { ...prev, communicationChannels: [...prevChannels, value] }
          } else {
            return { ...prev, communicationChannels: prevChannels.filter(ch => ch !== value) }
          }
        })
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, [name]: file }))
  }

  // Validation des champs pour chaque étape
  const validateStep = (stepIndex: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    const step = formSteps[stepIndex]
    
    step.fields.forEach((field) => {
      const value = formData[field as keyof typeof formData]
      
      // Vérifier les champs obligatoires
      if (field === 'responsibleEmail') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push('Email professionnel est requis')
        } else if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push('Format email invalide')
        }
      } else if (field === 'responsiblePhone') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push('Téléphone est requis')
        } else if (typeof value === 'string' && value.length < 8) {
          errors.push('Numéro de téléphone invalide')
        }
      } else if (field === 'structureAddress') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push('Adresse complète est requise')
        }
      } else if (field !== 'structureWebsite' && field !== 'customFormat' && field !== 'pitchDetails' && 
                 field !== 'venueCapacity' && field !== 'percentageDetails' && field !== 'eventPresentation' &&
                 field !== 'transport' && field !== 'accommodation' && field !== 'logistics' &&
                 field !== 'communicationChannels') {
        if (!value || (typeof value === 'string' && value.trim() === '') || 
            (typeof value === 'boolean' && !value) ||
            (Array.isArray(value) && value.length === 0)) {
          const fieldLabels: Record<string, string> = {
            structureName: t.masterclass.formLabels.structureName,
            legalForm: t.masterclass.formLabels.legalForm,
            registrationNumber: t.masterclass.formLabels.registrationNumber,
            responsibleName: t.masterclass.formLabels.responsibleName,
            responsibleFunction: t.masterclass.formLabels.responsibleFunction,
            city: t.masterclass.formLabels.city,
            country: t.masterclass.formLabels.country,
            proposedDate: t.masterclass.formLabels.proposedDate,
            eventType: t.masterclass.formLabels.eventType,
            targetAudience: t.masterclass.formLabels.targetAudience,
            estimatedParticipants: t.masterclass.formLabels.estimatedParticipants,
            standardFormat: t.masterclass.formLabels.standardFormat,
            venueIdentified: t.masterclass.formLabels.venueIdentified,
            proposedFee: t.masterclass.formLabels.proposedFee,
            structureDocument: t.masterclass.formLabels.structureDocument,
            identityDocument: t.masterclass.formLabels.identityDocument,
            frameworkAcknowledged: t.masterclass.formLabels.frameworkAcknowledged,
            contractAccepted: t.masterclass.formLabels.contractAccepted,
            writtenAgreementAccepted: t.masterclass.formLabels.writtenAgreementAccepted
          }
          errors.push(fieldLabels[field] || field + ' ' + t.masterclass.formLabels.fillAllFields)
        }
      }
    })
    
    return { isValid: errors.length === 0, errors }
  }

  const handleNext = () => {
    // Valider l'étape actuelle avant de passer à la suivante
    const validation = validateStep(currentStep)
    
    if (!validation.isValid) {
      alert(t.masterclass.formLabels.fillAllFields + ':\n\n' + validation.errors.join('\n'))
      return
    }
    
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      // Scroll vers le formulaire au lieu du haut de la page
      setTimeout(() => {
        const formElement = document.getElementById('masterclass-form')
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      // Scroll vers le formulaire au lieu du haut de la page
      setTimeout(() => {
        const formElement = document.getElementById('masterclass-form')
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-complétion d'adresse avec Nominatim OpenStreetMap (comme dans le formulaire signup)
  useEffect(() => {
    if (!structureAddressQuery || structureAddressQuery.trim().length < 2) {
      setStructureAddressSuggestions([])
      setStructureAddressLoading(false)
      return
    }

    const controller = new AbortController()
    const debounce = setTimeout(async () => {
      try {
        setStructureAddressLoading(true)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
            structureAddressQuery.trim()
          )}`,
          {
            headers: { Accept: 'application/json' },
            signal: controller.signal
          }
        )
        if (!response.ok) throw new Error('Erreur lors de la recherche d\'adresse')
        const data = await response.json()
        const suggestions =
          (data || []).map((item: any) => {
            const fullAddress = item.display_name || ''
            return {
              id: item.place_id?.toString() || `${item.lat}-${item.lon}`,
              address: fullAddress,
              label: fullAddress
            }
          }) ?? []
        setStructureAddressSuggestions(suggestions)
      } catch (fetchError) {
        if ((fetchError as any)?.name !== 'AbortError') {
          setStructureAddressSuggestions([])
        }
      } finally {
        setStructureAddressLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(debounce)
      controller.abort()
    }
  }, [structureAddressQuery])

  // Auto-complétion pour le formulaire sponsor
  useEffect(() => {
    if (!sponsorAddressQuery || sponsorAddressQuery.trim().length < 2) {
      setSponsorAddressSuggestions([])
      setSponsorAddressLoading(false)
      return
    }

    const controller = new AbortController()
    const debounce = setTimeout(async () => {
      try {
        setSponsorAddressLoading(true)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
            sponsorAddressQuery.trim()
          )}`,
          {
            headers: { Accept: 'application/json' },
            signal: controller.signal
          }
        )
        if (!response.ok) throw new Error('Erreur lors de la recherche d\'adresse')
        const data = await response.json()
        const suggestions =
          (data || []).map((item: any) => {
            const fullAddress = item.display_name || ''
            return {
              id: item.place_id?.toString() || `${item.lat}-${item.lon}`,
              address: fullAddress,
              label: fullAddress
            }
          }) ?? []
        setSponsorAddressSuggestions(suggestions)
      } catch (fetchError) {
        if ((fetchError as any)?.name !== 'AbortError') {
          setSponsorAddressSuggestions([])
        }
      } finally {
        setSponsorAddressLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(debounce)
      controller.abort()
    }
  }, [sponsorAddressQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation côté client avant envoi
      const requiredFields = [
        { key: 'structureName', label: 'Nom de la structure' },
        { key: 'legalForm', label: 'Forme juridique' },
        { key: 'registrationNumber', label: 'Numéro d\'immatriculation' },
        { key: 'structureAddress', label: 'Adresse de la structure' },
        { key: 'responsibleName', label: 'Nom du responsable' },
        { key: 'responsibleFunction', label: 'Fonction du responsable' },
        { key: 'responsibleEmail', label: 'Email du responsable' },
        { key: 'responsiblePhone', label: 'Téléphone du responsable' },
        { key: 'city', label: 'Ville' },
        { key: 'country', label: 'Pays' },
        { key: 'proposedDate', label: 'Date(s) souhaitée(s)' },
        { key: 'eventType', label: 'Type d\'événement' },
        { key: 'targetAudience', label: 'Public visé' },
        { key: 'estimatedParticipants', label: 'Nombre de participants estimé' },
        { key: 'standardFormat', label: 'Format standard' },
        { key: 'venueIdentified', label: 'Salle identifiée' },
        { key: 'proposedFee', label: 'Cachet proposé' }
      ]

      const missingFields: string[] = []
      requiredFields.forEach(({ key, label }) => {
        const value = formData[key as keyof typeof formData]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missingFields.push(label)
        }
      })

      if (!formData.structureDocument || !(formData.structureDocument instanceof File)) {
        missingFields.push('Document de la structure')
      }
      if (!formData.identityDocument || !(formData.identityDocument instanceof File)) {
        missingFields.push('Pièce d\'identité du responsable')
      }
      if (!formData.frameworkAcknowledged) missingFields.push('Cadre officiel (case à cocher)')
      if (!formData.contractAccepted) missingFields.push('Acceptation du contrat (case à cocher)')
      if (!formData.writtenAgreementAccepted) missingFields.push('Acceptation de l\'accord écrit (case à cocher)')

      if (missingFields.length > 0) {
        const errorMessage = 'Veuillez remplir tous les champs obligatoires:\n\n' + missingFields.join('\n')
        alert(errorMessage)
        setIsSubmitting(false)
        // Retourner à la première étape avec des champs manquants
        setCurrentStep(0)
        return
      }

      const submitFormData = new FormData()
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'communicationChannels') {
          submitFormData.append(key, JSON.stringify(value))
        } else if (value instanceof File) {
          submitFormData.append(key, value)
        } else if (typeof value === 'boolean') {
          submitFormData.append(key, value.toString())
        } else if (Array.isArray(value)) {
          submitFormData.append(key, JSON.stringify(value))
        } else {
          submitFormData.append(key, String(value || ''))
        }
      })

      const response = await fetch('/api/masterclass/request', {
        method: 'POST',
        body: submitFormData
      })

      const result = await response.json()

      if (!response.ok) {
        let errorMessage = result.error || 'Erreur lors de l\'envoi'
        if (result.missingFields && result.missingFields.length > 0) {
          errorMessage += ':\n\n' + result.missingFields.join('\n')
        }
        throw new Error(errorMessage)
      }

      setFormSubmitted(true)
    } catch (error) {
      console.error('Erreur soumission:', error)
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToForm = () => {
    const formElement = document.getElementById('masterclass-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
      setCurrentStep(0)
    }
  }

  const progress = ((currentStep + 1) / formSteps.length) * 100

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero Section - Design moderne */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 pt-16 lg:pt-20">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                {t.masterclass.hero.title}{' '}
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  {t.masterclass.hero.titleHighlight}
                </span>
              </h1>
              <p className="text-2xl sm:text-3xl text-gray-200 mb-4 font-light">
                {t.masterclass.hero.tagline}
              </p>
              <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
                {t.masterclass.hero.subtitle}
              </p>
              <div className="flex flex-col gap-6 justify-center items-center">
                {/* Boutons principaux */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={scrollToForm}
                    className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold text-lg rounded-full hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-yellow-500/50"
                  >
                    {t.masterclass.hero.requestButton}
                  </button>
                  <button
                    onClick={() => setActiveTab('sponsors')}
                    className="px-10 py-4 bg-white/10 backdrop-blur-md text-white font-semibold text-lg rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20"
                  >
                    {t.masterclass.hero.sponsorButton}
                  </button>
                </div>
                
                {/* Boutons secondaires légers */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <a
                      href="/pdf/CASH360_Masterclass.pdf"
                      download="CASH360_Masterclass.pdf"
                      className="px-6 py-2 text-white/80 font-medium text-sm rounded-full hover:text-white hover:bg-white/10 transition-all duration-300"
                    >
                      📄 {t.masterclass.hero.downloadBrochure}
                    </a>
                    <a
                      href="/api/sponsors/download-dossier"
                      download="dossier-sponsor-cash360.zip"
                      className="px-6 py-2 text-white/80 font-medium text-sm rounded-full hover:text-white hover:bg-white/10 transition-all duration-300"
                    onClick={async (e) => {
                      e.preventDefault()
                      try {
                        const response = await fetch('/api/sponsors/download-dossier')
                        if (!response.ok) throw new Error('Erreur lors du téléchargement')
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'dossier-sponsor-cash360.zip'
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      } catch (error) {
                        console.error('Erreur téléchargement ZIP:', error)
                        alert('Erreur lors du téléchargement du dossier sponsor')
                      }
                    }}
                  >
                    📦 {t.masterclass.hero.downloadSponsorPack}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </section>

        {/* Onglets Masterclass / Sponsors */}
        <section className="bg-white border-b-2 border-gray-200 sticky top-16 lg:top-20 z-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('masterclass')}
                className={`px-6 py-4 text-lg font-semibold transition-all duration-300 ${
                  activeTab === 'masterclass'
                    ? 'text-yellow-600 border-b-4 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.masterclass.tabs.masterclass}
              </button>
              <button
                onClick={() => setActiveTab('sponsors')}
                className={`px-6 py-4 text-lg font-semibold transition-all duration-300 ${
                  activeTab === 'sponsors'
                    ? 'text-yellow-600 border-b-4 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.masterclass.tabs.sponsors}
              </button>
            </div>
          </div>
        </section>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'masterclass' ? (
          <>
            {/* Conference Gallery Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                {t.masterclass.gallery.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {t.masterclass.gallery.subtitle}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conferenceImages.map((img, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative h-80 w-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    {/* Image principale */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={`Masterclass Cash360 à ${img.city}, ${img.country}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback si l'image ne charge pas
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent && !parent.querySelector('.fallback-content')) {
                          const fallback = document.createElement('div')
                          fallback.className = 'fallback-content absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-100 to-blue-100'
                          fallback.innerHTML = `
                            <div class="text-center p-6">
                              <div class="text-6xl mb-4">${img.fallback}</div>
                              <p class="text-gray-700 font-semibold text-lg">${img.city}</p>
                              <p class="text-gray-600">${img.country}</p>
                            </div>
                          `
                          parent.appendChild(fallback)
                        }
                      }}
                    />
                    {/* Overlay gradient pour meilleure lisibilité du texte */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-xl mb-1">{img.city}</h3>
                    <p className="text-white/80 text-sm mb-2">{img.country}</p>
                    {img.date && (
                      <p className="text-yellow-400 font-semibold text-sm">📅 {img.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Sections - Design moderne avec cards */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto max-w-6xl">
            
            {/* Pourquoi organiser une masterclass */}
            <div className="mb-16">
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl">💡</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {t.masterclass.why.title}
                  </h2>
                </div>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    {t.masterclass.why.description1}
                  </p>
                  <p>
                    {t.masterclass.why.description2}
                  </p>
                  <p className="text-xl font-bold text-gray-900 pt-4 border-t border-gray-200">
                    {t.masterclass.why.highlight}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de cards modernes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {/* À qui s'adressent */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-3xl mr-3">🎯</span>
                  {t.masterclass.audience.title}
                </h3>
                <ul className="space-y-3">
                  {t.masterclass.audience.items.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-yellow-600 text-xl mr-3 mt-1">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                  {t.masterclass.audience.note}
                </p>
              </div>

              {/* Format */}
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-8 shadow-xl text-gray-900">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="text-3xl mr-3">📋</span>
                  {t.masterclass.format.title}
                </h3>
                <ul className="space-y-2">
                  {t.masterclass.format.items.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-gray-900 text-xl mr-3">•</span>
                      <span className="text-gray-900 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Thème officiel */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 shadow-2xl mb-16 text-white relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <span className="inline-block px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm font-semibold rounded-full mb-4 border border-yellow-500/30">
                    {t.masterclass.theme.officialTheme2026}
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    {t.masterclass.theme.subtitle}
                  </h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    {t.masterclass.theme.teaching}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                  {t.masterclass.theme.points.map((text: string, idx: number) => {
                    const icons = ['💡', '🔍', '🏗️', '🎯']
                    return {
                      text,
                      icon: icons[idx] || '✓'
                    }
                  }).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center mr-4 text-2xl">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-yellow-400 text-xl mr-2 font-bold">✓</span>
                            <span className="text-white text-lg font-semibold">{item.text}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ce que Cash360 apporte */}
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t.masterclass.benefits.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {t.masterclass.benefits.items.map((item, idx) => (
                  <div key={idx} className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <p className="text-gray-800 font-medium">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Processus */}
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t.masterclass.process.title}</h2>
              <div className="space-y-8">
                {t.masterclass.process.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start p-6 bg-gray-50 rounded-2xl">
                    <div className="text-4xl mr-6">{step.num}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-700 mb-2">{step.desc}</p>
                      {step.downloadLabel && (
                        <a
                          href="/pdf/Lettre_Invitation_Officielle_Cash360.pdf"
                          download="Lettre_Invitation_Officielle_Cash360.pdf"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-md mt-2"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {step.downloadLabel}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Formulaire Style Typeform */}
        <section id="masterclass-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 min-h-screen">
          <div className="container mx-auto max-w-4xl">
            {formSubmitted ? (
              <div className="bg-white rounded-3xl p-12 shadow-2xl text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.masterclass.formLabels.thankYou}</h2>
                <p className="text-lg text-gray-700 mb-6">
                  {t.masterclass.formLabels.thankYouMessage}
                </p>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    📩 {t.masterclass.formLabels.afterSubmission}<br />
                    <a href="mailto:myriamkonan@cash360.finance" className="text-yellow-600 hover:underline font-semibold">
                      myriamkonan@cash360.finance
                    </a>
                  </p>
                  <a
                    href="/pdf/Lettre_Invitation_Officielle_Cash360.pdf"
                    download="Lettre_Invitation_Officielle_Cash360.pdf"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t.masterclass.process.steps[0].downloadLabel}
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-2 bg-gray-200">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Form Header */}
                <div className="p-8 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-yellow-600">
                      {t.masterclass.form.previous ? 'Étape' : 'Step'} {currentStep + 1} {t.masterclass.form.previous ? 'sur' : 'of'} {formSteps.length}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {formSteps[currentStep].title}
                  </h2>
                </div>

                {/* Form Content */}
                <div className="p-8 min-h-[400px]">
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Step 1: Structure */}
                    {currentStep === 0 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.structureName} *</label>
                          <input type="text" name="structureName" value={formData.structureName} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.legalForm} *</label>
                          <select name="legalForm" value={formData.legalForm} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="">{t.masterclass.formLabels.selectOption}</option>
                            <option value="Association">Association</option>
                            <option value="Entreprise">Entreprise</option>
                            <option value="Église">Église</option>
                            <option value="Institution">Institution</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.registrationNumber} *</label>
                          <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.structureAddress} *</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={structureAddressQuery}
                              onChange={(e) => {
                                const value = e.target.value
                                setStructureAddressQuery(value)
                                setFormData(prev => ({ ...prev, structureAddress: value }))
                                if (!value) {
                                  setStructureAddressSuggestions([])
                                }
                              }}
                              placeholder="Commencez à taper une adresse..."
                              required
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                            />
                            {structureAddressLoading && (
                              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                              </div>
                            )}
                            {structureAddressSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full max-h-56 overflow-auto bg-white border-2 border-gray-200 rounded-xl shadow-lg mt-2">
                                {structureAddressSuggestions.map((suggestion) => (
                                  <button
                                    type="button"
                                    key={suggestion.id}
                                    className="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors border-b border-gray-100 last:border-b-0"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, structureAddress: suggestion.address }))
                                      setStructureAddressQuery(suggestion.label)
                                      setStructureAddressSuggestions([])
                                    }}
                                  >
                                    <span className="text-gray-900 text-sm">{suggestion.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.structureWebsite}</label>
                          <input type="text" name="structureWebsite" value={formData.structureWebsite} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Responsable */}
                    {currentStep === 1 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.responsibleName} *</label>
                          <input type="text" name="responsibleName" value={formData.responsibleName} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.responsibleFunction} *</label>
                          <input type="text" name="responsibleFunction" value={formData.responsibleFunction} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.responsibleEmail} *</label>
                          <input 
                            type="email" 
                            name="responsibleEmail" 
                            value={formData.responsibleEmail} 
                            onChange={handleInputChange} 
                            required 
                            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                            placeholder="exemple@entreprise.com"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all invalid:border-red-300" 
                          />
                          {formData.responsibleEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.responsibleEmail) && (
                            <p className="mt-1 text-sm text-red-600">{t.masterclass.formLabels.errorMessage || "Format email invalide"}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.responsiblePhone} *</label>
                          <PhoneInput
                            international
                            defaultCountry="FR"
                            value={formData.responsiblePhone}
                            onChange={(value) => setFormData(prev => ({ ...prev, responsiblePhone: value || '' }))}
                            className="w-full"
                            numberInputProps={{
                              className: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all'
                            }}
                            countrySelectProps={{
                              className: 'px-4 py-3 border-2 border-gray-200 rounded-l-xl focus:border-yellow-500'
                            }}
                          />
                          {formData.responsiblePhone && formData.responsiblePhone.length < 8 && (
                            <p className="mt-1 text-sm text-red-600">{t.masterclass.formLabels.errorMessage || "Numéro de téléphone invalide"}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Événement */}
                    {currentStep === 2 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.city} *</label>
                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.country} *</label>
                            <input type="text" name="country" value={formData.country} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.proposedDate} *</label>
                          <input type="text" name="proposedDate" value={formData.proposedDate} onChange={handleInputChange} required placeholder="Ex: 15 mars 2026" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.eventType} *</label>
                          <select name="eventType" value={formData.eventType} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value={t.masterclass.formOptions.eventTypes.masterclass}>{t.masterclass.formOptions.eventTypes.masterclass}</option>
                            <option value={t.masterclass.formOptions.eventTypes.workshop}>{t.masterclass.formOptions.eventTypes.workshop}</option>
                            <option value={t.masterclass.formOptions.eventTypes.conference}>{t.masterclass.formOptions.eventTypes.conference}</option>
                            <option value={t.masterclass.formOptions.eventTypes.other}>{t.masterclass.formOptions.eventTypes.other}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Public */}
                    {currentStep === 3 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.targetAudience} *</label>
                          <select name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="">{t.masterclass.formLabels.selectOption}</option>
                            <option value="Étudiants">Étudiants</option>
                            <option value="Particuliers">Particuliers</option>
                            <option value="Entrepreneurs / porteurs de projets">Entrepreneurs / porteurs de projets</option>
                            <option value="Leaders / responsables">Leaders / responsables</option>
                            <option value="Public mixte">Public mixte</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.estimatedParticipants} *</label>
                          <input type="number" name="estimatedParticipants" value={formData.estimatedParticipants} onChange={handleInputChange} required min="1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                      </div>
                    )}

                    {/* Step 5: Format */}
                    {currentStep === 4 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.standardFormat} ? *</label>
                          <select name="standardFormat" value={formData.standardFormat} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="Oui">Oui</option>
                            <option value="Non">Non (préciser)</option>
                          </select>
                        </div>
                        {formData.standardFormat === 'Non' && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.customFormat}</label>
                            <textarea name="customFormat" value={formData.customFormat} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.pitchEntrepreneurial} ?</label>
                          <select name="pitchEntrepreneurial" value={formData.pitchEntrepreneurial} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="Non">Non</option>
                            <option value="Oui">Oui</option>
                          </select>
                        </div>
                        {formData.pitchEntrepreneurial === 'Oui' && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.pitchDetails}</label>
                            <textarea name="pitchDetails" value={formData.pitchDetails} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 6: Logistique */}
                    {currentStep === 5 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Salle identifiée ? *</label>
                          <select name="venueIdentified" value={formData.venueIdentified} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="">Sélectionner...</option>
                            <option value="Oui">Oui</option>
                            <option value="Non">Non</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Capacité de la salle</label>
                          <input type="number" name="venueCapacity" value={formData.venueCapacity} onChange={handleInputChange} min="1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-4">Prise en charge :</label>
                          <div className="space-y-3">
                            {[
                              { name: 'transport', label: 'Transport (billets d\'avion)' },
                              { name: 'accommodation', label: 'Hébergement (hôtel 3★ minimum)' },
                              { name: 'logistics', label: 'Logistique sur place (son, sécurité, accueil)' }
                            ].map((item) => (
                              <label key={item.name} className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-500 cursor-pointer transition-all">
                                <input type="checkbox" name={item.name} checked={formData[item.name as keyof typeof formData] as boolean} onChange={handleInputChange} className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500" />
                                <span className="ml-3 text-gray-700">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 7: Finances */}
                    {currentStep === 6 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Cachet proposé *</label>
                          <input type="text" name="proposedFee" value={formData.proposedFee} onChange={handleInputChange} required placeholder="Ex: 5000 EUR" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Pourcentage sur billetterie ?</label>
                          <select name="percentageOnTickets" value={formData.percentageOnTickets} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="Non">Non</option>
                            <option value="Oui">Oui</option>
                          </select>
                        </div>
                        {formData.percentageOnTickets === 'Oui' && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Détails du pourcentage</label>
                            <input type="text" name="percentageDetails" value={formData.percentageDetails} onChange={handleInputChange} placeholder="Ex: 30% des recettes" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 8: Communication */}
                    {currentStep === 7 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-4">Canaux de communication prévus</label>
                          <div className="space-y-3">
                            {['Réseaux sociaux', 'Canaux locaux', 'Médias', 'Autre'].map((channel) => (
                              <label key={channel} className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-500 cursor-pointer transition-all">
                                <input type="checkbox" name="communicationChannels" value={channel} checked={formData.communicationChannels.includes(channel)} onChange={handleInputChange} className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500" />
                                <span className="ml-3 text-gray-700">{channel}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Sponsors associés ?</label>
                          <select name="sponsors" value={formData.sponsors} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="Non">Non</option>
                            <option value="Oui">Oui</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Step 9: Documents */}
                    {currentStep === 8 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Document officiel de la structure *</label>
                          <input type="file" name="structureDocument" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Pièce d'identité du responsable *</label>
                          <input type="file" name="identityDocument" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Présentation de l'événement (optionnel)</label>
                          <input type="file" name="eventPresentation" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
                        </div>
                      </div>
                    )}

                    {/* Step 10: Engagement */}
                    {currentStep === 9 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="space-y-4">
                          {[
                            { name: 'frameworkAcknowledged', label: 'Je confirme avoir pris connaissance du cadre officiel des masterclass Cash360' },
                            { name: 'contractAccepted', label: 'J\'accepte que toute collaboration soit soumise à validation et signature d\'un contrat' },
                            { name: 'writtenAgreementAccepted', label: 'Je comprends qu\'aucun événement ne sera confirmé sans accord écrit préalable' }
                          ].map((item) => (
                            <label key={item.name} className="flex items-start p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-500 cursor-pointer transition-all">
                              <input type="checkbox" name={item.name} checked={formData[item.name as keyof typeof formData] as boolean} onChange={handleInputChange} required className="mt-1 w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500" />
                              <span className="ml-3 text-gray-700">{item.label} *</span>
                            </label>
                          ))}
                        </div>
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-6">
                          <p className="text-sm text-gray-700 mb-3">
                            📩 {t.masterclass.formLabels.afterSubmission}<br />
                            <a href="mailto:myriamkonan@cash360.finance" className="font-semibold text-yellow-700 hover:underline">myriamkonan@cash360.finance</a>
                          </p>
                          <a
                            href="/pdf/Lettre_Invitation_Officielle_Cash360.pdf"
                            download="Lettre_Invitation_Officielle_Cash360.pdf"
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-md text-sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t.masterclass.process.steps[0].downloadLabel}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Footer */}
                <div className="p-8 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.masterclass.form.previous}
                  </button>
                  
                  {currentStep < formSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      {t.masterclass.form.next}
                    </button>
                  ) : (
                    <div className="flex gap-4 items-center">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? t.masterclass.form.submitting : t.masterclass.form.submit}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('sponsors')}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                      >
                        {t.masterclass.form.sponsorButton}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Bouton télécharger brochure */}
                {currentStep === formSteps.length - 1 && (
                  <div className="px-8 pb-8 border-t border-gray-200 bg-gray-50 flex justify-center">
                    <a
                      href="/pdf/CASH360_Masterclass.pdf"
                      download="CASH360_Masterclass.pdf"
                      className="inline-flex items-center px-6 py-2 text-gray-600 font-medium rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-all text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t.masterclass.form.downloadBrochure}
                    </a>
                  </div>
                )}
              </form>
            )}
          </div>
        </section>
          </>
        ) : (
          /* Contenu Onglet Sponsors */
          <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto max-w-6xl">
              {/* Header Sponsors */}
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                  🤝 {t.masterclass.sponsors.title}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                  {t.masterclass.sponsors.subtitle}
                </p>
                <p className="text-lg text-gray-700 max-w-4xl mx-auto">
                  {t.masterclass.sponsors.intro}
                </p>
              </div>

              {/* Pourquoi sponsoriser */}
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 mb-16">
                <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-3xl mr-3">🎯</span>
                  {t.masterclass.sponsors.whyTitle}
                </h3>
                <p className="text-lg text-gray-700 mb-6">
                  {t.masterclass.sponsors.whyDescription}
                </p>
                <ul className="space-y-3 mb-6">
                  {t.masterclass.sponsors.whyItems.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-yellow-600 text-xl mr-3 mt-1">✓</span>
                      <span className="text-gray-700 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                  <p className="text-gray-800 font-semibold mb-2">{t.masterclass.sponsors.benefitsTitle}</p>
                  <ul className="space-y-2">
                    {t.masterclass.sponsors.benefits.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Dossier Sponsor */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 shadow-2xl mb-16 text-white">
                <h3 className="text-3xl font-bold mb-6 text-center text-white">📦 {t.masterclass.sponsors.dossierTitle}</h3>
                <p className="text-lg text-gray-300 mb-8 text-center max-w-3xl mx-auto">
                  {t.masterclass.sponsors.dossierSubtitle}
                </p>
                
                {/* Bouton téléchargement ZIP */}
                <div className="text-center mb-12">
                  <a
                    href="/api/sponsors/download-dossier"
                    download="dossier-sponsor-cash360.zip"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-yellow-500/50"
                    onClick={async (e) => {
                      e.preventDefault()
                      try {
                        const response = await fetch('/api/sponsors/download-dossier')
                        if (!response.ok) throw new Error('Erreur lors du téléchargement')
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'dossier-sponsor-cash360.zip'
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      } catch (error) {
                        console.error('Erreur téléchargement ZIP:', error)
                        alert('Erreur lors du téléchargement du dossier sponsor')
                      }
                    }}
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t.masterclass.sponsors.downloadZip}
                  </a>
                </div>

                {/* Liste des documents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { num: '1️⃣', title: t.masterclass.sponsors.documents.plaquette.title, desc: t.masterclass.sponsors.documents.plaquette.desc, file: 'Cash360-Plaquette-sponsor.pdf', path: '/pdf/sponsors/Cash360-Plaquette-sponsor.pdf' },
                    { num: '2️⃣', title: t.masterclass.sponsors.documents.contrat.title, desc: t.masterclass.sponsors.documents.contrat.desc, file: 'contrat_sponsor.pdf', path: '/pdf/sponsors/contrat_sponsor.pdf' },
                    { num: '3️⃣', title: t.masterclass.sponsors.documents.institutionnelle.title, desc: t.masterclass.sponsors.documents.institutionnelle.desc, file: 'Cash360-Version-Institutionnelle.pdf', path: '/pdf/sponsors/Cash360-Version-Institutionnelle.pdf' },
                    { num: '4️⃣', title: t.masterclass.sponsors.documents.internationale.title, desc: t.masterclass.sponsors.documents.internationale.desc, file: 'Cash360-Afrique-and-Diaspora-2.pdf', path: '/pdf/Cash360-Afrique-and-Diaspora-2.pdf' }
                  ].map((doc, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                      <div className="flex items-start mb-3">
                        <span className="text-2xl mr-3">{doc.num}</span>
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-lg mb-2">{doc.title}</h4>
                          <p className="text-gray-300 text-sm mb-4">{doc.desc}</p>
                          <a
                            href={doc.path || `/pdf/sponsors/${doc.file}`}
                            download={doc.file}
                            className="inline-flex items-center text-yellow-400 hover:text-yellow-300 font-semibold text-sm transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t.masterclass.sponsors.downloadPdf}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment devenir sponsor */}
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 mb-16">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">📝 {t.masterclass.sponsors.dossierTitle}</h3>
                <ol className="space-y-4">
                  {t.masterclass.sponsors.commitments.map((step: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 text-lg pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Contact */}
              <div className="bg-gradient-to-r from-yellow-50 to-blue-50 rounded-3xl p-10 shadow-xl border border-yellow-200 mb-16">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">📩 {t.masterclass.sponsors.contactTitle}</h3>
                <p className="text-lg text-gray-700 mb-4">
                  {t.masterclass.sponsors.contactText}
                </p>
                <div className="space-y-3">
                  <p className="text-xl font-bold text-gray-900">Cash360 Finance</p>
                  <p className="text-gray-700">📍 {t.masterclass.sponsors.contactAddress}</p>
                  <a href={`mailto:${t.masterclass.sponsors.contactEmail}`} className="text-yellow-600 hover:text-yellow-700 font-semibold text-lg">
                    📧 {t.masterclass.sponsors.contactEmail}
                  </a>
                </div>
              </div>

              {/* Cadre & engagement */}
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">🔐 {t.masterclass.sponsors.commitmentTitle}</h3>
                <ul className="space-y-3">
                  {t.masterclass.sponsors.commitments.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 text-xl mr-3 mt-1">✓</span>
                      <span className="text-gray-700 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Formulaire de sponsoring */}
              <div id="sponsor-form" className="mt-20">
                {sponsorFormSubmitted ? (
                  <div className="bg-white rounded-3xl p-12 shadow-xl text-center border border-gray-100">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.masterclass.formLabels.thankYou}</h3>
                    <p className="text-lg text-gray-700 mb-6">
                      {t.masterclass.formLabels.thankYouMessage}
                    </p>
                    <p className="text-sm text-gray-600">
                      📩 Contact : <a href="mailto:myriamkonan@cash360.finance" className="text-yellow-600 hover:underline font-semibold">myriamkonan@cash360.finance</a>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    setSponsorIsSubmitting(true)
                    try {
                      const response = await fetch('/api/sponsors/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sponsorFormData)
                      })
                      const result = await response.json()
                      if (!response.ok) throw new Error(result.error || 'Erreur')
                      setSponsorFormSubmitted(true)
                    } catch (error) {
                      alert('Erreur lors de l\'envoi. Veuillez réessayer ou contacter directement myriamkonan@cash360.finance')
                    } finally {
                      setSponsorIsSubmitting(false)
                    }
                  }} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-200">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                        style={{ width: `${((sponsorCurrentStep + 1) / sponsorFormSteps.length) * 100}%` }}
                      />
                    </div>

                    {/* Form Header */}
                    <div className="p-8 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-yellow-600">
                          {t.masterclass.form.previous ? 'Étape' : 'Step'} {sponsorCurrentStep + 1} {t.masterclass.form.previous ? 'sur' : 'of'} {sponsorFormSteps.length}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900">
                        {sponsorFormSteps[sponsorCurrentStep].title}
                      </h3>
                    </div>

                    {/* Form Content */}
                    <div className="p-8 min-h-[400px]">
                      <div className="max-w-2xl mx-auto space-y-6">
                        {/* Step 1: Organization */}
                        {sponsorCurrentStep === 0 && (
                          <div className="space-y-6 animate-fadeIn">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.organizationName} *</label>
                              <input type="text" name="organizationName" value={sponsorFormData.organizationName} onChange={(e) => setSponsorFormData(prev => ({ ...prev, organizationName: e.target.value }))} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.legalForm} *</label>
                              <select name="legalForm" value={sponsorFormData.legalForm} onChange={(e) => setSponsorFormData(prev => ({ ...prev, legalForm: e.target.value }))} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                                <option value="">{t.masterclass.formLabels.selectOption}</option>
                                <option value="Entreprise">Entreprise</option>
                                <option value="Association">Association</option>
                                <option value="Fondation">Fondation</option>
                                <option value="Banque">Banque</option>
                                <option value="ONG">ONG</option>
                                <option value="Institution">Institution</option>
                                <option value="Autre">Autre</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.registrationNumber} *</label>
                              <input type="text" name="registrationNumber" value={sponsorFormData.registrationNumber} onChange={(e) => setSponsorFormData(prev => ({ ...prev, registrationNumber: e.target.value }))} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.organizationAddress} *</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={sponsorAddressQuery}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setSponsorAddressQuery(value)
                                    setSponsorFormData(prev => ({ ...prev, organizationAddress: value }))
                                    if (!value) setSponsorAddressSuggestions([])
                                  }}
                                  placeholder="Commencez à taper une adresse..."
                                  required
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                                />
                                {sponsorAddressLoading && (
                                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                                  </div>
                                )}
                                {sponsorAddressSuggestions.length > 0 && (
                                  <div className="absolute z-50 w-full max-h-56 overflow-auto bg-white border-2 border-gray-200 rounded-xl shadow-lg mt-2">
                                    {sponsorAddressSuggestions.map((suggestion) => (
                                      <button
                                        type="button"
                                        key={suggestion.id}
                                        className="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors border-b border-gray-100 last:border-b-0"
                                        onClick={() => {
                                          setSponsorFormData(prev => ({ ...prev, organizationAddress: suggestion.address }))
                                          setSponsorAddressQuery(suggestion.label)
                                          setSponsorAddressSuggestions([])
                                        }}
                                      >
                                        <span className="text-gray-900 text-sm">{suggestion.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.organizationWebsite}</label>
                              <input type="text" name="organizationWebsite" value={sponsorFormData.organizationWebsite} onChange={(e) => setSponsorFormData(prev => ({ ...prev, organizationWebsite: e.target.value }))} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                            </div>
                          </div>
                        )}

                        {/* Step 2: Contact */}
                        {sponsorCurrentStep === 1 && (
                          <div className="space-y-6 animate-fadeIn">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.contactName} *</label>
                              <input type="text" name="contactName" value={sponsorFormData.contactName} onChange={(e) => setSponsorFormData(prev => ({ ...prev, contactName: e.target.value }))} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.contactFunction} *</label>
                              <input type="text" name="contactFunction" value={sponsorFormData.contactFunction} onChange={(e) => setSponsorFormData(prev => ({ ...prev, contactFunction: e.target.value }))} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.contactEmail} *</label>
                              <input 
                                type="email" 
                                name="contactEmail" 
                                value={sponsorFormData.contactEmail} 
                                onChange={(e) => setSponsorFormData(prev => ({ ...prev, contactEmail: e.target.value }))} 
                                required 
                                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                                placeholder="exemple@entreprise.com"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all invalid:border-red-300" 
                              />
                              {sponsorFormData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorFormData.contactEmail) && (
                                <p className="mt-1 text-sm text-red-600">{t.masterclass.formLabels.errorMessage || "Format email invalide"}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.contactPhone} *</label>
                              <PhoneInput
                                international
                                defaultCountry="FR"
                                value={sponsorFormData.contactPhone}
                                onChange={(value) => setSponsorFormData(prev => ({ ...prev, contactPhone: value || '' }))}
                                className="w-full"
                                numberInputProps={{
                                  className: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all'
                                }}
                                countrySelectProps={{
                                  className: 'px-4 py-3 border-2 border-gray-200 rounded-l-xl focus:border-yellow-500'
                                }}
                              />
                              {sponsorFormData.contactPhone && sponsorFormData.contactPhone.length < 8 && (
                                <p className="mt-1 text-sm text-red-600">{t.masterclass.formLabels.errorMessage || "Numéro de téléphone invalide"}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Step 3: Partnership */}
                        {sponsorCurrentStep === 2 && (
                          <div className="space-y-6 animate-fadeIn">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.partnershipType} *</label>
                              <select name="partnershipType" value={sponsorFormData.partnershipType} onChange={(e) => setSponsorFormData(prev => ({ ...prev, partnershipType: e.target.value }))} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                                <option value="">{t.masterclass.formLabels.selectOption}</option>
                                <option value={t.masterclass.formOptions.partnershipTypes.eventSponsoring}>{t.masterclass.formOptions.partnershipTypes.eventSponsoring}</option>
                                <option value={t.masterclass.formOptions.partnershipTypes.institutional}>{t.masterclass.formOptions.partnershipTypes.institutional}</option>
                                <option value={t.masterclass.formOptions.partnershipTypes.coOrganization}>{t.masterclass.formOptions.partnershipTypes.coOrganization}</option>
                                <option value={t.masterclass.formOptions.partnershipTypes.programSupport}>{t.masterclass.formOptions.partnershipTypes.programSupport}</option>
                                <option value={t.masterclass.formOptions.partnershipTypes.other}>{t.masterclass.formOptions.partnershipTypes.other}</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.budgetRange} *</label>
                              <select name="budgetRange" value={sponsorFormData.budgetRange} onChange={(e) => setSponsorFormData(prev => ({ ...prev, budgetRange: e.target.value }))} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                                <option value="">{t.masterclass.formLabels.selectOption}</option>
                                <option value={t.masterclass.formOptions.budgetRanges.less1000}>{t.masterclass.formOptions.budgetRanges.less1000}</option>
                                <option value={t.masterclass.formOptions.budgetRanges["1000-5000"]}>{t.masterclass.formOptions.budgetRanges["1000-5000"]}</option>
                                <option value={t.masterclass.formOptions.budgetRanges["5000-10000"]}>{t.masterclass.formOptions.budgetRanges["5000-10000"]}</option>
                                <option value={t.masterclass.formOptions.budgetRanges.more10000}>{t.masterclass.formOptions.budgetRanges.more10000}</option>
                                <option value={t.masterclass.formOptions.budgetRanges.toDiscuss}>{t.masterclass.formOptions.budgetRanges.toDiscuss}</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.masterclass.formLabels.targetAudienceSponsor}</label>
                              <textarea name="targetAudience" value={sponsorFormData.targetAudience} onChange={(e) => setSponsorFormData(prev => ({ ...prev, targetAudience: e.target.value }))} rows={4} placeholder={t.masterclass.formLabels.targetAudienceSponsor + "..."} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                            </div>
                          </div>
                        )}

                        {/* Step 4: Commitment */}
                        {sponsorCurrentStep === 3 && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                              <p className="text-gray-800 font-semibold mb-4">{t.masterclass.sponsors.commitmentTitle}</p>
                              <ul className="space-y-2 mb-6">
                                {t.masterclass.sponsors.commitments.map((item, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-green-600 mr-2">✓</span>
                                    <span className="text-gray-700">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <label className="flex items-start p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-500 cursor-pointer transition-all">
                              <input 
                                type="checkbox" 
                                name="termsAccepted" 
                                checked={sponsorFormData.termsAccepted} 
                                onChange={(e) => setSponsorFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))} 
                                required 
                                className="mt-1 w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500" 
                              />
                              <span className="ml-3 text-gray-700">{t.masterclass.formLabels.termsAccepted} *</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Form Footer */}
                    <div className="p-8 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setSponsorCurrentStep(Math.max(0, sponsorCurrentStep - 1))}
                        disabled={sponsorCurrentStep === 0}
                        className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.masterclass.form.previous}
                      </button>
                      
                      {sponsorCurrentStep < sponsorFormSteps.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const step = sponsorFormSteps[sponsorCurrentStep]
                            const isValid = step.fields.every(field => {
                              const value = sponsorFormData[field as keyof typeof sponsorFormData]
                              if (field === 'termsAccepted') return value === true
                              if (field === 'organizationWebsite' || field === 'targetAudience') return true // Optionnels
                              return value && (typeof value === 'string' ? value.trim() !== '' : true)
                            })
                            if (!isValid) {
                              alert('Veuillez remplir tous les champs obligatoires')
                              return
                            }
                            setSponsorCurrentStep(sponsorCurrentStep + 1)
                          }}
                          className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                          {t.masterclass.form.next}
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={sponsorIsSubmitting || !sponsorFormData.termsAccepted}
                          className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sponsorIsSubmitting ? t.masterclass.form.submitting : t.masterclass.form.submit}
                        </button>
                      )}
                    </div>
                    
                    {/* Bouton télécharger dossier sponsor */}
                    {sponsorCurrentStep === sponsorFormSteps.length - 1 && (
                      <div className="px-8 pb-8 border-t border-gray-200 bg-gray-50 flex justify-center">
                        <a
                          href="/api/sponsors/download-dossier"
                          download="dossier-sponsor-cash360.zip"
                          className="inline-flex items-center px-6 py-2 text-gray-600 font-medium rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-all text-sm"
                          onClick={async (e) => {
                            e.preventDefault()
                            try {
                              const response = await fetch('/api/sponsors/download-dossier')
                              if (!response.ok) throw new Error('Erreur lors du téléchargement')
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = 'dossier-sponsor-cash360.zip'
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            } catch (error) {
                              console.error('Erreur téléchargement ZIP:', error)
                              alert('Erreur lors du téléchargement du dossier sponsor')
                            }
                          }}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t.masterclass.form.downloadSponsorPack}
                        </a>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 p-4 rounded-full shadow-2xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-110 hover:shadow-yellow-500/50"
          aria-label="Retour en haut"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 10l7-7m0 0l7 7m-7-7v18" 
            />
          </svg>
        </button>
      )}

      <Footer />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
