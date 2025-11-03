'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'
import LanguageSwitch from '@/components/LanguageSwitch'

export default function LoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mounted, setMounted] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  
  // Champs supplémentaires pour l'inscription
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('France')
  const [city, setCity] = useState('')
  const [profession, setProfession] = useState('')

  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Initialiser Supabase côté client uniquement
    setSupabase(createClientBrowser())
  }, [])

  useEffect(() => {
    if (!supabase) return
    
    // Vérifier si l'utilisateur est déjà connecté
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) return
    
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp && password !== confirmPassword) {
      setError(t.login.errorPasswordMismatch)
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: phone,
              country: country,
              city: city,
              profession: profession,
              role: 'user'
            }
          }
        })
        if (error) throw error
        setMessage(t.login.messageVerifyEmail)
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
    if (!supabase) return
    
    if (!email) {
      setError(t.login.errorEnterEmail)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      })
      if (error) throw error
      setMessage(t.login.messageResetSent)
    } catch (error: any) {
      setError(error.message)
    }
  }

  // Afficher un loader pendant l'hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 sm:p-6 relative">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-[9999]">
        <LanguageSwitch />
      </div>

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
              alt="Cash360"
              width={200}
              height={200}
              className="h-32 sm:h-48 w-auto"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {isSignUp ? t.login.createAccount : t.login.signIn}
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            {isSignUp ? t.login.joinCommunity : t.login.accessAccount}
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

            {message && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p className="text-green-200 text-sm">{message}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                {t.login.email}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.login.emailPlaceholder}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                {t.login.password}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.login.passwordPlaceholder}
              />
            </div>

            {/* Champs supplémentaires pour l'inscription */}
            {isSignUp && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                      Prénom *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                      Nom *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                    {t.login.confirmPassword}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.login.passwordPlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                    Téléphone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+33 X XX XX XX XX"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                      Pays
                    </label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="France">France</option>
                      <option value="Belgique">Belgique</option>
                      <option value="Suisse">Suisse</option>
                      <option value="Canada">Canada</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                      Ville *
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre ville"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="profession" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                    Profession *
                  </label>
                  <input
                    id="profession"
                    type="text"
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre profession"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 sm:py-3 px-4 text-sm sm:text-base bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                  {t.login.loading}
                </div>
              ) : (
                isSignUp ? t.login.createMyAccount : t.login.signIn
              )}
            </button>
          </form>

          {/* Toggle inscription/connexion */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-300 text-xs sm:text-sm">
              {isSignUp ? t.login.alreadyAccount : t.login.noAccount}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setMessage('')
                }}
                className="ml-1 sm:ml-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors duration-200"
              >
                {isSignUp ? t.login.signIn : t.login.createAccount}
              </button>
            </p>
          </div>

          {/* Mot de passe oublié */}
          {!isSignUp && (
            <div className="mt-3 sm:mt-4 text-center">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
              >
                {t.login.forgotPassword}
              </button>
            </div>
          )}

          {/* Lien retour */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
            >
              {t.login.backToSite}
            </button>
          </div>
        </div>

        {/* Lien vers l'espace admin */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
          >
            {t.login.adminSpace}
          </button>
        </div>
      </div>
    </div>
  )
}