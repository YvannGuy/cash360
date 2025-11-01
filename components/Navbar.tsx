'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientBrowser } from '@/lib/supabase'
import AuthModal from './AuthModal'
import LanguageSwitch from './LanguageSwitch'
import { useLanguage } from '@/lib/LanguageContext'

export default function Navbar() {
  const { t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)
  const [bannerHeight, setBannerHeight] = useState(36)

  const supabase = createClientBrowser()

  // Fonction pour extraire les initiales de l'email
  const getInitials = (email: string | undefined): string => {
    if (!email) return ''
    const localPart = email.split('@')[0] // Partie avant @
    const parts = localPart.split('.') // Séparer par les points
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return localPart.substring(0, 2).toUpperCase()
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const updateBannerHeight = () => {
      if (bannerRef.current) {
        setBannerHeight(bannerRef.current.offsetHeight)
      }
    }
    updateBannerHeight()
    window.addEventListener('resize', updateBannerHeight)
    return () => window.removeEventListener('resize', updateBannerHeight)
  }, [])

  useEffect(() => {
    // Vérifier l'état d'authentification
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Bandeau d'information */}
      <div ref={bannerRef} className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 py-2 px-4 text-center text-sm font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span>Les rendez-vous pour l'année 2025 sont terminés.</span>
          <span className="hidden sm:inline">Nous annoncerons si d'éventuels créneaux s'ouvrent.</span>
          <span>N'hésitez pas à nous contacter sur</span>
          <a 
            href="https://wa.me/33756848734" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline font-semibold hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            WhatsApp +33 7 56 84 87 34
          </a>
        </div>
      </div>

      <nav style={{ top: `${bannerHeight}px` }} className="fixed left-0 right-0 z-[9998] bg-white/95 backdrop-blur-md shadow-lg border-t-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <img
                src="/images/logo/logofinal.png"
                alt="Cash360"
                className="h-12 sm:h-16 lg:h-48 w-auto"
              />
            </div>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button
                onClick={() => scrollToSection('accueil')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors duration-200"
              >
                {t.nav.home}
              </button>
              <button
                onClick={() => scrollToSection('apropos')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors duration-200"
              >
                {t.nav.about}
              </button>
              <button
                onClick={() => scrollToSection('section-analyse')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors duration-200"
              >
                {t.nav.analysis}
              </button>
            </div>
          </div>

          {/* Auth & CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <LanguageSwitch />
            
            {/* Auth Button */}
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="relative user-menu-container z-[9999]">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {getInitials(user.email)}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]">
                      <button
                        onClick={() => {
                          window.location.href = '/dashboard'
                          setShowUserMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t.nav.myAccount}
                      </button>
                      <button
                        onClick={() => {
                          handleSignOut()
                          setShowUserMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        {t.nav.signOut}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                {t.nav.login}
              </button>
            )}

            {/* CTA Button */}
            <a
              href="#cta"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t.nav.nosFormations}
            </a>
          </div>

          {/* Mobile menu button & Language Switch */}
          <div className="md:hidden flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSwitch />
            
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-yellow-600 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <span className="block h-6 w-6">✕</span>
              ) : (
                <span className="block h-6 w-6">☰</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md rounded-lg mt-2 shadow-lg">
              <button
                onClick={() => scrollToSection('accueil')}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-colors duration-200"
              >
                Accueil
              </button>
              <button
                onClick={() => scrollToSection('apropos')}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-colors duration-200"
              >
                À propos
              </button>
              <button
                onClick={() => {
                  scrollToSection('section-analyse')
                  setIsMenuOpen(false)
                }}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-colors duration-200"
              >
                Analyse personnalisée
              </button>
              
              {/* Mobile Auth */}
              {user ? (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Connecté en tant que {getInitials(user.email)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        window.location.href = '/dashboard';
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      Mon compte
                    </button>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    window.location.href = '/login';
                    setIsMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  Connexion
                </button>
              )}

              <a
                href="#cta"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full mt-4 px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-xl text-center hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300"
              >
                {t.nav.nosFormations}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </nav>
    </>
  )
}