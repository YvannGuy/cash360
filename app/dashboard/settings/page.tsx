'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientBrowser } from '@/lib/supabase'
import LanguageSwitch from '@/components/LanguageSwitch'
import { useCart } from '@/lib/CartContext'

export default function SettingsPage() {
  const router = useRouter()
  const { cartItems, getSubtotal } = useCart()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [supabase, setSupabase] = useState<any>(null)
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('France')
  const [city, setCity] = useState('')
  const [profession, setProfession] = useState('')

  const [saving, setSaving] = useState(false)
  const [showCartDropdown, setShowCartDropdown] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    setSupabase(createClientBrowser())
  }, [])

  useEffect(() => {
    if (!supabase) return
    
    const loadUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          router.push('/login')
          return
        }
        
        setUser(authUser)
        setEmail(authUser.email || '')
        
        // Charger les métadonnées utilisateur
        if (authUser.user_metadata) {
          setFirstName(authUser.user_metadata.first_name || '')
          setLastName(authUser.user_metadata.last_name || '')
          setPhone(authUser.user_metadata.phone || '')
          setCountry(authUser.user_metadata.country || 'France')
          setCity(authUser.user_metadata.city || '')
          setProfession(authUser.user_metadata.profession || '')
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [supabase, router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCartDropdown || showUserMenu) {
        const target = event.target as Element
        if (!target.closest('.cart-container') && !target.closest('.user-menu-container')) {
          setShowCartDropdown(false)
          setShowUserMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCartDropdown, showUserMenu])

  const getInitials = (email: string | undefined): string => {
    if (!email) return ''
    const localPart = email.split('@')[0]
    const parts = localPart.split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return localPart.substring(0, 2).toUpperCase()
  }

  const handleViewCart = () => {
    setShowCartDropdown(false)
    router.push('/cart')
  }

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSave = async () => {
    if (!supabase) return
    
    setSaving(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          country: country,
          city: city,
          profession: profession
        }
      })
      
      if (error) throw error
      
      alert('Modifications enregistrées avec succès!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement:', error)
      alert('Erreur lors de l\'enregistrement des modifications')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 ml-2 sm:ml-16 mt-4">
              <button
                onClick={() => router.push('/')}
                className="cursor-pointer"
              >
                <Image
                  src="/images/logo/logofinal.png"
                  alt="Cash360"
                  width={540}
                  height={540}
                  className="h-16 sm:h-32 md:h-42 w-auto hover:opacity-80 transition-opacity duration-200"
                />
              </button>
            </div>
            
            {/* Informations de connexion */}
            <div className="flex items-center gap-1 sm:gap-4 mr-2 sm:mr-20">
              {user && (
                <div className="flex items-center gap-1 sm:gap-3">
                  {/* Icône Panier */}
                  <div className="relative cart-container z-[10000]">
                    <button
                      onClick={() => setShowCartDropdown(!showCartDropdown)}
                      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {cartItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#FEBE02] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {cartItems.length}
                        </span>
                      )}
                    </button>

                    {/* Dropdown du panier */}
                    {showCartDropdown && (
                      <div className="fixed sm:absolute top-16 sm:top-auto right-1 sm:right-0 left-1 sm:left-auto mt-0 sm:mt-2 w-[calc(100vw-0.5rem)] sm:w-80 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-[10000] animate-fadeIn max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <h3 className="font-bold text-[#012F4E]" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>
                            Mon panier
                          </h3>
                        </div>

                        {/* Liste des articles */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                          {cartItems.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                              <span className="mr-2">👋</span>
                              Votre panier est vide
                              <p className="text-xs text-gray-400 mt-2">Ajoutez des produits dans votre panier depuis votre boutique.</p>
                            </div>
                          ) : (
                            <div className="px-4 py-2">
                              {cartItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
                                  {/* Image miniature */}
                                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={item.img}
                                      alt={item.title}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  
                                  {/* Infos */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                    <p className="text-sm text-gray-600">Qté: {item.quantity}</p>
                                    <p className="text-sm font-bold text-[#012F4E]">{(item.price * item.quantity).toFixed(2)} €</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer avec sous-total et boutons */}
                        {cartItems.length > 0 && (
                          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
                            {/* Sous-total */}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Sous-total :</span>
                              <span className="text-base font-bold text-[#012F4E]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                                {getSubtotal().toFixed(2)} €
                              </span>
                            </div>

                            {/* Bouton "Voir le panier" */}
                            <button
                              onClick={handleViewCart}
                              className="w-full px-4 py-2 bg-[#00A1C6] text-white rounded-lg font-medium hover:bg-[#FEBE02] transition-colors"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            >
                              Voir le panier
                            </button>

                            {/* Lien "Continuer vos achats" */}
                            <button
                              onClick={() => setShowCartDropdown(false)}
                              className="w-full text-sm text-[#012F4E] hover:underline transition-colors"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                            >
                              Continuer vos achats
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <LanguageSwitch />
                  <div className="relative user-menu-container z-[9999]">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {getInitials(user.email)}
                      </span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]">
                        <button
                          onClick={() => {
                            router.push('/dashboard')
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
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Paramètres du compte</h1>
            <p className="text-gray-600">Mettez à jour vos informations personnelles et vos préférences.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#012F4E] mb-6">Informations personnelles</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Prénom
                </label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                  placeholder="Votre prénom"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nom
                </label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Adresse e-mail
              </label>
              <input 
                type="email" 
                value={email} 
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Téléphone
              </label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                placeholder="+33 X XX XX XX XX"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pays
                </label>
                <select 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                >
                  <option value="France">France</option>
                  <option value="Belgique">Belgique</option>
                  <option value="Suisse">Suisse</option>
                  <option value="Canada">Canada</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ville
                </label>
                <input 
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                  placeholder="Votre ville"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Profession
              </label>
              <input 
                type="text" 
                value={profession} 
                onChange={(e) => setProfession(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                placeholder="Votre profession"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#00A1C6] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0089a3] transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

