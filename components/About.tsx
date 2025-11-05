'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

export default function About() {
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

    const element = document.getElementById('apropos')
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
    <section id="apropos" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              {t.about?.title || 'Qu\'est-ce que'}{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                {t.about?.titleHighlight || 'Cash360'}
              </span>
              ?
            </h2>
          </div>

          {/* Introduction Card */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t.about?.intro1 || 'Cash360 est une plateforme d\'éducation et d\'analyse financière unique qui aide les particuliers, entrepreneurs et églises à reprendre le contrôle de leurs finances, avec une approche qui unit intelligence pratique et principes spirituels.'}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {t.about?.intro2 || 'Dans un monde où beaucoup vivent dans la confusion financière, entre dettes, dépenses incontrôlées et culpabilité vis-à-vis de l\'argent, Cash360 apporte une méthode claire, bienveillante et transformatrice.'}
              </p>
            </div>
          </div>

          {/* Notre mission Card */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.about?.missionTitle || 'Notre mission'}</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t.about?.missionIntro || 'Aider chaque personne à retrouver l\'équilibre, la clarté et la paix financière, grâce à un accompagnement qui allie :'}
              </p>
              <ul className="space-y-4">
                {(t.about?.missionPoints || []).map((point: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                      <span className="text-white text-lg">•</span>
                    </div>
                    <span className="text-gray-700 pt-2">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pour qui est fait Cash360 Card */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.about?.forWhoTitle || 'Pour qui est fait Cash360 ?'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(t.about?.forWhoPoints || []).map((point: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* À propos du Pasteur Myriam Konan Card */}
          <div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.about?.pastorTitle || 'À propos du Pasteur Myriam Konan'}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Photo carrée */}
                <div className="lg:col-span-1">
                  <div className="w-full h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src="/images/logo/myriam.jpeg"
                      alt="Pasteur Myriam Konan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Introduction */}
                  <div>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      {t.about?.pastorIntro || 'Forte de 10 ans d\'expérience dans le secteur bancaire et d\'une vocation spirituelle profonde, j\'ai développé une méthode unique qui combine expertise financière et accompagnement spirituel pour vous aider à retrouver l\'équilibre et la prospérité.'}
                    </p>
                  </div>

                  {/* 4 Feature Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(t.about?.achievements || []).map((achievement: any, index: number) => {
                      const icons = ['🏆', '❤️', '👥', '📚']
                      const iconColors = [
                        'from-yellow-400 to-yellow-600',
                        'from-red-500 to-red-600',
                        'from-yellow-400 to-yellow-600',
                        'from-yellow-400 to-yellow-600'
                      ]
                      return (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-lg transition-all duration-300">
                          <div className={`w-10 h-10 bg-gradient-to-r ${iconColors[index]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className="text-xl">{icons[index]}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* CTA & Social */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                    {/* CTA Button */}
                    <a
                      href="mailto:cash@cash360.finance"
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {t.about?.ctaButton || 'Rencontrer Myriam'}
                    </a>

                    {/* Social Media */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-2 lg:space-y-0 lg:space-x-4">
                      <p className="text-gray-600 font-medium">{t.about?.followMe || 'Suivez-moi sur :'}</p>
                      <div className="flex space-x-3">
                        <a
                          href="https://www.instagram.com/myriamkonanofficiel?igsh=MTNwNzZxMHFtc3Y2cw=="
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-110"
                          title="Instagram"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                        <a
                          href="https://www.tiktok.com/@ev.myriamkonan?_t=ZN-90nR9xLHIVa&_r=1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-full hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-110"
                          title="TikTok"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                        </a>
                        <a
                          href="https://youtube.com/@myriamkonan8090?si=3PWIGOwTSctZtOUC"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-110"
                          title="YouTube"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}