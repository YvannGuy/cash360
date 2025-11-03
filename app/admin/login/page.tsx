'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientBrowser } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setSupabase(createClientBrowser())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!supabase) {
      setError('Initialisation en cours...')
      setLoading(false)
      return
    }

    try {
      // Se connecter avec Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        setError('Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      // Vérifier si l'utilisateur a le rôle admin ou commercial
      const userRole = data.user?.user_metadata?.role
      
      if (userRole === 'admin' || userRole === 'commercial') {
        // Stocker la session admin
        localStorage.setItem('admin_session', 'true')
        localStorage.setItem('admin_email', email)
        localStorage.setItem('admin_role', userRole)
        
        // Rediriger vers le dashboard approprié
        if (userRole === 'commercial') {
          router.push('/admin/commercial-calls')
        } else {
          router.push('/admin/dashboard')
        }
      } else {
        // Déconnecter l'utilisateur si pas admin
        await supabase.auth.signOut()
        setError('Accès refusé : vous devez être administrateur ou commercial')
      }
    } catch (err: any) {
      setError('Erreur de connexion : ' + (err.message || 'Erreur inconnue'))
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 sm:p-6">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-white rounded-lg mx-auto mb-3 sm:mb-4 inline-block">
            <Image
              src="/images/logo/logofinal.png"
              alt="Cash360 Admin"
              width={200}
              height={200}
              className="h-32 sm:h-48 w-auto"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Espace Administrateur
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Accès réservé aux administrateurs Cash360
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                Email Administrateur
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 sm:py-3 px-4 text-sm sm:text-base bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Lien retour */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
            >
              ← Retour au site principal
            </button>
          </div>
        </div>

        {/* Informations de sécurité */}
        <div className="mt-6 bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-amber-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-amber-200 font-medium text-sm">Accès sécurisé</h3>
              <p className="text-amber-100 text-xs mt-1">
                Cette zone est réservée aux administrateurs autorisés. Toute tentative d'accès non autorisée sera enregistrée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
