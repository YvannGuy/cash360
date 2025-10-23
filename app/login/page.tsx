'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')

  const supabase = createClientBrowser()
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [supabase.auth, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        })
        if (error) throw error
        setMessage('Vérifiez votre email pour confirmer votre compte')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Veuillez entrer votre email')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      })
      if (error) throw error
      setMessage('Lien de réinitialisation envoyé par email')
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 ml-2 sm:ml-4 lg:ml-8">
              <button
                onClick={() => window.location.href = '/'}
                className="cursor-pointer"
              >
                <img
                  src="/images/logo/logofinal.png"
                  alt="Cash360"
                  className="h-12 sm:h-16 w-auto hover:opacity-80 transition-opacity duration-200"
                />
              </button>
            </div>

            {/* Bouton connexion */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => window.location.href = '/admin/login'}
                className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium px-2 py-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                <span className="hidden sm:inline">Espace Admin</span>
                <span className="sm:hidden">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-md mx-auto">
          {/* Formulaire */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {isSignUp ? 'Rejoignez la communauté Cash360' : 'Accédez à votre espace personnel'}
              </p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                placeholder="votre@email.com"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>

            {/* Confirmation mot de passe (inscription) */}
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

            {/* Messages d'erreur et de succès */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
            </button>
          </form>

          {/* Toggle inscription/connexion */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
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
            <div className="mt-3 sm:mt-4 text-center">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-xs sm:text-sm text-red-600 hover:text-red-500 font-medium transition-colors duration-200"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* Retour à l'accueil */}
          <div className="mt-4 sm:mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              ← Retour à l'accueil
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}