'use client'

export default function Hero() {
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
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Content */}
          <div>
            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Reprenez le contrôle de vos{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                finances
              </span>
              <br />
              avec méthode et sérénité
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Analyse personnalisée + accompagnement spirituel et pratique pour retrouver 
              <span className="text-yellow-400 font-semibold"> équilibre et liberté financière</span>
            </p>

            {/* Video */}
            <div className="mb-12">
              <div className="relative w-full max-w-4xl mx-auto">
                <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    src="https://player.vimeo.com/video/1117610452?autoplay=1&loop=1&muted=0&title=0&byline=0&portrait=0&controls=1"
                    title="Cash360 - Présentation"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => {
                  const modal = document.getElementById('calendly-modal');
                  if (modal) modal.style.display = 'block';
                }}
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold text-lg rounded-2xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-yellow-500/25"
              >
                Réserver un appel
                <span className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
              
              <button
                onClick={() => scrollToSection('apropos')}
                className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white font-semibold text-lg rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                En savoir plus
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent"></div>
    </section>
  )
}