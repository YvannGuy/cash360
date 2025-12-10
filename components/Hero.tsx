'use client'

import { useLanguage } from '@/lib/LanguageContext'

export default function Hero() {
  const { t } = useLanguage()
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section 
      id="accueil"
      className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Content */}
          <div>
            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t.hero.title}{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
              <br />
              {t.hero.titleEnd}
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t.hero.subtitle}{' '}
              <span className="text-yellow-400 font-semibold">{t.hero.subtitleHighlight}</span>
            </p>

            {/* Video - Lazy loaded */}
            <div className="mb-8">
              <div className="relative w-full max-w-4xl mx-auto">
                <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    src="https://player.vimeo.com/video/1142374086?autoplay=0&loop=1&muted=1&title=0&byline=0&portrait=0&controls=1&preload=metadata"
                    title="Cash360 - Présentation"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Texte sous la vidéo */}
            <p className="mb-8 text-base sm:text-lg text-white/90 max-w-2xl mx-auto">
              {t.hero.videoDescription}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a
                href="/simulation"
                className="inline-flex items-center px-8 py-3.5 bg-[#D4AF37] text-[#0B1B2B] text-base font-medium rounded-lg hover:brightness-95 transition-all duration-200"
              >
                {t.hero.ctaPrimary}
              </a>
              
              <a
                href="#premium-subscription"
                className="inline-flex items-center px-8 py-3.5 border border-white/50 text-white text-base font-medium rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                {t.nav.produitALaUne || "Découvrir nos produits"}
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent"></div>
    </section>
  )
}