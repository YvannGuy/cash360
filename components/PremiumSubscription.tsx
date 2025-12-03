'use client'

import { useLanguage } from '@/lib/LanguageContext'
import Link from 'next/link'

export default function PremiumSubscription() {
  const { t } = useLanguage()
  const copy = t.premiumSubscription || {}

  if (!copy.title) return null

  return (
    <section id="premium-subscription" className="py-20 bg-gradient-to-br from-[#012F4E] via-[#023d68] to-[#012F4E] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {copy.title}{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              {copy.titleHighlight}
            </span>
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {copy.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {(copy.features || []).map((feature: any, index: number) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-center">
                {feature.title}
              </h3>
              <p className="text-white/80 text-center leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-[#012F4E] font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-yellow-500/25"
          >
            {copy.ctaButton || 'Découvrir l\'abonnement premium'}
          </Link>
        </div>
      </div>
    </section>
  )
}

