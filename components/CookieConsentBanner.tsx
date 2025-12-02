'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

export default function CookieConsentBanner() {
  const { t } = useLanguage()
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Vérifier si le consentement a déjà été donné
    const consent = localStorage.getItem('cash360-cookie-consent')
    if (!consent) {
      // Attendre un peu avant d'afficher pour ne pas surcharger l'interface
      setTimeout(() => {
        setShowBanner(true)
      }, 1000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cash360-cookie-consent', 'accepted')
    localStorage.setItem('cash360-cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cash360-cookie-consent', 'declined')
    localStorage.setItem('cash360-cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
  }

  if (!mounted || !showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              {t.cookieConsent?.message || 'Nous utilisons des cookies pour améliorer votre expérience sur notre site, analyser le trafic et personnaliser le contenu. En continuant à naviguer, vous acceptez notre'}{' '}
              <a
                href="/politique-de-confidentialite"
                className="text-[#00A1C6] hover:underline font-medium"
              >
                {t.cookieConsent?.privacyLink || 'politique de confidentialité'}
              </a>
              {' '}{t.cookieConsent?.andCookies || 'et notre utilisation des cookies.'}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t.cookieConsent?.decline || 'Refuser'}
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00A1C6] rounded-lg hover:bg-[#0088a3] transition-colors"
            >
              {t.cookieConsent?.accept || 'Accepter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
