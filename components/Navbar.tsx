'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase'
import AuthModal from './AuthModal'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

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
    <nav className="fixed top-0 left-0 right-0 z-[9998] bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/20 transition-all duration-300">
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
                Accueil
              </button>
              <button
                onClick={() => scrollToSection('apropos')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors duration-200"
              >
                À propos
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors duration-200"
              >
                Contact
              </button>
            </div>
          </div>

          {/* Auth & CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
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
                        Mon compte
                      </button>
                      <button
                        onClick={() => {
                          handleSignOut()
                          setShowUserMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Se déconnecter
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
                Connexion
              </button>
            )}

            {/* CTA Button */}
            <button
              onClick={() => {
                const modal = document.getElementById('calendly-modal');
                if (modal) modal.style.display = 'block';
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Réserver un appel
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
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
                onClick={() => scrollToSection('contact')}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-colors duration-200"
              >
                Contact
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

              <button
                onClick={() => {
                  const modal = document.getElementById('calendly-modal');
                  if (modal) modal.style.display = 'block';
                  setIsMenuOpen(false);
                }}
                className="block w-full mt-4 px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-xl text-center hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300"
              >
                Réserver un appel
              </button>
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
  )
}