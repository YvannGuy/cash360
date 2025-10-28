'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

export default function CTASection() {
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

    const element = document.getElementById('cta')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const benefitsIcons = ["🛡️", "⏰", "❤️"]

  return (
    <section id="cta" className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              {t.ctaSection.title}{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                {t.ctaSection.titleHighlight}
              </span>
              ?
            </h2>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t.ctaSection.subtitle}
            </p>
          </div>

          {/* Benefits */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {t.ctaSection.benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">{benefitsIcons[index]}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-300 text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-3xl p-8 sm:p-12 text-gray-900 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  {t.ctaSection.mainTitle}
                </h3>
                

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                  <button
                    onClick={() => {
                      const modal = document.getElementById('calendly-modal');
                      if (modal) modal.style.display = 'block';
                    }}
                    className="group inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <span className="w-5 h-5 mr-2">📅</span>
                    {t.ctaSection.ctaButton}
                    <span className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Final Message */}
          <div className={`mt-12 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {t.ctaSection.quote}
            </p>
            <p className="text-sm text-gray-400 mt-4">
              {t.ctaSection.quoteAuthor}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}