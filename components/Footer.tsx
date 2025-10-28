'use client'

import { useLanguage } from '@/lib/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  
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
                {t.footer.description}
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-5 h-5 text-yellow-400">📧</span>
                  <a 
                    href={`mailto:${t.footer.contact}`}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    {t.footer.contact}
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
                    {t.footer.bookCall}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-6">{t.footer.navigation}</h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => scrollToSection('accueil')}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    {t.footer.home}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    {t.footer.whyCash360}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('steps')}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    {t.footer.howItWorks}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('apropos')}
                    className="text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    {t.footer.aboutUs}
                  </button>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-xl font-semibold mb-6">{t.footer.services}</h3>
              <ul className="space-y-3">
                {t.footer.servicesList.map((service, index) => (
                  <li key={index} className="text-gray-300">{service}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>


        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} Cash360. {t.footer.rights}
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLegalModal', { detail: { type: 'privacy' } }));
                }}
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                {t.footer.privacy}
              </button>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLegalModal', { detail: { type: 'legal' } }));
                }}
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                {t.footer.legal}
              </button>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLegalModal', { detail: { type: 'terms' } }));
                }}
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                {t.footer.terms}
              </button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}