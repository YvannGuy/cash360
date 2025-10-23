'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase'
import { analysisService, type AnalysisRecord } from '@/lib/database'
import Image from 'next/image'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingDemo, setIsCreatingDemo] = useState(false)
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  
  const supabase = createClientBrowser()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      await loadAnalyses()
      setLoading(false)
    }

    checkUser()
  }, [supabase.auth, router])

  const loadAnalyses = async () => {
    try {
      const userAnalyses = await analysisService.getAnalysesByUser()
      setAnalyses(userAnalyses)
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error)
      // En cas d'erreur, on affiche un message mais on ne bloque pas l'interface
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleNewAnalysis = () => {
    router.push('/analyse-financiere')
  }

  const handleCreateDemoAnalysis = async () => {
    setIsCreatingDemo(true)
    try {
      const response = await fetch('/api/test/create-demo-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // Recharger les analyses
        await loadAnalyses()
      } else {
        console.error('Erreur lors de la création de l\'analyse de démo')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsCreatingDemo(false)
    }
  }

  const handleCheckDatabase = async () => {
    try {
      const response = await fetch('/api/test/check-database')
      const data = await response.json()
      setDiagnosticInfo(data)
      console.log('Diagnostic base de données:', data)
    } catch (error) {
      console.error('Erreur lors du diagnostic:', error)
    }
  }

  const handleFixDashboard = async () => {
    try {
      const response = await fetch('/api/test/fix-dashboard')
      const data = await response.json()
      setDiagnosticInfo(data)
      console.log('Diagnostic dashboard:', data)
      
      // Recharger les analyses après le diagnostic
      await loadAnalyses()
    } catch (error) {
      console.error('Erreur lors du diagnostic dashboard:', error)
    }
  }

  const handleUpdateUserAnalyses = async () => {
    try {
      if (!user?.email) {
        alert('Email utilisateur non disponible')
        return
      }

      const response = await fetch('/api/test/update-user-analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmail: user.email })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ ${data.message}`)
        // Recharger les analyses
        await loadAnalyses()
      } else {
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour des analyses')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'En cours'
      case 'en_analyse':
        return 'En analyse'
      case 'terminee':
        return 'Terminée'
      default:
        return 'Inconnu'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-800'
      case 'en_analyse':
        return 'bg-blue-100 text-blue-800'
      case 'terminee':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/images/logo/logofinal.png"
                alt="Cash360"
                width={192}
                height={192}
                className="h-48 w-auto"
              />
            </div>

            {/* Informations de connexion */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-red-50"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header du tableau de bord */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tableau de bord - Mes analyses
            </h1>
            <p className="text-gray-600">
              Suivez l'avancement de vos analyses financières personnalisées
            </p>
          </div>

          {/* Bouton Nouvelle analyse */}
          <div className="mb-8">
            <button
              onClick={handleNewAnalysis}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nouvelle analyse
            </button>
          </div>

          {/* Liste des analyses */}
          {analyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune analyse trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre première analyse financière
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleNewAnalysis}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Créer ma première analyse
                </button>
                
                <div className="text-xs text-gray-500">ou</div>
                
                <button
                  onClick={handleCreateDemoAnalysis}
                  disabled={isCreatingDemo}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {isCreatingDemo ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Création...
                    </>
                  ) : (
                    'Créer une analyse de test'
                  )}
                </button>
                
                <div className="mt-4 space-y-2">
                  <div className="space-y-2">
                    <button
                      onClick={handleCheckDatabase}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-600 bg-gray-50 hover:bg-gray-100"
                    >
                      🔍 Vérifier la base de données
                    </button>
                    
                    <button
                      onClick={handleFixDashboard}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                    >
                      🔧 Diagnostic Dashboard
                    </button>
                    
                    <button
                      onClick={handleUpdateUserAnalyses}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-green-300 text-xs font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100"
                    >
                      🔗 Associer mes analyses
                    </button>
                  </div>
                  
                  {diagnosticInfo && (
                    <div className="text-xs text-left bg-gray-50 p-2 rounded border">
                      <div className="font-medium mb-1">Diagnostic :</div>
                      {diagnosticInfo.summary ? (
                        <>
                          <div>Total analyses: {diagnosticInfo.summary.totalAnalyses}</div>
                          <div>Avec user_id: {diagnosticInfo.summary.analysesWithUserId}</div>
                          <div>Sans user_id: {diagnosticInfo.summary.analysesWithoutUserId}</div>
                          <div className="mt-2 font-medium">Analyses récentes:</div>
                          {diagnosticInfo.allAnalyses?.slice(0, 3).map((analysis: any) => (
                            <div key={analysis.id} className="ml-2">
                              {analysis.ticket} - {analysis.client_name} ({analysis.user_id ? 'avec user_id' : 'sans user_id'})
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          <div>Tables: {diagnosticInfo.database?.tables?.join(', ') || 'Aucune'}</div>
                          <div>Analyses: {diagnosticInfo.database?.analysesCount || 0}</div>
                          <div>Configuration: {diagnosticInfo.success ? '✅ OK' : '❌ Erreur'}</div>
                        </>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    ⚠️ Assurez-vous d'avoir créé les tables dans Supabase (voir DATABASE_SETUP.md)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header de l'analyse */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Analyse #{analysis.ticket}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Créée le {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`}>
                          {getStatusLabel(analysis.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenu de l'analyse */}
                  <div className="px-6 py-4">
                    {/* Barre de progression */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progression de l'analyse
                        </span>
                        <span className="text-sm text-gray-600">
                          {analysis.status === 'terminee' ? '100%' : '70%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: analysis.status === 'terminee' ? '100%' : '70%' }}
                        ></div>
                      </div>
                    </div>

                    {/* Étapes de l'analyse */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-600 text-white">
                          ✓
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Réception</p>
                          <p className="text-xs text-gray-600">Documents reçus</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-600 text-white">
                          ✓
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Analyse</p>
                          <p className="text-xs text-gray-600">En cours d'étude</p>
                        </div>
                      </div>

                      <div className={`flex items-center space-x-3 p-3 rounded-lg ${analysis.status === 'terminee' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${analysis.status === 'terminee' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                          {analysis.status === 'terminee' ? '✓' : '3'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Rapport</p>
                          <p className="text-xs text-gray-600">Finalisation</p>
                        </div>
                      </div>
                    </div>

                    {/* Informations détaillées */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Détails de l'analyse</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Client :</span>
                          <span className="ml-2 font-medium">{analysis.client_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email :</span>
                          <span className="ml-2 font-medium">{analysis.client_email}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Dernière mise à jour :</span>
                          <span className="ml-2 font-medium">{new Date(analysis.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Statut :</span>
                          <span className="ml-2 font-medium">{getStatusLabel(analysis.status)}</span>
                        </div>
                      </div>

                      {/* Bouton Prendre RDV */}
                      {analysis.status === 'terminee' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">
                                  Analyse terminée - Prêt pour le RDV
                                </h5>
                                <p className="text-xs text-gray-600">
                                  Votre analyse est terminée, prenez rendez-vous pour la présentation
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                window.open('https://calendly.com/cash360/le-debut-de-votre-liberte-financiere-clone', '_blank')
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Prendre RDV
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
