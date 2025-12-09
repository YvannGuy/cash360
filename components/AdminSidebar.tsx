'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface AdminSidebarProps {
  activeTab?: string
  isOpen?: boolean
  onClose?: () => void
}

const Icons = {
  coins: (
    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
    </svg>
  ),
  store: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
    </svg>
  ),
  home: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>
  ),
  graduation: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
    </svg>
  ),
  chalkboard: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0v3a1 1 0 01-1.414 0V6.293zM9 6.293a1 1 0 011.414 0v3a1 1 0 01-1.414 0V6.293zM13 6.293a1 1 0 011.414 0v3a1 1 0 01-1.414 0V6.293zM15.707 9.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414l-1.293-1.293H16a1 1 0 100-2h-1.586l1.293-1.293z" clipRule="evenodd"/>
    </svg>
  ),
  creditCard: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
    </svg>
  ),
  folder: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
    </svg>
  ),
  cog: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
    </svg>
  ),
  phone: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
    </svg>
  ),
  subscription: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
    </svg>
  ),
  mail: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
    </svg>
  ),
  testimonials: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
    </svg>
  ),
}

export default function AdminSidebar({ activeTab = 'overview', isOpen: controlledIsOpen, onClose }: AdminSidebarProps) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'admin' | 'commercial' | null>(null)
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  // Utiliser l'état contrôlé si fourni, sinon utiliser l'état interne
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = controlledIsOpen !== undefined ? (onClose || (() => {})) : setInternalIsOpen

  useEffect(() => {
    const role = localStorage.getItem('admin_role') as 'admin' | 'commercial' | null
    setUserRole(role)
  }, [])

  // Fermer la sidebar sur mobile après redimensionnement si elle dépasse la largeur de l'écran
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && internalIsOpen) {
        setInternalIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [internalIsOpen])

  const allMenuItems = [
    { id: 'overview', label: 'Overview', icon: 'home', route: '/admin/dashboard', adminOnly: true },
    // Onglet Appels & RDV masqué temporairement
    // { id: 'commercial-calls', label: 'Appels & RDV', icon: 'phone', route: '/admin/commercial-calls', adminOnly: false },
    { id: 'users', label: 'Utilisateurs', icon: 'users', route: '/admin/users', adminOnly: true },
    { id: 'analyses', label: 'Analyses financières', icon: 'chart', route: '/admin/analyses', adminOnly: true },
    { id: 'boutique', label: 'Boutique', icon: 'store', route: '/admin/boutique', adminOnly: true },
    { id: 'formations', label: 'Formations & sessions', icon: 'chalkboard', route: '/admin/formations', adminOnly: true },
    { id: 'paiements', label: 'Paiements', icon: 'creditCard', route: '/admin/paiements', adminOnly: true },
    { id: 'abonnements', label: 'Abonnements', icon: 'subscription', route: '/admin/abonnements', adminOnly: true },
    { id: 'mes-achats-utilisateurs', label: 'Mes achats utilisateurs', icon: 'store', route: '/admin/mes-achats-utilisateurs', adminOnly: true },
    { id: 'fichiers', label: 'Fichiers & relevés', icon: 'folder', route: '/admin/fichiers', adminOnly: true },
    { id: 'carousel', label: 'Carrousel', icon: 'store', route: '/admin/carousel', adminOnly: true },
    { id: 'mail', label: 'Email d\'annonce', icon: 'mail', route: '/admin/announcement-email', adminOnly: true },
    { id: 'newsletter', label: 'Newsletter', icon: 'mail', route: '/admin/newsletter', adminOnly: true },
    { id: 'testimonials', label: 'Témoignages', icon: 'testimonials', route: '/admin/testimonials', adminOnly: true },
    { id: 'settings', label: 'Paramètres', icon: 'cog', route: '/admin/settings', adminOnly: false },
  ]

  // Filtrer les éléments selon le rôle
  const menuItems = allMenuItems.filter(item => {
    if (!userRole) return true
    if (userRole === 'commercial') {
      return !item.adminOnly
    }
    return true
  })

  const handleMenuClick = (route: string) => {
    router.push(route)
    // Fermer la sidebar sur mobile après avoir cliqué sur un élément
    if (window.innerWidth < 768) {
      setIsOpen(false)
      if (onClose) onClose()
    }
  }

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] md:hidden transition-opacity duration-300"
          onClick={() => {
            setIsOpen(false)
            if (onClose) onClose()
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full z-[100] bg-white shadow-sm border-r border-gray-200
          transition-transform duration-300 ease-in-out
          w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#012F4E] rounded-lg flex items-center justify-center">
                {Icons.coins}
              </div>
              <span className="text-xl font-bold text-[#012F4E]">Cash360</span>
            </div>
            {/* Bouton fermer pour mobile */}
            <button
              onClick={() => {
                setIsOpen(false)
                if (onClose) onClose()
              }}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer le menu"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMenuClick(item.route)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
                  activeTab === item.id
                    ? 'bg-[#00A1C6]/10 border-l-4 border-[#FEBE02]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={activeTab === item.id ? 'text-[#00A1C6]' : ''}>
                  {Icons[item.icon as keyof typeof Icons]}
                </span>
                <span className={activeTab === item.id ? 'font-medium text-[#012F4E]' : ''}>
                  {item.label}
                </span>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

