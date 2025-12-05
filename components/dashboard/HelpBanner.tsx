'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

type HelpBannerProps = {
  tabId: string // 'overview' | 'budget' | 'fast' | 'debtfree'
  title: string
  description: string
  modalTitle: string
  modalContent: string | React.ReactNode
}

export default function HelpBanner({ tabId, title, description, modalTitle, modalContent }: HelpBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé cette bannière
    const storageKey = `help_banner_${tabId}_dismissed`
    const dismissed = localStorage.getItem(storageKey)
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [tabId])

  const handleDismiss = () => {
    setIsVisible(false)
    const storageKey = `help_banner_${tabId}_dismissed`
    localStorage.setItem(storageKey, 'true')
  }

  const handleShowModal = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  if (!isVisible) return null

  return (
    <>
      <div className="bg-[#F8FBFF] border border-[#E0ECF5] rounded-2xl p-4 mb-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t.dashboard?.helpBanner?.dismissLabel || 'Ne plus afficher'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="pr-8">
          <p className="text-sm text-[#012F4E] mb-2">
            <strong>{title}</strong>
          </p>
          <p className="text-xs text-gray-600 mb-3">{description}</p>
          <button
            onClick={handleShowModal}
            className="text-xs font-semibold text-[#00A1C6] hover:text-[#012F4E] transition-colors underline"
          >
            {t.dashboard?.helpBanner?.clickHere || 'Cliquez ici'}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
          <div
            className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#012F4E]">{modalTitle}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={t.dashboard?.helpBanner?.closeModal || 'Fermer'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700">
                {typeof modalContent === 'string' ? (
                  <p className="text-base leading-relaxed whitespace-pre-line">{modalContent}</p>
                ) : (
                  modalContent
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="rounded-2xl bg-[#012F4E] px-6 py-3 text-white font-semibold hover:bg-[#023d68] transition-colors"
                >
                  {t.dashboard?.helpBanner?.closeButton || 'J\'ai compris'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

