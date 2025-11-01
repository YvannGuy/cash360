'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Initialiser Supabase côté client uniquement
    setSupabase(createClientBrowser())
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) return
    
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        if (error) throw error
        setMessage('Vérifiez votre email pour confirmer votre compte. Si vous ne recevez pas l\'email, vérifiez vos spams.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setMessage('Connexion réussie !')
        setTimeout(() => {
          onClose()
          // Forcer le rechargement pour que le middleware détecte la session
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto"
      style={{ zIndex: 99999 }}
      onClick={handleBackdropClick}
    >
      <div className="min-h-screen flex items-start justify-center p-2 sm:p-4 pt-8 sm:pt-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mb-4 relative" style={{ zIndex: 100000 }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-bold">
              {isSignUp ? 'Créer un compte' : 'Se connecter'}
            </h2>
            <button
              onClick={onClose}
              className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <span className="text-white text-sm sm:text-lg">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-3 sm:mt-6 text-center">
            <p className="text-gray-600 text-xs sm:text-base">
              {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setMessage('')
                }}
                className="ml-1 sm:ml-2 text-yellow-600 hover:text-yellow-700 font-semibold transition-colors duration-200"
              >
                {isSignUp ? 'Se connecter' : 'Créer un compte'}
              </button>
            </p>
          </div>

          {/* Mot de passe oublié */}
          {!isSignUp && (
            <div className="mt-2 sm:mt-4 text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError('Veuillez entrer votre email')
                    return
                  }
                  setLoading(true)
                  setError('')
                  try {
                    console.log('Envoi du lien de réinitialisation pour:', email)
                    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
                    })
                    console.log('Réponse resetPasswordForEmail:', { data, error })
                    if (error) {
                      console.error('Erreur resetPasswordForEmail:', error)
                      throw error
                    }
                    setMessage('Lien de réinitialisation envoyé par email ! Vérifiez votre boîte de réception.')
                  } catch (error: any) {
                    console.error('Erreur complète:', error)
                    setError(`Erreur: ${error.message}`)
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 disabled:opacity-50"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* Lien vers l'espace admin */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Accès administrateur</p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.open('/admin/login', '_blank')
                }}
                className="text-xs text-red-600 hover:text-red-500 font-medium transition-colors duration-200"
              >
                Espace administrateur →
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
