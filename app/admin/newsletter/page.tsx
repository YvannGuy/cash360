'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

export default function NewsletterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [preview, setPreview] = useState<string>('')
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

  const loadPreview = async () => {
    setLoadingPreview(true)
    try {
      const response = await fetch('/api/admin/send-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preview: true
        })
      })

      const data = await response.json()
      
      if (data.success && data.preview) {
        setPreview(data.preview)
      } else {
        alert('Erreur lors du chargement de l\'aperçu: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du chargement de l\'aperçu')
    } finally {
      setLoadingPreview(false)
    }
  }

  const sendNewsletter = async () => {
    if (!confirm('Êtes-vous sûr de vouloir envoyer la newsletter à TOUS les utilisateurs inscrits ?')) {
      return
    }

    setSending(true)
    setSendResult(null)

    try {
      const response = await fetch('/api/admin/send-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preview: false,
          confirm: true
        })
      })

      const data = await response.json()
      setSendResult(data)

      if (data.success) {
        alert(`Newsletter envoyée avec succès !\n${data.message}`)
      } else {
        alert('Erreur lors de l\'envoi: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi de la newsletter')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        activeTab="newsletter"
      />
      
      <div className="lg:pl-64">
        <div className="p-8">
          <div className="mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mb-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Envoyer la Newsletter</h1>
            <p className="mt-2 text-gray-600">
              Envoyez le template newsletter à tous les utilisateurs inscrits sur la plateforme
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Template Newsletter</h2>
            <p className="text-gray-600 mb-4">
              Ce template contient toutes les informations sur l'utilisation de la plateforme Cash360 :
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
              <li>Comment utiliser le site</li>
              <li>Création de compte</li>
              <li>Accès au tableau de bord</li>
              <li>Outils exclusifs avec abonnement</li>
              <li>Gestion du panier</li>
              <li>Accès aux achats</li>
              <li>Informations de contact</li>
            </ul>

            <div className="flex gap-4 mt-6">
              <button
                onClick={loadPreview}
                disabled={loadingPreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPreview ? 'Chargement...' : '📧 Prévisualiser'}
              </button>
              
              <button
                onClick={sendNewsletter}
                disabled={sending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Envoi en cours...' : '🚀 Envoyer à tous les utilisateurs'}
              </button>
            </div>
          </div>

          {preview && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Aperçu de la Newsletter</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={preview}
                  className="w-full h-[600px] border-0"
                  title="Aperçu newsletter"
                />
              </div>
            </div>
          )}

          {sendResult && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Résultats de l'envoi</h2>
              {sendResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold mb-2">✅ {sendResult.message}</p>
                  {sendResult.stats && (
                    <div className="mt-4 space-y-2">
                      <p className="text-green-700">
                        <strong>Total:</strong> {sendResult.stats.total} utilisateurs
                      </p>
                      <p className="text-green-700">
                        <strong>Succès:</strong> {sendResult.stats.success} emails envoyés
                      </p>
                      {sendResult.stats.failed > 0 && (
                        <p className="text-red-700">
                          <strong>Échecs:</strong> {sendResult.stats.failed} emails
                        </p>
                      )}
                    </div>
                  )}
                  {sendResult.errors && sendResult.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-red-700 font-semibold mb-2">Erreurs:</p>
                      <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                        {sendResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold">❌ {sendResult.error || 'Erreur lors de l\'envoi'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
