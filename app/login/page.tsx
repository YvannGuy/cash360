'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { createClientBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'
import LanguageSwitch from '@/components/LanguageSwitch'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

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
  const [detectedCountry, setDetectedCountry] = useState<string>('FR') // Pays détecté pour l'indicatif téléphonique
  
  // États pour les erreurs de validation
  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const router = useRouter()

  const signUpStepsConfig = [
    { id: 1, label: t.login?.stepIdentity || 'Identité' },
    { id: 2, label: t.login?.stepProfile || 'Profil' },
    { id: 3, label: t.login?.stepSecurity || 'Sécurité' }
  ]
  const totalSignUpSteps = signUpStepsConfig.length

  // Fonctions de validation
  const validateNameFormat = (name: string): boolean => {
    // Seulement des lettres, espaces, tirets et apostrophes (pas de chiffres ni caractères spéciaux)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/
    return nameRegex.test(name.trim())
  }

  const validateNameLength = (name: string): boolean => {
    // Minimum 2 caractères
    return name.trim().length >= 2
  }

  const validateName = (name: string): boolean => {
    return validateNameFormat(name) && validateNameLength(name)
  }

  const validateEmail = (email: string): boolean => {
    // Validation email stricte avec @ obligatoire
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim()) && email.includes('@')
  }

  const handleFirstNameChange = (value: string) => {
    setFirstName(value)
    if (!value.trim()) {
      setFirstNameError('')
      return
    }
    
    // Vérifier d'abord le format (lettres uniquement)
    if (!validateNameFormat(value)) {
      setFirstNameError('Le prénom ne doit contenir que des lettres')
    } else if (!validateNameLength(value)) {
      // Si format valide mais trop court
      setFirstNameError('Minimum 2 lettres')
    } else {
      setFirstNameError('')
    }
  }

  const handleLastNameChange = (value: string) => {
    setLastName(value)
    if (!value.trim()) {
      setLastNameError('')
      return
    }
    
    // Vérifier d'abord le format (lettres uniquement)
    if (!validateNameFormat(value)) {
      setLastNameError('Le nom ne doit contenir que des lettres')
    } else if (!validateNameLength(value)) {
      // Si format valide mais trop court
      setLastNameError('Minimum 2 lettres')
    } else {
      setLastNameError('')
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value.trim() && !validateEmail(value)) {
      setEmailError('Veuillez entrer une adresse email valide (ex: nom@exemple.com)')
    } else {
      setEmailError('')
    }
  }

  const validatePhone = (phoneNumber: string): boolean => {
    // Vérifier que le numéro de téléphone est valide (au moins 8 caractères avec l'indicatif)
    if (!phoneNumber || !phoneNumber.trim()) {
      return false
    }
    // Un numéro de téléphone valide doit avoir au moins 8 caractères (incluant l'indicatif)
    return phoneNumber.trim().length >= 8
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          validateName(firstName) &&
          validateName(lastName) &&
          validateEmail(email) &&
          validatePhone(phone) &&
          !firstNameError &&
          !lastNameError &&
          !emailError &&
          !phoneError
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
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                  Prénom *
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-md shadow-sm transition-colors ${
                    firstNameError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-0`}
                  placeholder="Votre prénom"
                />
                {firstNameError && (
                  <p className="mt-1 text-xs text-red-600">{firstNameError}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                  Nom *
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-md shadow-sm transition-colors ${
                    lastNameError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-0`}
                  placeholder="Votre nom"
                />
                {lastNameError && (
                  <p className="mt-1 text-xs text-red-600">{lastNameError}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-900 mb-2">
                {t.login.email} *
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-white border rounded-md shadow-sm transition-colors ${
                  emailError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-0`}
                placeholder={t.login.emailPlaceholder || "nom@exemple.com"}
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              )}
              {!emailError && email && (
                <p className="mt-1 text-xs text-gray-500">Format email valide</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                Téléphone *
              </label>
              <PhoneInput
                international
                defaultCountry={detectedCountry as any}
                value={phone}
                onChange={(value) => {
                  const phoneValue = value || ''
                  setPhone(phoneValue)
                  if (!phoneValue || phoneValue.trim().length === 0) {
                    setPhoneError('Le numéro de téléphone est obligatoire')
                  } else if (phoneValue.length < 8) {
                    setPhoneError('Numéro de téléphone invalide (minimum 8 caractères)')
                  } else {
                    setPhoneError('')
                  }
                }}
                className={`w-full ${phoneError ? 'phone-input-error' : ''}`}
                numberInputProps={{
                  id: 'phone',
                  className: `w-full px-3 py-2 text-sm bg-white border rounded-md shadow-sm transition-colors ${
                    phoneError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-0`
                }}
                countrySelectProps={{
                  className: 'px-3 py-2 text-sm bg-white border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }}
              />
              {phoneError && (
                <p className="mt-1 text-xs text-red-600">{phoneError}</p>
              )}
              {!phoneError && phone && phone.length >= 8 && (
                <p className="mt-1 text-xs text-gray-500">Numéro de téléphone valide</p>
              )}
            </div>
          </>
        )
      case 2:
        return (
          <>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
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
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Paris, France"
                  autoComplete="off"
                />
                {cityLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 animate-pulse">
                    ...
                  </span>
                )}
                {citySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full max-h-56 overflow-auto bg-white text-gray-900 rounded-md shadow-lg border border-gray-200 mt-1">
                    {citySuggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion.id}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex flex-col border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setCity(suggestion.city)
                          setCountry(suggestion.country)
                          setCityQuery(suggestion.label)
                          setCitySuggestions([])
                        }}
                      >
                        <span className="font-medium text-sm">{suggestion.city}</span>
                        {suggestion.country && (
                          <span className="text-xs text-gray-500">{suggestion.country}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {country && (
                  <p className="text-xs text-gray-600 mt-1">
                    Pays détecté : <span className="font-semibold">{country}</span>
                  </p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-900 mb-2">
                Profession *
              </label>
              <input
                id="profession"
                type="text"
                required
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Votre profession"
              />
            </div>
          </>
        )
      case 3:
        return (
          <>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                {t.login.password}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                placeholder={t.login.passwordPlaceholder || "Votre mot de passe"}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                {t.login.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                placeholder={t.login.passwordPlaceholder || "Confirmez votre mot de passe"}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas</p>
              )}
            </div>
          </>
        )
      default:
        return null
    }
  }

  // Fonction pour détecter le pays de l'utilisateur
  const detectUserCountry = async () => {
    try {
      // Essayer d'abord avec l'API ipapi.co
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      if (data.country_code) {
        // Convertir le code pays en format ISO 3166-1 alpha-2 (ex: FR, US, etc.)
        const countryCode = data.country_code.toUpperCase()
        setDetectedCountry(countryCode)
        return
      }
    } catch (error) {
      console.log('Erreur détection pays via IP:', error)
    }
    
    // Fallback : utiliser la langue du navigateur pour deviner le pays
    try {
      const browserLang = navigator.language.toLowerCase()
      // Mapping langue -> pays pour les pays francophones principaux
      if (browserLang.startsWith('fr')) {
        setDetectedCountry('FR')
      } else if (browserLang.startsWith('en')) {
        // Par défaut US pour anglais, mais pourrait être GB, CA, etc.
        setDetectedCountry('US')
      } else if (browserLang.startsWith('es')) {
        setDetectedCountry('ES')
      } else if (browserLang.startsWith('pt')) {
        setDetectedCountry('PT')
      } else {
        // Défaut : France
        setDetectedCountry('FR')
      }
    } catch (error) {
      console.log('Erreur détection langue navigateur:', error)
      setDetectedCountry('FR') // Défaut final
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
    // Détecter le pays de l'utilisateur
    detectUserCountry()
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

    // Validation pour l'inscription
    if (isSignUp) {
      // Valider le nom et prénom
      if (!validateName(firstName)) {
        setFirstNameError('Le prénom ne doit contenir que des lettres')
        setError('Veuillez corriger les erreurs dans le formulaire')
        setLoading(false)
        return
      }
      if (!validateName(lastName)) {
        setLastNameError('Le nom ne doit contenir que des lettres')
        setError('Veuillez corriger les erreurs dans le formulaire')
        setLoading(false)
        return
      }
      // Valider l'email
      if (!validateEmail(email)) {
        setEmailError('Veuillez entrer une adresse email valide (ex: nom@exemple.com)')
        setError('Veuillez entrer une adresse email valide')
        setLoading(false)
        return
      }
      // Valider le téléphone
      if (!phone || !phone.trim()) {
        setPhoneError('Le numéro de téléphone est obligatoire')
        setError('Veuillez entrer un numéro de téléphone')
        setLoading(false)
        return
      }
      if (!validatePhone(phone)) {
        setPhoneError('Veuillez entrer un numéro de téléphone valide (minimum 8 caractères)')
        setError('Veuillez entrer un numéro de téléphone valide')
        setLoading(false)
        return
      }
      // Valider le mot de passe
      if (password !== confirmPassword) {
        setError(t.login.errorPasswordMismatch)
        setLoading(false)
        return
      }
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-white rounded-lg mx-auto mb-3 sm:mb-4 inline-block p-2">
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
          <p className="text-sm sm:text-base text-white/90">
            {isSignUp ? t.login.joinCommunity : t.login.accessAccount}
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 border border-gray-200">
          <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{error}</p>
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

            {isSignUp ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-4">
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
                                : 'bg-[#FEBE02] text-[#012F4E]'
                            }`}
                          >
                            {isComplete ? '✓' : step.id}
                          </div>
                          <p className={`text-xs mt-2 font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                            {step.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-[#FEBE02] rounded-full transition-all duration-300"
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
                      className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium text-sm"
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
                      className="w-full sm:w-auto px-4 py-2 rounded-md bg-gradient-to-r from-[#FEBE02] to-[#FEBE02] text-[#012F4E] font-semibold hover:from-[#e6a802] hover:to-[#e6a802] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
                    >
                      {t.login.nextButton || 'Suivant'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !isStepValid(signUpStep)}
                      className="w-full sm:w-auto px-6 py-2 rounded-md bg-gradient-to-r from-[#FEBE02] to-[#FEBE02] text-[#012F4E] font-semibold hover:from-[#e6a802] hover:to-[#e6a802] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#012F4E] mr-2"></div>
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    {t.login.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t.login.emailPlaceholder}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                    {t.login.password}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t.login.passwordPlaceholder}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 text-sm bg-gradient-to-r from-[#FEBE02] to-[#FEBE02] text-[#012F4E] font-semibold rounded-md hover:from-[#e6a802] hover:to-[#e6a802] focus:outline-none focus:ring-2 focus:ring-[#FEBE02] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#012F4E] mr-2"></div>
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
          <div className="mt-6 text-center">
            <p className="text-gray-700 text-sm">
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
                  setPhone('')
                  setFirstNameError('')
                  setLastNameError('')
                  setEmailError('')
                  setPhoneError('')
                }}
                className="ml-2 text-[#012F4E] hover:text-[#023d68] font-semibold transition-colors"
              >
                {isSignUp ? t.login.signIn : t.login.createAccount}
              </button>
            </p>
          </div>

          {/* Mot de passe oublié */}
          {!isSignUp && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                {t.login.forgotPassword}
              </button>
            </div>
          )}

          {/* Lien retour */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
            >
              {t.login.backToSite}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}