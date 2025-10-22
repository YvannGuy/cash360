'use client'
import { useEffect, useState } from 'react'

type Props = { userId: string; email: string }
type FileRow = { name: string; id?: string; created_at?: string; updated_at?: string; path: string; size?: number }

export default function FilesClient({ userId }: Props) {
  const [rows, setRows] = useState<FileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      
      console.log('🔍 Recherche des fichiers via API admin...')
      
      try {
        // Utiliser l'API avec permissions admin pour contourner RLS
        const response = await fetch('/api/files')
        const result = await response.json()
        
        console.log('📋 Résultat API admin:', result)
        
        if (result.error) {
          setError(result.error)
        } else {
          setRows(result.files || [])
          console.log('📁 Fichiers chargés:', result.files?.length || 0)
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error)
        setError(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
      
      setLoading(false)
    })()
  }, [])

  const download = async (file: any) => {
    try {
      console.log('📥 Téléchargement du fichier:', file.path)
      
      // Utiliser l'API admin pour générer l'URL signée
      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: file.path })
      })
      
      const result = await response.json()
      
      if (result.error) {
        console.error('❌ Erreur téléchargement:', result.error)
        alert(`Erreur: ${result.error}`)
      } else {
        console.log('✅ URL signée générée:', result.signedUrl)
        window.open(result.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error)
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  if (loading) return <div className="p-6">Chargement…</div>
  if (error) return <div className="p-6 text-red-600">Erreur: {error}</div>
  if (!rows.length) return <div className="p-6">Aucun fichier pour le moment.</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Vos relevés</h1>
      <ul className="space-y-2">
        {rows.map((file, index) => (
          <li key={index} className="flex items-center justify-between border rounded-xl p-3">
            <div>
              <span className="font-medium">{file.name}</span>
              <div className="text-sm text-gray-500">
                {file.path} • {file.size ? `${Math.round(file.size / 1024)} KB` : ''}
              </div>
            </div>
            <button 
              className="border rounded-lg px-3 py-1 hover:bg-gray-50" 
              onClick={() => download(file)}
            >
              Télécharger
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
