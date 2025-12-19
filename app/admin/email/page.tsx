'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { emailTemplates } from '@/lib/email-templates'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

export default function EmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1)
  const [emailSubject, setEmailSubject] = useState<string>('')
  const [emailBody, setEmailBody] = useState<string>('')
  const [isHtmlMode, setIsHtmlMode] = useState<boolean>(false)
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
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Veuillez remplir le sujet et le corps du mail avant de prévisualiser')
      return
    }

    setLoadingPreview(true)
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preview: true,
          templateId: selectedTemplate,
          subject: emailSubject,
          body: emailBody,
          isHtml: isHtmlMode
        }),
      })
      const data = await response.json()
      
      if (data.success) {
        setPreview(data.preview)
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
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Veuillez remplir le sujet et le corps du mail avant d\'envoyer')
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir envoyer cet email à TOUS les utilisateurs ayant validé leur email ?')) {
      return
    }

    if (!confirm('Cette action est irréversible. Confirmez-vous l\'envoi ?')) {
      return
    }

    setSending(true)
    setSendResult(null)
    
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: true,
          templateId: selectedTemplate,
          subject: emailSubject,
          body: emailBody,
          isHtml: isHtmlMode
        }),
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

  const selectedTemplateData = emailTemplates.find(t => t.id === selectedTemplate)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab="email"
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
              📧 Envoyer un email
            </h1>
            <p className="text-gray-600">
              Créez et envoyez des emails à tous les utilisateurs ayant validé leur email
            </p>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration de l'email</h2>
            
            {/* Sélection du template */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template de design
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
              >
                {emailTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
              {selectedTemplateData && (
                <p className="mt-2 text-sm text-gray-500">
                  {selectedTemplateData.description}
                </p>
              )}
            </div>

            {/* Sujet de l'email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet de l'email *
              </label>
              <input
                type="text"
                placeholder="Tapez l'objet de votre email ici..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
              />
            </div>

            {/* Corps de l'email */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Corps de l'email *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Texte</span>
                  <button
                    type="button"
                    onClick={() => setIsHtmlMode(!isHtmlMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isHtmlMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isHtmlMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">HTML</span>
                </div>
              </div>
              <textarea
                placeholder={isHtmlMode 
                  ? "Tapez votre message en HTML ici...\n\nExemple:\n<h1>Titre</h1>\n<p>Paragraphe avec <strong>texte en gras</strong></p>\n<a href='https://example.com'>Lien</a>"
                  : "Tapez votre message ici...\n\nVous pouvez utiliser plusieurs lignes.\nLes retours à la ligne seront conservés dans l'email."
                }
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent resize-y font-mono"
              />
              <p className="mt-2 text-sm text-gray-500">
                {isHtmlMode 
                  ? 'Mode HTML activé : vous pouvez utiliser des balises HTML pour formater votre message.'
                  : 'Les retours à la ligne seront automatiquement convertis en sauts de ligne dans l\'email.'
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={loadPreview}
                disabled={loadingPreview || !emailSubject.trim() || !emailBody.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loadingPreview ? 'Chargement...' : '👁️ Prévisualiser'}
              </button>
              
              <button
                onClick={handleSend}
                disabled={sending || !emailSubject.trim() || !emailBody.trim()}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                {sending ? '⏳ Envoi en cours...' : '🚀 Envoyer aux utilisateurs validés'}
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
                <p>Remplissez le sujet et le corps du mail, puis cliquez sur "Prévisualiser"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
