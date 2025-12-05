'use client'

import { useLanguage } from '@/lib/LanguageContext'
import Link from 'next/link'
import Image from 'next/image'

export default function DashboardTools() {
  const { t } = useLanguage()
  const copy = t.dashboardTools || {}

  if (!copy.title) return null

  const tools = copy.tools || []

  return (
    <section id="dashboard-tools" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {copy.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            {copy.subtitle}
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-full border border-yellow-200">
            <span className="text-yellow-600 font-semibold">✨</span>
            <span className="text-gray-700 font-medium">{copy.subscriptionNote}</span>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {tools.map((tool: any, index: number) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Image */}
              {tool.image && (
                <div className="mb-6 rounded-2xl overflow-hidden">
                  <Image
                    src={tool.image}
                    alt={tool.title}
                    width={600}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#012F4E] to-[#023d68] rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">{tool.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
              
              {/* Features list */}
              {tool.features && tool.features.length > 0 && (
                <ul className="space-y-2 mt-6 pt-6 border-t border-gray-100">
                  {tool.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-[#012F4E] to-[#023d68] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-yellow-400">
                {copy.ctaTitle}
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {copy.ctaSubtitle}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-[#012F4E] font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-yellow-500/25"
              >
                {copy.ctaButton}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

