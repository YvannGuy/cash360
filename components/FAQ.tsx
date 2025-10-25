'use client'

import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
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
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide mb-4">
              FAQ
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Questions Fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
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
