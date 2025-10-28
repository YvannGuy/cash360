'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'

export default function SectionAnalyse() {
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
      className={`py-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Section - Text */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {t.sectionAnalyse.title}
              </h2>
              <p className="text-base text-white/90 leading-relaxed">
                {t.sectionAnalyse.description}
              </p>
              
              {/* CTA Button */}
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-3 text-[#0B1B2B] font-semibold text-base hover:brightness-95 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {t.sectionAnalyse.button}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right Section - Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <Image
                  src="/images/logo/money1.png"
                  alt={t.sectionAnalyse.imageAlt}
                  width={500}
                  height={400}
                  className="object-contain rounded-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
