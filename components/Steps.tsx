'use client'

import { useEffect, useState } from 'react'

export default function Steps() {
  const [isVisible, setIsVisible] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('steps')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const steps = [
    {
      number: "01",
      icon: "🔹",
      title: "Créer un compte",
      description: "Prenez quelques minutes pour créer votre compte et accéder à votre espace personnel Cash360.",
      details: [
        "Accès à votre espace sécurisé",
        "Suivi de vos finances et progrès",
        "Découverte de la méthode Cash360"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      number: "02",
      icon: "📤",
      title: "Envoyer vos relevés",
      description: "Transmettez vos 3 derniers relevés bancaires de manière sécurisée et confidentielle.",
      details: [
        "Upload sécurisé et chiffré",
        "Analyse de vos habitudes de dépenses",
        "Identification des points d'amélioration"
      ],
      color: "from-green-500 to-green-600"
    },
    {
      number: "03",
      icon: "📄",
      title: "Recevoir votre plan d'action",
      description: "Obtenez un rapport personnalisé avec des recommandations concrètes sous 48-72h.",
      details: [
        "Rapport détaillé et personnalisé",
        "Plan d'action étape par étape",
        "Suivi et accompagnement continu"
      ],
      color: "from-purple-500 to-purple-600"
    }
  ]

  return (
    <section id="steps" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Comment ça{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              fonctionne
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un processus simple et transparent en 3 étapes pour retrouver l'équilibre financier 
            avec l'accompagnement de Cash360.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`transition-all duration-1000 delay-${index * 200} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 h-full">
                  {/* Step Number & Icon */}
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mr-3 hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white font-bold text-lg">{step.number}</span>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-lg">{step.icon}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start">
                        <span className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5">✓</span>
                        <span className="text-gray-700 text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl p-8 text-gray-900">
            <h3 className="text-2xl font-bold mb-4">
              Prêt(e) à commencer votre transformation financière ?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Rejoignez les centaines de personnes qui ont déjà retrouvé l'équilibre
            </p>
            <button
              onClick={() => {
                const modal = document.getElementById('calendly-modal');
                if (modal) modal.style.display = 'block';
              }}
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="w-5 h-5 mr-2">📅</span>
              Réserver mon appel
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className={`mt-20 max-w-4xl mx-auto ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center mb-12">
            <span className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide mb-4">
              FAQ
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Questions Fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Qu'est-ce que Cash360 ?",
                answer: "Cash360 est une plateforme d'accompagnement financier dédiée aux particuliers et aux églises. Notre mission : vous aider à comprendre, organiser et améliorer votre gestion de l'argent pour retrouver paix et équilibre."
              },
              {
                question: "Comment fonctionne l'analyse financière ?",
                answer: "Après un premier échange, vous pouvez nous transmettre vos trois derniers relevés bancaires pour une analyse complète. Nous identifions vos points forts, vos faiblesses et vous proposons un plan d'action personnalisé."
              },
              {
                question: "L'appel de 15 minutes est-il gratuit ?",
                answer: "Oui, totalement gratuit et sans engagement. Cet appel permet de mieux comprendre votre situation et de définir ensemble les prochaines étapes pour votre équilibre financier."
              },
              {
                question: "Mes informations sont-elles confidentielles ?",
                answer: "Absolument. Toutes vos données sont traitées de manière strictement confidentielle et sécurisée. Rien n'est partagé avec des tiers sans votre accord explicite."
              },
              {
                question: "À qui s'adresse Cash360 ?",
                answer: "Cash360 s'adresse à toute personne, famille ou église souhaitant reprendre le contrôle de ses finances. Aucun niveau requis : notre méthode est simple, claire et adaptée à votre réalité."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg border-2 transition-all duration-300 ${
                  openIndex === index
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="text-lg font-bold text-gray-900 pr-4">
                    {index + 1}️ {faq.question}
                  </span>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}