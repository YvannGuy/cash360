'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useLanguage } from '@/lib/LanguageContext'

export default function MasterclassPage() {
  const { t } = useLanguage()
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name === 'transport' || name === 'accommodation' || name === 'logistics') {
        setFormData(prev => ({ ...prev, [name]: checked }))
      } else if (name === 'frameworkAcknowledged' || name === 'contractAccepted' || name === 'writtenAgreementAccepted') {
        setFormData(prev => ({ ...prev, [name]: checked }))
      } else if (name === 'communicationChannels') {
        // Pour les cases à cocher de communication
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitFormData = new FormData()
      
      // Ajouter tous les champs du formulaire
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'communicationChannels') {
          submitFormData.append(key, JSON.stringify(value))
        } else if (value instanceof File) {
          submitFormData.append(key, value)
        } else if (typeof value === 'boolean') {
          submitFormData.append(key, value.toString())
        } else {
          submitFormData.append(key, value || '')
        }
      })

      const response = await fetch('/api/masterclass/request', {
        method: 'POST',
        body: submitFormData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi')
      }

      setFormSubmitted(true)
    } catch (error) {
      console.error('Erreur soumission:', error)
      alert(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToForm = () => {
    const formElement = document.getElementById('masterclass-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
      setShowForm(true)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Organiser une Masterclass Cash360
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8">
              Éduquer. Structurer. Impacter durablement.
            </p>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center px-8 py-3.5 bg-[#D4AF37] text-[#0B1B2B] text-base font-medium rounded-lg hover:brightness-95 transition-all duration-200"
            >
              Demander une masterclass
            </button>
          </div>
        </section>

        {/* Brochure Download Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-yellow-400">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    📄 Téléchargez notre brochure
                  </h2>
                  <p className="text-lg text-gray-700 mb-2">
                    Consultez notre brochure complète pour découvrir toutes les conditions d'invitation et les modalités d'organisation d'une Masterclass Cash360.
                  </p>
                  <p className="text-sm text-gray-600">
                    Tous les détails sur le format, les conditions financières et le processus d'organisation.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <a
                    href="/pdf/CASH360_Masterclass.pdf"
                    download="CASH360_Masterclass.pdf"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Télécharger la brochure
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            
            {/* Pourquoi organiser une masterclass */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Pourquoi organiser une masterclass Cash360 ?
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Organiser une masterclass Cash360, c'est proposer à votre public un événement à fort impact éducatif, centré sur la stabilité financière, la responsabilité et la structuration des projets personnels et entrepreneuriaux.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Cash360 intervient en amont du financement, là où beaucoup d'initiatives échouent faute de préparation financière et de discipline.
              </p>
              <p className="text-lg font-semibold text-gray-900">
                Former avant de financer. Structurer avant de croître.
              </p>
            </div>

            {/* À qui s'adressent les masterclass */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                À qui s'adressent les masterclass Cash360 ?
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Les masterclass Cash360 s'adressent à :
              </p>
              <ul className="space-y-3 mb-4">
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">étudiants,</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">particuliers souhaitant mieux gérer leurs finances,</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">entrepreneurs et porteurs de projets,</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">leaders et responsables communautaires.</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700">
                👉 Une attention particulière est portée aux entrepreneurs et leaders, sans exclure les autres profils.
              </p>
            </div>

            {/* Le thème officiel 2026 */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Le thème officiel 2026
              </h2>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                L'Anatomie financière
              </h3>
              <p className="text-lg text-gray-900 mb-4">
                Un enseignement structuré pour :
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-gray-900 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-900">comprendre les mécanismes fondamentaux de l'argent,</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-900 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-900">identifier les erreurs financières courantes,</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-900 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-900">poser des bases solides pour une croissance durable,</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-900 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-900">développer une vision financière responsable.</span>
                </li>
              </ul>
            </div>

            {/* Format d'une masterclass */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Format d'une masterclass Cash360
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">2 heures de masterclass éducative</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Applications concrètes (vie personnelle & entrepreneuriat)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Session de questions / réponses</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Temps de networking entrepreneurial encadré</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">(Optionnel) : pitch entrepreneurial avec dotation financière</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 mt-4">
                👉 Un format clair, structuré et reproductible.
              </p>
            </div>

            {/* Ce que Cash360 apporte */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ce que Cash360 apporte
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-600 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-700">Un contenu pédagogique structurant</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-700">Une approche sérieuse et responsable</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-700">Une image crédible et institutionnelle</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-700">Une vision long terme</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 text-xl mr-3">✓</span>
                  <span className="text-lg text-gray-700">Une intervention professionnelle et encadrée</span>
                </li>
              </ul>
            </div>

            {/* Ce que l'organisateur prend en charge */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ce que l'organisateur prend en charge
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Location de la salle</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Logistique et accueil du public</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Communication locale</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Gestion de la billetterie</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Transport et hébergement (hôtel 3★ minimum)</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 mt-4">
                👉 Les fonds liés au transport sont versés sur le compte Cash360, qui se charge de l'achat des billets.
              </p>
            </div>

            {/* Conditions financières */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Conditions financières
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Cachet fixe (à définir conjointement)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Pourcentage sur les recettes de la billetterie</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Modalités validées avant toute communication publique</span>
                </li>
              </ul>
            </div>

            {/* Processus d'organisation */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Processus d'organisation
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">1️⃣ Invitation officielle</h3>
                  <p className="text-lg text-gray-700 mb-2">
                    Envoyer une lettre d'invitation officielle à :
                  </p>
                  <p className="text-lg text-gray-700 mb-2">
                    📩 <a href="mailto:myriamkonan@cash360.finance" className="text-yellow-600 hover:underline">myriamkonan@cash360.finance</a>
                  </p>
                  <p className="text-lg text-gray-700 mb-2">
                    La lettre doit préciser :
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li className="text-gray-700">la structure organisatrice,</li>
                    <li className="text-gray-700">la ville et le pays,</li>
                    <li className="text-gray-700">la date proposée,</li>
                    <li className="text-gray-700">le public visé,</li>
                    <li className="text-gray-700">les conditions logistiques et financières.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">2️⃣ Réunion de cadrage</h3>
                  <p className="text-lg text-gray-700 mb-2">
                    Une réunion est organisée afin de :
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li className="text-gray-700">valider le format,</li>
                    <li className="text-gray-700">définir la billetterie,</li>
                    <li className="text-gray-700">fixer les conditions financières,</li>
                    <li className="text-gray-700">valider la stratégie de communication.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">3️⃣ Validation contractuelle</h3>
                  <p className="text-lg text-gray-700 mb-2">
                    Un contrat de collaboration est signé pour :
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li className="text-gray-700">sécuriser les engagements,</li>
                    <li className="text-gray-700">valider définitivement l'événement.</li>
                  </ul>
                  <p className="text-lg text-gray-700 mt-2">
                    👉 Aucun événement n'est confirmé sans contrat signé.
                  </p>
                </div>
              </div>
            </div>

            {/* Cadre et responsabilité */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Cadre et responsabilité
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Cash360 intervient à titre éducatif</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Aucun conseil financier personnalisé</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Aucune promesse de résultat</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 text-xl mr-3">•</span>
                  <span className="text-lg text-gray-700">Les décisions des participants relèvent de leur responsabilité</span>
                </li>
              </ul>
            </div>

            {/* Pourquoi Cash360 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                Pourquoi Cash360 ?
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-white text-xl mr-3">•</span>
                  <span className="text-lg text-white">Parce que l'éducation financière est une urgence</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white text-xl mr-3">•</span>
                  <span className="text-lg text-white">Parce que la discipline précède la croissance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white text-xl mr-3">•</span>
                  <span className="text-lg text-white">Parce que l'impact durable est plus important que le buzz</span>
                </li>
              </ul>
              <p className="text-lg text-white font-semibold mt-4">
                Cash360 prépare les entrepreneurs.<br />
                D'autres les financent.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Vous souhaitez organiser une masterclass Cash360 ?
              </h2>
              <div className="space-y-4">
                <p className="text-lg text-gray-700">
                  📩 <span className="font-semibold">Contact officiel</span>
                </p>
                <p className="text-lg text-gray-700">
                  <a href="mailto:myriamkonan@cash360.finance" className="text-yellow-600 hover:underline">
                    myriamkonan@cash360.finance
                  </a>
                </p>
                <p className="text-lg text-gray-700">
                  📍 <span className="font-semibold">Bureaux Cash360</span>
                </p>
                <p className="text-lg text-gray-700">
                  229 rue Saint-Honoré<br />
                  75001 Paris, France
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Formulaire */}
        <section id="masterclass-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                📋 Formulaire de demande d'événement
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Organiser une Masterclass Cash360
              </p>
              <p className="text-sm text-gray-600 mb-8">
                Merci de compléter ce formulaire avec attention.<br />
                Toute demande incomplète ou non conforme au cadre Cash360 ne pourra être étudiée.
              </p>

              {formSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-green-600 text-5xl mb-4">✓</div>
                  <h3 className="text-2xl font-bold text-green-900 mb-4">
                    Merci pour votre demande.
                  </h3>
                  <p className="text-lg text-green-800">
                    L'équipe Cash360 étudiera votre dossier et vous contactera si les conditions sont réunies pour envisager une collaboration.
                  </p>
                  <p className="text-sm text-green-700 mt-4">
                    📩 N'oubliez pas d'adresser la lettre d'invitation officielle par e-mail à :<br />
                    <a href="mailto:myriamkonan@cash360.finance" className="font-semibold hover:underline">
                      myriamkonan@cash360.finance
                    </a>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* 1. Informations sur la structure organisatrice */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      1️⃣ Informations sur la structure organisatrice
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom de la structure organisatrice *
                        </label>
                        <input
                          type="text"
                          name="structureName"
                          value={formData.structureName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Forme juridique *
                        </label>
                        <select
                          name="legalForm"
                          value={formData.legalForm}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Association">Association</option>
                          <option value="Entreprise">Entreprise</option>
                          <option value="Église">Église</option>
                          <option value="Institution">Institution</option>
                          <option value="Autre">Autre (préciser)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro d'immatriculation (SIREN / RCCM / équivalent) *
                        </label>
                        <input
                          type="text"
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse complète de la structure *
                        </label>
                        <textarea
                          name="structureAddress"
                          value={formData.structureAddress}
                          onChange={handleInputChange}
                          required
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site web / Page officielle / Réseaux sociaux
                        </label>
                        <input
                          type="text"
                          name="structureWebsite"
                          value={formData.structureWebsite}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Responsable de l'événement */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      2️⃣ Responsable de l'événement
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom et prénom *
                        </label>
                        <input
                          type="text"
                          name="responsibleName"
                          value={formData.responsibleName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fonction *
                        </label>
                        <input
                          type="text"
                          name="responsibleFunction"
                          value={formData.responsibleFunction}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse e-mail professionnelle *
                        </label>
                        <input
                          type="email"
                          name="responsibleEmail"
                          value={formData.responsibleEmail}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de téléphone *
                        </label>
                        <input
                          type="tel"
                          name="responsiblePhone"
                          value={formData.responsiblePhone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Informations générales sur l'événement */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      3️⃣ Informations générales sur l'événement
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ville *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pays *
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date(s) souhaitée(s) *
                        </label>
                        <input
                          type="text"
                          name="proposedDate"
                          value={formData.proposedDate}
                          onChange={handleInputChange}
                          required
                          placeholder="Ex: 15 mars 2026"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type d'événement *
                        </label>
                        <select
                          name="eventType"
                          value={formData.eventType}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="Masterclass">Masterclass</option>
                          <option value="Conférence">Conférence</option>
                          <option value="Séminaire">Séminaire</option>
                          <option value="Autre">Autre (préciser)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Public visé */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      4️⃣ Public visé
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Public principal *
                        </label>
                        <select
                          name="targetAudience"
                          value={formData.targetAudience}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Étudiants">Étudiants</option>
                          <option value="Particuliers">Particuliers</option>
                          <option value="Entrepreneurs / porteurs de projets">Entrepreneurs / porteurs de projets</option>
                          <option value="Leaders / responsables">Leaders / responsables</option>
                          <option value="Public mixte">Public mixte</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de participants estimé *
                        </label>
                        <input
                          type="number"
                          name="estimatedParticipants"
                          value={formData.estimatedParticipants}
                          onChange={handleInputChange}
                          required
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Format souhaité */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      5️⃣ Format souhaité
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Souhaitez-vous le format standard Cash360 ? *<br />
                          <span className="text-xs text-gray-500">(2h de masterclass + networking)</span>
                        </label>
                        <select
                          name="standardFormat"
                          value={formData.standardFormat}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="Oui">Oui</option>
                          <option value="Non">Non (préciser)</option>
                        </select>
                      </div>
                      {formData.standardFormat === 'Non' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Précisez votre format souhaité
                          </label>
                          <textarea
                            name="customFormat"
                            value={formData.customFormat}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Souhaitez-vous intégrer un pitch entrepreneurial avec dotation ?
                        </label>
                        <select
                          name="pitchEntrepreneurial"
                          value={formData.pitchEntrepreneurial}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="Non">Non</option>
                          <option value="Oui">Oui</option>
                        </select>
                      </div>
                      {formData.pitchEntrepreneurial === 'Oui' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Précisez les détails du pitch
                          </label>
                          <textarea
                            name="pitchDetails"
                            value={formData.pitchDetails}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 6. Logistique & organisation */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      6️⃣ Logistique & organisation
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          La salle est-elle déjà identifiée ? *
                        </label>
                        <select
                          name="venueIdentified"
                          value={formData.venueIdentified}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Capacité de la salle
                        </label>
                        <input
                          type="number"
                          name="venueCapacity"
                          value={formData.venueCapacity}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          L'organisateur prend-il en charge : *
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="transport"
                              checked={formData.transport}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Transport (billets d'avion)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="accommodation"
                              checked={formData.accommodation}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Hébergement (hôtel 3★ minimum)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="logistics"
                              checked={formData.logistics}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Logistique sur place (son, sécurité, accueil)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. Conditions financières */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      7️⃣ Conditions financières proposées
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cachet proposé à Cash360 *
                        </label>
                        <input
                          type="text"
                          name="proposedFee"
                          value={formData.proposedFee}
                          onChange={handleInputChange}
                          required
                          placeholder="Ex: 5000 EUR ou à définir"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Souhaitez-vous proposer un pourcentage sur la billetterie ?
                        </label>
                        <select
                          name="percentageOnTickets"
                          value={formData.percentageOnTickets}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="Non">Non</option>
                          <option value="Oui">Oui</option>
                        </select>
                      </div>
                      {formData.percentageOnTickets === 'Oui' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Précisez le pourcentage
                          </label>
                          <input
                            type="text"
                            name="percentageDetails"
                            value={formData.percentageDetails}
                            onChange={handleInputChange}
                            placeholder="Ex: 30% des recettes"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 8. Communication & visibilité */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      8️⃣ Communication & visibilité
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Canaux de communication prévus
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="communicationChannels"
                              value="Réseaux sociaux"
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Réseaux sociaux</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="communicationChannels"
                              value="Canaux locaux"
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Canaux locaux</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="communicationChannels"
                              value="Médias"
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Médias</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="communicationChannels"
                              value="Autre"
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-gray-700">Autre (préciser)</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Souhaitez-vous associer des sponsors à l'événement ?
                        </label>
                        <select
                          name="sponsors"
                          value={formData.sponsors}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="Non">Non</option>
                          <option value="Oui">Oui</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 9. Documents requis */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      9️⃣ Documents requis (obligatoire)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Merci de joindre :
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Document officiel de la structure organisatrice *
                        </label>
                        <input
                          type="file"
                          name="structureDocument"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pièce attestant de l'identité du responsable *
                        </label>
                        <input
                          type="file"
                          name="identityDocument"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Présentation de l'événement (si disponible)
                        </label>
                        <input
                          type="file"
                          name="eventPresentation"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 10. Engagement & validation */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      🔒 10️⃣ Engagement & validation
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          name="frameworkAcknowledged"
                          checked={formData.frameworkAcknowledged}
                          onChange={handleInputChange}
                          required
                          className="mt-1 mr-3"
                        />
                        <span className="text-gray-700">
                          Je confirme avoir pris connaissance du cadre officiel des masterclass Cash360. *
                        </span>
                      </label>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          name="contractAccepted"
                          checked={formData.contractAccepted}
                          onChange={handleInputChange}
                          required
                          className="mt-1 mr-3"
                        />
                        <span className="text-gray-700">
                          J'accepte que toute collaboration soit soumise à validation et signature d'un contrat. *
                        </span>
                      </label>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          name="writtenAgreementAccepted"
                          checked={formData.writtenAgreementAccepted}
                          onChange={handleInputChange}
                          required
                          className="mt-1 mr-3"
                        />
                        <span className="text-gray-700">
                          Je comprends qu'aucun événement ne sera confirmé sans accord écrit préalable. *
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Message final */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      📩 Envoi & contact
                    </h3>
                    <p className="text-sm text-gray-700">
                      Une fois le formulaire complété, merci d'adresser la lettre d'invitation officielle par e-mail à :
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      📧 <a href="mailto:myriamkonan@cash360.finance" className="text-yellow-600 hover:underline font-semibold">
                        myriamkonan@cash360.finance
                      </a>
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      📍 <span className="font-semibold">Bureaux Cash360</span><br />
                      229 rue Saint-Honoré<br />
                      75001 Paris, France
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
