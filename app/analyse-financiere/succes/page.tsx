'use client'

import React, { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { useLanguage } from '@/lib/LanguageContext'

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function SuccesContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const ticket = searchParams.get('ticket')
  const [mounted, setMounted] = React.useState(false)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Track conversion when page loads
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-17668382284/ngfGCKnU5LAbEMy8-OhB',
        'value': 1.0,
        'currency': 'EUR'
      })
    }
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de succès */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.success.title}
          </h1>
          {ticket && (
            <p className="text-lg text-gray-600">
              {t.success.yourTicket} <span className="font-mono font-semibold text-blue-600">{ticket}</span>
            </p>
          )}
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t.success.nextSteps}
              </h2>
              
              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">1</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t.success.step1Title}</h3>
                    <p className="text-sm text-gray-600">{t.success.step1Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">2</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t.success.step2Title}</h3>
                    <p className="text-sm text-gray-600">{t.success.step2Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">3</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t.success.step3Title}</h3>
                    <p className="text-sm text-gray-600">{t.success.step3Desc}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Délai de traitement */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-blue-900">{t.success.processingTime}</h3>
                  <p className="text-blue-700">
                    {t.success.processingDesc} <strong>{t.success.processingDuration}</strong> {t.success.processingWith} <strong>{t.success.detailedReport}</strong> {t.success.and} <strong>{t.success.personalizedRecommendations}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.success.needHelp}</h3>
              <p className="text-gray-600 mb-4">
                {t.success.needHelpText}
              </p>
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a 
                  href="mailto:contact@cash360.finance" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  contact@cash360.finance
                </a>
              </div>
              {ticket && (
                <p className="text-sm text-gray-500 mt-2">
                  {t.success.referenceTicket} <span className="font-mono">{ticket}</span> {t.success.inYourEmail}
                </p>
              )}
            </div>

            {/* Récapitulatif */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t.success.summary}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>{t.success.service}</span>
                  <span className="font-medium">{t.success.serviceValue}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.success.amount}</span>
                  <span className="font-medium">59,99 €</span>
                </div>
                {ticket && (
                  <div className="flex justify-between">
                    <span>{t.success.ticket}</span>
                    <span className="font-mono font-medium">{ticket}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t.success.statusLabel}</span>
                  <span className="font-medium text-blue-600">{t.success.statusValue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t.success.viewProgress}
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>{t.success.trackText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t.success.loadingText}</p>
      </div>
    </div>
  )
}

export default function SuccesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccesContent />
    </Suspense>
  )
}
