'use client'

import { useState } from 'react'

interface AdminPdfUploadModalProps {
  isOpen: boolean
  onClose: () => void
  analysisId: string
  onUploadSuccess: () => void
}

export default function AdminPdfUploadModal({ 
  isOpen, 
  onClose, 
  analysisId, 
  onUploadSuccess 
}: AdminPdfUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Veuillez sélectionner un fichier PDF uniquement.')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Le fichier doit faire moins de 10MB.')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier PDF.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('analysisId', analysisId)

      const response = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de l\'upload du PDF')
      }

      const result = await response.json()
      console.log('PDF uploadé avec succès:', result)
      
      // Reset form
      setFile(null)
      onUploadSuccess()
      onClose()
    } catch (error) {
      console.error('Erreur upload PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload du PDF. Veuillez réessayer.'
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Uploader le PDF d'analyse
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner le fichier PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Fichier sélectionné: {file.name}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Upload en cours...' : 'Uploader'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
