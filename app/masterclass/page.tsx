'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useLanguage } from '@/lib/LanguageContext'

interface FormStep {
  id: string
  title: string
  fields: string[]
}

export default function MasterclassPage() {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
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
    responsiblePhone: '',
    
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
    { id: 'structure', title: 'Informations sur votre structure', fields: ['structureName', 'legalForm', 'registrationNumber', 'structureAddress', 'structureWebsite'] },
    { id: 'responsible', title: 'Responsable de l\'événement', fields: ['responsibleName', 'responsibleFunction', 'responsibleEmail', 'responsiblePhone'] },
    { id: 'event', title: 'Informations sur l\'événement', fields: ['city', 'country', 'proposedDate', 'eventType'] },
    { id: 'audience', title: 'Public visé', fields: ['targetAudience', 'estimatedParticipants'] },
    { id: 'format', title: 'Format souhaité', fields: ['standardFormat', 'customFormat', 'pitchEntrepreneurial', 'pitchDetails'] },
    { id: 'logistics', title: 'Logistique & organisation', fields: ['venueIdentified', 'venueCapacity', 'transport', 'accommodation', 'logistics'] },
    { id: 'financial', title: 'Conditions financières', fields: ['proposedFee', 'percentageOnTickets', 'percentageDetails'] },
    { id: 'communication', title: 'Communication & visibilité', fields: ['communicationChannels', 'sponsors'] },
    { id: 'documents', title: 'Documents requis', fields: ['structureDocument', 'identityDocument', 'eventPresentation'] },
    { id: 'commitment', title: 'Engagement & validation', fields: ['frameworkAcknowledged', 'contractAccepted', 'writtenAgreementAccepted'] }
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

  const handleNext = () => {
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
        <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Organiser une{' '}
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Masterclass Cash360
                </span>
              </h1>
              <p className="text-2xl sm:text-3xl text-gray-200 mb-4 font-light">
                Éduquer. Structurer. Impacter durablement.
              </p>
              <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
                Rejoignez notre réseau international d'organisateurs et offrez à votre public un événement à fort impact éducatif
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={scrollToForm}
                  className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold text-lg rounded-full hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-yellow-500/50"
                >
                  Demander une masterclass
                </button>
                <a
                  href="/pdf/CASH360_Masterclass.pdf"
                  download="CASH360_Masterclass.pdf"
                  className="px-10 py-4 bg-white/10 backdrop-blur-md text-white font-semibold text-lg rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  📄 Télécharger la brochure
                </a>
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

        {/* Conference Gallery Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Nos Masterclass à travers le monde
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Découvrez nos événements organisés dans différents pays, rassemblant des milliers de participants passionnés par l'éducation financière
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
                    Pourquoi organiser une masterclass Cash360 ?
                  </h2>
                </div>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    Organiser une masterclass Cash360, c'est proposer à votre public un événement à fort impact éducatif, centré sur la stabilité financière, la responsabilité et la structuration des projets personnels et entrepreneuriaux.
                  </p>
                  <p>
                    Cash360 intervient en amont du financement, là où beaucoup d'initiatives échouent faute de préparation financière et de discipline.
                  </p>
                  <p className="text-xl font-bold text-gray-900 pt-4 border-t border-gray-200">
                    Former avant de financer. Structurer avant de croître.
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
                  À qui s'adressent les masterclass ?
                </h3>
                <ul className="space-y-3">
                  {['Étudiants', 'Particuliers souhaitant mieux gérer leurs finances', 'Entrepreneurs et porteurs de projets', 'Leaders et responsables communautaires'].map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-yellow-600 text-xl mr-3 mt-1">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                  👉 Une attention particulière est portée aux entrepreneurs et leaders
                </p>
              </div>

              {/* Format */}
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-8 shadow-xl text-gray-900">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="text-3xl mr-3">📋</span>
                  Format d'une masterclass
                </h3>
                <ul className="space-y-2">
                  {['2 heures de masterclass éducative', 'Applications concrètes', 'Session Q&A', 'Networking entrepreneurial', 'Pitch avec dotation (optionnel)'].map((item, idx) => (
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
                    THÈME OFFICIEL 2026
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    L'Anatomie financière
                  </h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Un enseignement structuré pour transformer votre relation avec l'argent
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                  {[
                    { text: 'Comprendre les mécanismes fondamentaux de l\'argent', icon: '💡' },
                    { text: 'Identifier les erreurs financières courantes', icon: '🔍' },
                    { text: 'Poser des bases solides pour une croissance durable', icon: '🏗️' },
                    { text: 'Développer une vision financière responsable', icon: '🎯' }
                  ].map((item, idx) => (
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
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Ce que Cash360 apporte</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: '📚', title: 'Contenu pédagogique structurant' },
                  { icon: '🎯', title: 'Approche sérieuse et responsable' },
                  { icon: '🏆', title: 'Image crédible et institutionnelle' },
                  { icon: '🔮', title: 'Vision long terme' },
                  { icon: '✨', title: 'Intervention professionnelle' }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <p className="text-gray-800 font-medium">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Processus */}
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Processus d'organisation</h2>
              <div className="space-y-8">
                {[
                  { 
                    num: '1️⃣', 
                    title: 'Invitation officielle', 
                    desc: 'Envoyer une lettre d\'invitation à myriamkonan@cash360.finance',
                    hasDownload: true
                  },
                  { num: '2️⃣', title: 'Réunion de cadrage', desc: 'Validation du format, billetterie, conditions financières' },
                  { num: '3️⃣', title: 'Validation contractuelle', desc: 'Signature d\'un contrat de collaboration' }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start p-6 bg-gray-50 rounded-2xl">
                    <div className="text-4xl mr-6">{step.num}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-700 mb-2">{step.desc}</p>
                      {step.hasDownload && (
                        <a
                          href="/pdf/Lettre_Invitation_Officielle_Cash360.pdf"
                          download="Lettre_Invitation_Officielle_Cash360.pdf"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-md mt-2"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Télécharger la lettre d'invitation officielle
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
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Merci pour votre demande</h2>
                <p className="text-lg text-gray-700 mb-6">
                  L'équipe Cash360 étudiera votre dossier et vous contactera si les conditions sont réunies pour envisager une collaboration.
                </p>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    📩 N'oubliez pas d'adresser la lettre d'invitation officielle par e-mail à :<br />
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
                    Télécharger la lettre d'invitation officielle
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
                      Étape {currentStep + 1} sur {formSteps.length}
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
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la structure organisatrice *</label>
                          <input type="text" name="structureName" value={formData.structureName} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Forme juridique *</label>
                          <select name="legalForm" value={formData.legalForm} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="">Sélectionner...</option>
                            <option value="Association">Association</option>
                            <option value="Entreprise">Entreprise</option>
                            <option value="Église">Église</option>
                            <option value="Institution">Institution</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro d'immatriculation *</label>
                          <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse complète *</label>
                          <textarea name="structureAddress" value={formData.structureAddress} onChange={handleInputChange} required rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Site web / Réseaux sociaux</label>
                          <input type="text" name="structureWebsite" value={formData.structureWebsite} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Responsable */}
                    {currentStep === 1 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom et prénom *</label>
                          <input type="text" name="responsibleName" value={formData.responsibleName} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Fonction *</label>
                          <input type="text" name="responsibleFunction" value={formData.responsibleFunction} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email professionnel *</label>
                          <input type="email" name="responsibleEmail" value={formData.responsibleEmail} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone *</label>
                          <input type="tel" name="responsiblePhone" value={formData.responsiblePhone} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                      </div>
                    )}

                    {/* Step 3: Événement */}
                    {currentStep === 2 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ville *</label>
                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Pays *</label>
                            <input type="text" name="country" value={formData.country} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Date(s) souhaitée(s) *</label>
                          <input type="text" name="proposedDate" value={formData.proposedDate} onChange={handleInputChange} required placeholder="Ex: 15 mars 2026" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Type d'événement *</label>
                          <select name="eventType" value={formData.eventType} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="Masterclass">Masterclass</option>
                            <option value="Conférence">Conférence</option>
                            <option value="Séminaire">Séminaire</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Public */}
                    {currentStep === 3 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Public principal *</label>
                          <select name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="">Sélectionner...</option>
                            <option value="Étudiants">Étudiants</option>
                            <option value="Particuliers">Particuliers</option>
                            <option value="Entrepreneurs / porteurs de projets">Entrepreneurs / porteurs de projets</option>
                            <option value="Leaders / responsables">Leaders / responsables</option>
                            <option value="Public mixte">Public mixte</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de participants estimé *</label>
                          <input type="number" name="estimatedParticipants" value={formData.estimatedParticipants} onChange={handleInputChange} required min="1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                        </div>
                      </div>
                    )}

                    {/* Step 5: Format */}
                    {currentStep === 4 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Format standard Cash360 ? *</label>
                          <select name="standardFormat" value={formData.standardFormat} onChange={handleInputChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="Oui">Oui</option>
                            <option value="Non">Non (préciser)</option>
                          </select>
                        </div>
                        {formData.standardFormat === 'Non' && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Format personnalisé</label>
                            <textarea name="customFormat" value={formData.customFormat} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all" />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Pitch entrepreneurial avec dotation ?</label>
                          <select name="pitchEntrepreneurial" value={formData.pitchEntrepreneurial} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all">
                            <option value="Non">Non</option>
                            <option value="Oui">Oui</option>
                          </select>
                        </div>
                        {formData.pitchEntrepreneurial === 'Oui' && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Détails du pitch</label>
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
                            📩 Après soumission, merci d'adresser la lettre d'invitation officielle à :<br />
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
                            Télécharger la lettre d'invitation officielle
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
                    ← Précédent
                  </button>
                  
                  {currentStep < formSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Suivant →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>
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
