'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccesContent() {
  const searchParams = useSearchParams()
  const ticket = searchParams.get('ticket')

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
            Merci, nous avons bien reçu votre dossier
          </h1>
          {ticket && (
            <p className="text-lg text-gray-600">
              Votre ticket : <span className="font-mono font-semibold text-blue-600">{ticket}</span>
            </p>
          )}
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Prochaines étapes
              </h2>
              
              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">1</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Analyse en cours</h3>
                    <p className="text-sm text-gray-600">Examen approfondi de vos 3 relevés bancaires</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">2</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Détection d'anomalies</h3>
                    <p className="text-sm text-gray-600">Identification des points d'amélioration</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">3</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Recommandations</h3>
                    <p className="text-sm text-gray-600">Solutions personnalisées pour vos finances</p>
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
                  <h3 className="text-lg font-medium text-blue-900">Délai de traitement</h3>
                  <p className="text-blue-700">
                    Nous analysons vos relevés et revenons vers vous sous <strong>48 à 72 heures ouvrées</strong> avec un <strong>compte-rendu détaillé</strong> et des <strong>recommandations personnalisées</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Besoin d'aide ?</h3>
              <p className="text-gray-600 mb-4">
                Pour toute question concernant votre dossier ou l'analyse :
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
                  Référencez votre ticket <span className="font-mono">{ticket}</span> dans votre email
                </p>
              )}
            </div>

            {/* Récapitulatif */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Service :</span>
                  <span className="font-medium">Analyse approfondie de vos finances</span>
                </div>
                <div className="flex justify-between">
                  <span>Montant :</span>
                  <span className="font-medium">59,99 €</span>
                </div>
                {ticket && (
                  <div className="flex justify-between">
                    <span>Ticket :</span>
                    <span className="font-mono font-medium">{ticket}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Statut :</span>
                  <span className="font-medium text-blue-600">En cours de traitement</span>
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
            Voir l'avancée de mon analyse
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>Vous pouvez suivre l'avancement de votre analyse sur votre tableau de bord personnel</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <SuccesContent />
    </Suspense>
  )
}
