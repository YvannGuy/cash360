'use client'

import { useLanguage } from '@/lib/LanguageContext'
import Link from 'next/link'

export default function Features() {
  const { t } = useLanguage()
  
  const featuresIcons = ["🔍", "⚖️", "❤️"]
  const featuresColors = ["from-blue-500 to-blue-600", "from-green-500 to-green-600", "from-purple-500 to-purple-600"]
  
  const additionalFeaturesIcons = ["🎯", "🛡️", "📈"]

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {t.features.title}{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              {t.features.titleHighlight}
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.features.subtitle}
          </p>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {t.features.mainFeatures.map((feature, index) => (
            <div key={index}>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 bg-gradient-to-r ${featuresColors[index]} rounded-2xl flex items-center justify-center mb-6 hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{featuresIcons[index]}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div>
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {t.features.additionalFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{additionalFeaturesIcons[index]}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl p-8 text-gray-900">
            <h3 className="text-2xl font-bold mb-4">
              {t.features.ctaTitle}
            </h3>
            <p className="text-lg mb-6 opacity-90">
              {t.features.ctaSubtitle}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {t.features.ctaButton}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}