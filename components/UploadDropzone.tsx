import React, { useCallback, useState } from 'react'
import { validateFile } from '@/lib/validation'

interface UploadDropzoneProps {
  onFilesChange: (files: File[]) => void
  files: File[]
  error?: string
  required?: boolean
}

export default function UploadDropzone({ onFilesChange, files, error, required = false }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles: File[] = []
    const errors: string[] = []
    
    // Vérifier que nous n'avons pas plus de 3 fichiers au total
    if (files.length + droppedFiles.length > 3) {
      errors.push('Vous ne pouvez téléverser que 3 relevés maximum')
    }
    
    droppedFiles.forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })
    
    if (errors.length > 0) {
      // Vous pouvez gérer les erreurs ici (toast, etc.)
      console.error('Erreurs de validation:', errors)
    }
    
    onFilesChange([...files, ...validFiles])
  }, [files, onFilesChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles: File[] = []
    
    selectedFiles.forEach(file => {
      const validation = validateFile(file)
      if (validation.valid && files.length + validFiles.length < 3) {
        validFiles.push(file)
      }
    })
    
    onFilesChange([...files, ...validFiles])
  }, [files, onFilesChange])

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }, [files, onFilesChange])

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
            >
              Cliquez pour sélectionner
            </label>{' '}
            ou glissez-déposez vos fichiers
          </div>
          <p className="text-xs text-gray-500">
            PDF, PNG, JPG (max 10 Mo chacun) - {files.length}/3 fichiers
          </p>
          {required && <span className="text-red-500 text-xs">*</span>}
        </div>
        
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileInput}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Fichiers sélectionnés :</h4>
          <ul className="space-y-1">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Badge sécurité */}
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Sécurisé & confidentiel</span>
      </div>
    </div>
  )
}
