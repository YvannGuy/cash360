'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase'
import Image from 'next/image'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [supabase, setSupabase] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSupabase(createClientBrowser())
    setMounted(true)
    
    // Vérifier s'il y a une erreur dans l'URL
    const errorParam = searchParams?.get('error')
    if (errorParam === 'invalid-link') {
      setError('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (!supabase) {
      setError('Initialisation en cours...')
      setLoading(false)
      return
    }

    try {
      // Vérifier d'abord si l'utilisateur a une session active
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Si pas de session, vérifier s'il y a un token dans l'URL
      if (!session) {
        const token = searchParams?.get('token')
        const type = searchParams?.get('type')

        if (token && type === 'recovery') {
          // Vérifier le token avec verifyOtp pour établir une session
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          })

          if (verifyError) {
            throw new Error('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.')
          }
        } else {
          // Pas de session et pas de token valide
          throw new Error('Session expirée. Veuillez cliquer à nouveau sur le lien de réinitialisation dans votre email.')
        }
      }

      // Mettre à jour le mot de passe
      // La session est maintenant établie (soit via code échangé dans le callback, soit via token vérifié)
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        // Vérifier si l'erreur indique qu'il n'y a pas de session
        if (updateError.message.includes('session') || updateError.message.includes('JWT')) {
          throw new Error('Session expirée. Veuillez cliquer à nouveau sur le lien de réinitialisation dans votre email.')
        }
        throw updateError
      }

      setMessage('Mot de passe modifié avec succès ! Redirection...')
      
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.push('/login?message=password-reset-success')
      }, 2000)

    } catch (err: any) {
      console.error('Erreur lors de la réinitialisation:', err)
      setError(err.message || 'Erreur lors de la réinitialisation du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 sm:p-10 border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <Image
                src="/images/logofinal.png"
                alt="Cash360 Logo"
                width={120}
                height={120}
                className="mx-auto"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Réinitialiser le mot de passe</h1>
            <p className="text-gray-300 text-sm">
              Entrez votre nouveau mot de passe
            </p>
          </div>

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-200 text-sm">{message}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                placeholder="Minimum 6 caractères"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                placeholder="Confirmez votre mot de passe"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Modification en cours...' : 'Modifier le mot de passe'}
            </button>
          </form>

          {/* Lien retour */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
