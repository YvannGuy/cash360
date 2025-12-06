'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

export default function AnnouncementEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAdminSession = () => {
      const adminSessionData = localStorage.getItem('admin_session')
      const adminEmail = localStorage.getItem('admin_email')
      const adminRole = localStorage.getItem('admin_role')
      
      if (adminSessionData === 'true' && adminEmail) {
        setAdminSession({ isAdmin: true, email: adminEmail, role: adminRole as 'admin' | 'commercial' })
      } else {
        router.push('/admin/login')
        return
      }
      setLoading(false)
    }
    
    checkAdminSession()
  }, [router])

  useEffect(() => {
    if (adminSession?.isAdmin) {
      loadPreview()
    }
  }, [adminSession])

  const loadPreview = async () => {
    setLoadingPreview(true)
    try {
      const response = await fetch('/api/admin/send-announcement-email')
      const data = await response.json()
      
      if (data.success) {
        setPreview(data.preview)
        setSubject(data.subject)
      } else {
        console.error('Erreur lors du chargement du preview:', data.error)
        alert('Erreur lors du chargement du preview: ' + data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du preview:', error)
      alert('Erreur lors du chargement du preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSend = async () => {
    if (!confirm('Êtes-vous sûr de vouloir envoyer cet email à TOUS les utilisateurs de la plateforme ?')) {
      return
    }

    if (!confirm('Cette action est irréversible. Confirmez-vous l\'envoi ?')) {
      return
    }

    setSending(true)
    setSendResult(null)
    
    try {
      const response = await fetch('/api/admin/send-announcement-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: true }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSendResult({
          success: true,
          message: data.message,
          stats: data.stats,
          errors: data.errors || []
        })
        alert(`✅ ${data.message}`)
      } else {
        setSendResult({
          success: false,
          error: data.error
        })
        alert('❌ Erreur: ' + data.error)
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error)
      setSendResult({
        success: false,
        error: error.message || 'Erreur inconnue'
      })
      alert('❌ Erreur lors de l\'envoi: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  if (loading || !adminSession?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab="mail"
      />
      
      <div className="lg:pl-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mb-4 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📧 Email d'annonce - Cash360
            </h1>
            <p className="text-gray-600">
              Prévisualisez et envoyez l'email d'annonce des nouveautés à tous les utilisateurs
            </p>
          </div>

          {/* Sujet de l'email */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sujet de l'email</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-lg font-medium text-gray-800">
                {subject || 'Chargement...'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={loadPreview}
                disabled={loadingPreview}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loadingPreview ? 'Chargement...' : '🔄 Actualiser le preview'}
              </button>
              
              <button
                onClick={handleSend}
                disabled={sending || !preview}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                {sending ? '⏳ Envoi en cours...' : '🚀 Envoyer à tous les utilisateurs'}
              </button>
            </div>
            
            {sendResult && (
              <div className={`mt-6 p-4 rounded-lg ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`font-semibold mb-2 ${sendResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {sendResult.success ? '✅ Envoi réussi' : '❌ Erreur'}
                </h3>
                <p className={sendResult.success ? 'text-green-700' : 'text-red-700'}>
                  {sendResult.message || sendResult.error}
                </p>
                {sendResult.stats && (
                  <div className="mt-4 text-sm text-green-700">
                    <p>Total: {sendResult.stats.total} utilisateurs</p>
                    <p>Succès: {sendResult.stats.success}</p>
                    <p>Échecs: {sendResult.stats.failed}</p>
                  </div>
                )}
                {sendResult.errors && sendResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-red-700 mb-2">Erreurs (premiers 10):</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {sendResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Aperçu de l'email</h2>
            
            {loadingPreview ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement du preview...</p>
              </div>
            ) : preview ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={preview}
                  className="w-full h-[800px] border-0"
                  title="Email Preview"
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Aucun preview disponible</p>
                <button
                  onClick={loadPreview}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Charger le preview
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
