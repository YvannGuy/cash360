'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
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
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<
    Array<{ id: string; city: string; country: string; label: string }>
  >([])
  const [cityLoading, setCityLoading] = useState(false)
  const [profession, setProfession] = useState('')
  const [signUpStep, setSignUpStep] = useState(1)

  const router = useRouter()

  const signUpStepsConfig = [
    { id: 1, label: t.login?.stepIdentity || 'Identité' },
    { id: 2, label: t.login?.stepProfile || 'Profil' },
    { id: 3, label: t.login?.stepSecurity || 'Sécurité' }
  ]
  const totalSignUpSteps = signUpStepsConfig.length

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          firstName.trim().length > 0 &&
          lastName.trim().length > 0 &&
          email.trim().length > 0
        )
      case 2:
        return city.trim().length > 1 && profession.trim().length > 0
      case 3:
        return password.length >= 8 && confirmPassword === password
      default:
        return true
    }
  }

  const handleNextStep = () => {
    if (signUpStep < totalSignUpSteps && isStepValid(signUpStep)) {
      setSignUpStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (signUpStep > 1) {
      setSignUpStep((prev) => prev - 1)
    }
  }

  const renderSignUpStepContent = () => {
    switch (signUpStep) {
      case 1:
        return (
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
              <label htmlFor="signup-email" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                {t.login.email}
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.login.emailPlaceholder}
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
          </>
        )
      case 2:
        return (
          <>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-white mb-1 sm:mb-2">
                Ville *
              </label>
              <div className="relative">
                <input
                  id="city"
                  type="text"
                  required
                  value={cityQuery}
                  onChange={(e) => {
                    const value = e.target.value
                    setCityQuery(value)
                    setCity(value)
                    if (!value) {
                      setCountry('')
                      setCitySuggestions([])
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paris, France"
                  autoComplete="off"
                />
                {cityLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/80 animate-pulse">
                    ...
                  </span>
                )}
                {citySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full max-h-56 overflow-auto bg-white/95 text-gray-900 rounded-xl shadow-2xl border border-gray-100 mt-2">
                    {citySuggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion.id}
                        className="w-full text-left px-4 py-2 hover:bg-yellow-50 transition-colors flex flex-col"
                        onClick={() => {
                          setCity(suggestion.city)
                          setCountry(suggestion.country)
                          setCityQuery(suggestion.label)
                          setCitySuggestions([])
                        }}
                      >
                        <span className="font-semibold">{suggestion.city}</span>
                        {suggestion.country && (
                          <span className="text-xs text-gray-500">{suggestion.country}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {country && (
                  <p className="text-xs text-gray-300 mt-2">
                    Pays détecté : <span className="font-semibold">{country}</span>
                  </p>
                )}
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
        )
      case 3:
        return (
          <>
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
              <p className="text-xs text-gray-300 mt-2">Minimum 8 caractères</p>
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
          </>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    if (params.get('signup') === '1') {
      setIsSignUp(true)
    }
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

  const signUpProgress =
    totalSignUpSteps > 1 ? ((signUpStep - 1) / (totalSignUpSteps - 1)) * 100 : 100

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (isSignUp && signUpStep < totalSignUpSteps && event.key === 'Enter') {
      event.preventDefault()
    }
  }

  useEffect(() => {
    if (!isSignUp) return
    if (!cityQuery || cityQuery.trim().length < 2) {
      setCitySuggestions([])
      setCityLoading(false)
      return
    }

    const controller = new AbortController()
    const debounce = setTimeout(async () => {
      try {
        setCityLoading(true)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
            cityQuery.trim()
          )}`,
          {
            headers: { Accept: 'application/json' },
            signal: controller.signal
          }
        )
        if (!response.ok) throw new Error('Erreur lors de la recherche de la ville')
        const data = await response.json()
        const suggestions =
          (data || []).map((item: any) => {
            const address = item.address || {}
            const cityName =
              address.city ||
              address.town ||
              address.village ||
              address.county ||
              item.display_name?.split(',')[0]?.trim() ||
              ''
            const countryName = address.country || ''
            return {
              id: item.place_id?.toString() || `${item.lat}-${item.lon}`,
              city: cityName,
              country: countryName,
              label: countryName ? `${cityName}, ${countryName}` : cityName
            }
          }) ?? []
        setCitySuggestions(suggestions)
      } catch (fetchError) {
        if ((fetchError as any)?.name !== 'AbortError') {
          setCitySuggestions([])
        }
      } finally {
        setCityLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(debounce)
      controller.abort()
    }
  }, [cityQuery, isSignUp])

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
        const { data, error } = await supabase.auth.signUp({
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
        
        // Envoyer l'email de bienvenue immédiatement après l'inscription
        if (data?.user) {
          try {
            // Appeler l'API welcome-email avec l'email et les infos utilisateur
            await fetch('/api/welcome-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: email,
                firstName: firstName,
                lastName: lastName
              })
            })
            console.log('[LOGIN] ✅ Email de bienvenue envoyé à:', email)
          } catch (emailError) {
            console.error('[LOGIN] ❌ Erreur envoi email de bienvenue:', emailError)
            // Ne pas bloquer l'inscription si l'email échoue
          }
        }
        
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
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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
          <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4 sm:space-y-6">
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

            {isSignUp ? (
              <>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-4">
                    {t.login.progressLabel || 'Étapes d’inscription'}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    {signUpStepsConfig.map((step) => {
                      const isComplete = signUpStep > step.id
                      const isActive = signUpStep === step.id
                      return (
                        <div key={step.id} className="flex-1 flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                              isComplete
                                ? 'bg-green-500 text-white'
                                : isActive
                                ? 'bg-white text-slate-900'
                                : 'border border-white/30 text-white/70'
                            }`}
                          >
                            {isComplete ? '✓' : step.id}
                          </div>
                          <p className={`text-xs mt-2 ${isActive ? 'text-white' : 'text-white/60'}`}>
                            {step.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 h-1 bg-white/20 rounded-full">
                    <div
                      className="h-1 bg-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${signUpProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">{renderSignUpStepContent()}</div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  {signUpStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
                    >
                      {t.login.backButton || 'Retour'}
                    </button>
                  ) : (
                    <div />
                  )}

                  {signUpStep < totalSignUpSteps ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStepValid(signUpStep)}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.login.nextButton || 'Suivant'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !isStepValid(signUpStep)}
                      className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                          {t.login.loading}
                        </div>
                      ) : (
                        t.login.createMyAccount
                      )}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
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
                    t.login.signIn
                  )}
                </button>
              </>
            )}
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
                  setSignUpStep(1)
                  setCityQuery('')
                  setCity('')
                  setCountry('')
                  setPassword('')
                  setConfirmPassword('')
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