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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        if (error) throw error
        
        // Envoyer l'email de bienvenue immédiatement après l'inscription
        if (data?.user) {
          try {
            // Appeler l'API welcome-email avec l'email
            await fetch('/api/welcome-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: email
              })
            })
            console.log('[AUTH-MODAL] ✅ Email de bienvenue envoyé à:', email)
          } catch (emailError) {
            console.error('[AUTH-MODAL] ❌ Erreur envoi email de bienvenue:', emailError)
            // Ne pas bloquer l'inscription si l'email échoue
          }
        }
        
        setMessage('📧 IMPORTANT : Un email de confirmation vous a été envoyé ! Vérifiez votre boîte de réception ET vos spams. Cliquez sur le lien dans l\'email pour activer votre compte.')
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
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 shadow-lg animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-900 text-base mb-1">⚠️ Vérification email requise</h3>
                    <p className="text-yellow-800 text-sm leading-relaxed">{message}</p>
                    <div className="mt-3 pt-3 border-t border-yellow-300">
                      <p className="text-xs font-semibold text-yellow-900 mb-1">💡 Où chercher ?</p>
                      <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Boîte de réception principale</li>
                        <li>Dossier Spam / Courrier indésirable</li>
                        <li>L'email peut prendre 2-3 minutes à arriver</li>
                      </ul>
                    </div>
                  </div>
                </div>
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
                      redirectTo: `${window.location.origin}/auth/callback?type=recovery`
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
