'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { createClientBrowser } from '@/lib/supabase'
import { analysisService, type AnalysisRecord } from '@/lib/database'

interface AnalysisCardProps {
  item: {
    id: string
    title: string
    img: string
    blurb: string
  }
  userAnalysis?: AnalysisRecord | null
  orderStatus?: {
    status: 'pending_review' | 'paid' | 'rejected'
    paymentMethod?: string
  } | null
  onUploadSuccess?: () => void
}

export default function AnalysisCard({ item, userAnalysis, orderStatus, onUploadSuccess }: AnalysisCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [supabase, setSupabase] = useState<any>(null)
  const [hasFiles, setHasFiles] = useState(false)

  React.useEffect(() => {
    const initSupabase = async () => {
      const client = createClientBrowser()
      setSupabase(client)
    }
    initSupabase()
  }, [])

  // Vérifier si l'analyse a des fichiers uploadés
  React.useEffect(() => {
    const checkFiles = async () => {
      if (!userAnalysis?.id || !supabase) {
        setHasFiles(false)
        return
      }

      try {
        const files = await analysisService.getFilesByAnalysis(userAnalysis.id)
        setHasFiles(files.length > 0)
      } catch (error) {
        console.error('Erreur vérification fichiers:', error)
        setHasFiles(false)
      }
    }

    checkFiles()
  }, [userAnalysis?.id, supabase])

  // Déterminer l'état de l'analyse
  const getAnalysisState = () => {
    // Si commande Mobile Money en attente de validation, afficher l'état d'attente
    if (orderStatus?.status === 'pending_review' && orderStatus.paymentMethod === 'mobile_money') {
      return 'pending_validation' // Mobile Money en attente de validation admin
    }
    
    // Si analyse existe, vérifier son statut et la présence de fichiers
    if (userAnalysis) {
      if (userAnalysis.status === 'terminee' && userAnalysis.pdf_url) {
        return 'completed' // Analyse terminée avec PDF
      }
      
      // Si l'analyse existe mais n'a pas encore de fichiers uploadés, c'est l'état initial
      if (!hasFiles && userAnalysis.status === 'en_cours') {
        return 'initial' // Analyse créée mais pas encore de fichiers uploadés
      }
      
      // Si fichiers présents OU statut en_analyse, c'est en cours
      if (hasFiles || userAnalysis.status === 'en_analyse') {
        return 'in_progress' // Analyse en cours (fichiers uploadés ou en traitement)
      }
      
      // Par défaut, si analyse existe mais statut inconnu, on considère initial
      return 'initial'
    }
    
    // Pas d'analyse créée : si paiement validé (ou Stripe), on peut uploader
    // Si Mobile Money en attente, on affiche déjà 'pending_validation' ci-dessus
    return 'initial' // Pas encore créée, afficher le bouton pour uploader (si paiement validé)
  }

  const state = getAnalysisState()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validation : exactement 3 fichiers
    if (files.length !== 3) {
      setUploadError('Vous devez sélectionner exactement 3 fichiers PDF')
      setSelectedFiles([])
      return
    }

    // Validation : tous doivent être des PDF
    const invalidFiles = files.filter(file => file.type !== 'application/pdf')
    if (invalidFiles.length > 0) {
      setUploadError('Tous les fichiers doivent être des PDF')
      setSelectedFiles([])
      return
    }

    // Validation : taille max 50MB par fichier
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setUploadError('Chaque fichier ne doit pas dépasser 50MB')
      setSelectedFiles([])
      return
    }

    setSelectedFiles(files)
    setUploadError(null)
  }

  const handleUpload = async () => {
    if (selectedFiles.length !== 3 || !supabase) {
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Session expirée, veuillez vous reconnecter')
      }

      // Créer FormData avec les 3 fichiers
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('releves', file)
      })

      // Appeler l'API d'upload
      const response = await fetch('/api/upload-analysis', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'upload')
      }

      // Succès : réinitialiser et notifier le parent
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      if (onUploadSuccess) {
        onUploadSuccess()
      }

      // Rafraîchir la page après un court délai pour voir la mise à jour
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Erreur upload:', error)
      setUploadError(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (userAnalysis?.pdf_url) {
      window.open(userAnalysis.pdf_url, '_blank')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={item.img}
              alt={item.title}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{item.blurb}</p>

            {/* État Mobile Money en attente de validation */}
            {state === 'pending_validation' && (
              <div className="space-y-3">
                <div className="mb-2">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                    En attente de validation
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Votre paiement Mobile Money est en attente de validation par l'administrateur. 
                  Une fois validé, vous pourrez télécharger vos relevés bancaires pour lancer votre analyse.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  En attente de validation
                </div>
              </div>
            )}

            {/* État initial : Bouton pour uploader */}
            {state === 'initial' && (
              <div className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id={`analysis-upload-${item.id}`}
                  />
                  <label
                    htmlFor={`analysis-upload-${item.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Télécharger vos 3 derniers relevés bancaires
                  </label>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''} :
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {selectedFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        isUploading
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isUploading ? 'Upload en cours...' : 'Lancer mon analyse'}
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{uploadError}</p>
                  </div>
                )}
              </div>
            )}

            {/* État en cours */}
            {state === 'in_progress' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Analyse en cours</span>
                </div>
                <p className="text-sm text-gray-600">
                  Vos relevés sont en cours d'analyse par nos experts. Vous recevrez votre rapport sous 48-72h.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  En traitement
                </div>
              </div>
            )}

            {/* État terminé */}
            {state === 'completed' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Analyse terminée</span>
                </div>
                <p className="text-sm text-gray-600">
                  Votre analyse financière est prête. Téléchargez votre rapport détaillé.
                </p>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Voir résultat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

