'use client'

import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "Comment Cash360 peut m'aider ?",
      answer: "Cash360 vous aide à comprendre où part votre argent, à identifier vos priorités et à réorganiser vos finances. Grâce à une approche simple, humaine et spirituelle, vous retrouvez équilibre, sérénité et liberté financière."
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
      question: "Je suis en Afrique, puis-je bénéficier de l'accompagnement Cash360 ?",
      answer: "Oui, bien sûr 🌍 Où que vous soyez dans le monde, si vous avez un accès à Internet, vous pouvez bénéficier de l'accompagnement Cash360 via nos appels et outils en ligne."
    },
    {
      question: "À qui s'adresse cette formation ?",
      answer: "Cette formation s'adresse à toute personne ou organisation souhaitant améliorer la gestion de ses finances. Que vous soyez un particulier, un couple ou une église, la méthode Cash360 s'adapte à votre réalité."
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide mb-4">
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
                    ? 'border-yellow-400 bg-yellow-50'
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
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
