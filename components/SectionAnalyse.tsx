'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SectionAnalyse() {
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

    const element = document.getElementById('section-analyse')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  return (
    <section
      id="section-analyse"
      className={`py-20 bg-gray-50 text-gray-900 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Analyse personnalisée de vos relevés bancaires
          </h2>

          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8">
            Découvrez où part votre argent et identifiez les points à améliorer grâce à une analyse claire et confidentielle de vos relevés bancaires.
            Recevez des recommandations concrètes pour reprendre le contrôle de vos finances.
          </p>

          {/* Variante spirituelle (optionnelle) */}
          {/* <p className="text-base text-white/70 mb-8 max-w-2xl mx-auto">
            Mettez de l'ordre dans vos finances et retrouvez la paix intérieure.
            Une analyse claire et bienveillante pour vous guider vers l'équilibre et la liberté financière.
          </p> */}

          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-8 py-4 text-[#0B1B2B] font-semibold text-lg hover:brightness-95 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Envoyer mes relevés
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
