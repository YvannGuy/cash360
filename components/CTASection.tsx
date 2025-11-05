'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import Image from 'next/image'
import Link from 'next/link'

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

  const images = [
    '/images/logo/capsule1.jpg',
    '/images/logo/capsule2.jpg',
    '/images/logo/capsule3.jpg',
    '/images/logo/capsule4.jpg',
    '/images/logo/capsule5.jpg',
    '/images/pack.png'
  ]
  
  const capsules = (t.ctaSection?.capsules || []).map((capsule: any, index: number) => ({
    ...capsule,
    image: images[index] || '/images/logo/capsule1.jpg'
  }))

  return (
    <section id="cta" className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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

          {/* Cards Horizontal Scroll */}
          <div className={`transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="overflow-x-auto pb-6 scrollbar-hide">
              <div className="flex gap-6 min-w-max">
                {capsules.map((capsule) => (
                  <div
                    key={capsule.id}
                    className="flex-shrink-0 w-80 bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={capsule.image}
                        alt={capsule.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {capsule.title}
                      </h3>
                      
                      <ul className="space-y-2 mb-6 flex-grow">
                        {capsule.content.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="text-yellow-500 mr-2 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Button */}
                      <Link
                        href="/login"
                        className="block w-full text-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg mt-auto"
                      >
                        {t.ctaSection?.ctaButton || t.nav.nosFormations}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Final Message */}
          <div className={`mt-12 text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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