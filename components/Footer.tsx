'use client'

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            {/* Description */}
            <div className="lg:col-span-2">
              <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-md">
                Reprenez le contrôle de vos finances avec méthode et sérénité. 
                Une approche unique alliant expertise financière et accompagnement spirituel.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-5 h-5 text-yellow-400">📧</span>
                  <a 
                    href="mailto:cash@cash360.finance"
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    cash@cash360.finance
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-5 h-5 text-yellow-400">📅</span>
                  <button
                    onClick={() => {
                      const modal = document.getElementById('calendly-modal');
                      if (modal) modal.style.display = 'block';
                    }}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    Réserver un appel
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-6">Navigation</h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => scrollToSection('accueil')}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    Accueil
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    Pourquoi Cash360
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('steps')}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    Comment ça marche
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('apropos')}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    À propos
                  </button>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-xl font-semibold mb-6">Services</h3>
              <ul className="space-y-3">
                <li className="text-gray-300">Analyse financière personnalisée</li>
                <li className="text-gray-300">Accompagnement spirituel</li>
                <li className="text-gray-300">Formation gestion d'église</li>
                <li className="text-gray-300">Coaching entrepreneurs</li>
                <li className="text-gray-300">Suivi personnalisé</li>
              </ul>
            </div>
          </div>
        </div>


        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} Cash360. Tous droits réservés.
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLegalModal', { detail: { type: 'privacy' } }));
                }}
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                Politique de confidentialité
              </button>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLegalModal', { detail: { type: 'legal' } }));
                }}
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                Mentions légales
              </button>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLegalModal', { detail: { type: 'terms' } }));
                }}
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                CGV
              </button>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="border-t border-gray-800 py-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Prêt(e) à transformer votre relation à l'argent ?
            </h3>
            <p className="text-gray-300 mb-6">
              Rejoignez les centaines de personnes qui ont déjà retrouvé l'équilibre financier
            </p>
            <button
              onClick={() => {
                const modal = document.getElementById('calendly-modal');
                if (modal) modal.style.display = 'block';
              }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="w-5 h-5 mr-2">📅</span>
              Réserver mon appel
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}