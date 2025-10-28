'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

export default function Steps() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

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

  const stepsNumbers = ["01", "02", "03"]
  const stepsIcons = ["🔹", "📤", "📄"]
  const stepsColors = ["from-blue-500 to-blue-600", "from-green-500 to-green-600", "from-purple-500 to-purple-600"]

  return (
    <section id="steps" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {t.steps.title}{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              {t.steps.titleHighlight}
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.steps.subtitle}
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.steps.stepsList.map((step, index) => (
              <div
                key={index}
                className={`transition-all duration-1000 delay-${index * 200} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 h-full">
                  {/* Step Number & Icon */}
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${stepsColors[index]} rounded-xl flex items-center justify-center mr-3 hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white font-bold text-lg">{stepsNumbers[index]}</span>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-lg">{stepsIcons[index]}</span>
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
              {t.steps.ctaTitle}
            </h3>
            <p className="text-lg mb-6 opacity-90">
              {t.steps.ctaSubtitle}
            </p>
            <button
              onClick={() => {
                const modal = document.getElementById('calendly-modal');
                if (modal) modal.style.display = 'block';
              }}
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="w-5 h-5 mr-2">📅</span>
              {t.steps.ctaButton}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}