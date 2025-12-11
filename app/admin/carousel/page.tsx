'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'
import CarouselPopup from '@/components/CarouselPopup'

interface CarouselItem {
  id: string
  image_url: string
  redirect_url: string
  title?: string
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface AdminSession {
  isAdmin: boolean
  email: string
}

export default function AdminCarouselPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [items, setItems] = useState<CarouselItem[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null)
  const [formData, setFormData] = useState({
    image_url: '',
    redirect_url: '',
    title: '',
    display_order: 0,
    is_active: true
  })
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const checkAdminSession = () => {
      const adminSessionData = localStorage.getItem('admin_session')
      const adminEmail = localStorage.getItem('admin_email')
      
      if (adminSessionData === 'true' && adminEmail) {
        setAdminSession({ isAdmin: true, email: adminEmail })
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
      loadItems()
    }
  }, [adminSession])

  const loadItems = async () => {
    try {
      const response = await fetch('/api/admin/carousel')
      const data = await response.json()
      
      if (data.success) {
        // Filtrer les items pour exclure Masterclass
        const filteredItems = (data.items || []).filter((item: CarouselItem) => {
          const imageUrl = item.image_url?.toLowerCase() || ''
          const title = item.title?.toLowerCase() || ''
          const redirectUrl = item.redirect_url?.toLowerCase() || ''
          
          // Exclure Masterclass
          const isMasterclass = imageUrl.includes('masterclass') ||
                               title.includes('masterclass') ||
                               redirectUrl.includes('masterclass')
          return !isMasterclass
        })
        
        // Trier les items par display_order
        const sortedItems = filteredItems.sort((a: CarouselItem, b: CarouselItem) => 
          (a.display_order || 0) - (b.display_order || 0)
        )
        setItems(sortedItems)
      } else {
        console.error('Erreur lors du chargement:', data.error)
        // En cas d'erreur, afficher un message à l'utilisateur
        if (data.error?.includes('schema cache') || data.error?.includes('Could not find the table')) {
          console.warn('Table carousel_items non trouvée dans le cache. Les items par défaut seront utilisés.')
          // Les items par défaut sont déjà retournés par l'API en cas d'erreur
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingItem 
        ? '/api/admin/carousel'
        : '/api/admin/carousel'
      
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem
        ? { id: editingItem.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      
      if (data.success) {
        await loadItems()
        setShowAddModal(false)
        setEditingItem(null)
        resetForm()
      } else {
        alert('Erreur: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (item: CarouselItem) => {
    setEditingItem(item)
    setFormData({
      image_url: item.image_url,
      redirect_url: item.redirect_url,
      title: item.title || '',
      display_order: item.display_order,
      is_active: item.is_active
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/carousel?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        await loadItems()
      } else {
        alert('Erreur: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      image_url: '',
      redirect_url: '',
      title: '',
      display_order: items.length,
      is_active: true
    })
  }

  const handleAddNew = () => {
    resetForm()
    setEditingItem(null)
    setShowAddModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!adminSession?.isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar activeTab="carousel" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex-shrink-0 ml-2 sm:ml-16 mt-4">
                <button onClick={() => router.push('/')} className="cursor-pointer">
                  <Image
                    src="/images/logo/logofinal.png"
                    alt="Cash360"
                    width={540}
                    height={540}
                    className="h-16 sm:h-32 md:h-42 w-auto hover:opacity-80 transition-opacity duration-200"
                  />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Gestion du Carrousel</h1>
              <p className="text-gray-600">Gérez les images du pop-up carrousel affiché sur le dashboard</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const activeItems = items.filter(item => item.is_active)
                  console.log('[CAROUSEL PREVIEW] Items actifs:', activeItems.length, activeItems)
                  if (activeItems.length > 0) {
                    console.log('[CAROUSEL PREVIEW] Ouverture de la prévisualisation')
                    setShowPreview(true)
                  } else {
                    alert('Aucun item actif à prévisualiser. Veuillez activer au moins un item du carrousel.')
                  }
                }}
                className="bg-[#FEBE02] text-[#012F4E] px-6 py-2 rounded-lg hover:bg-[#e6a802] transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={items.filter(item => item.is_active).length === 0}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Prévisualiser
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Aucun item dans le carrousel</p>
                <button
                  onClick={handleAddNew}
                  className="mt-4 text-[#00A1C6] hover:underline"
                >
                  Ajouter le premier item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative w-full h-48 bg-gray-100">
                      <Image
                        src={item.image_url}
                        alt={item.title || 'Carousel item'}
                        fill
                        className="object-cover"
                      />
                      {!item.is_active && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-medium">Inactif</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{item.title || 'Sans titre'}</h3>
                      <p className="text-sm text-gray-500 mb-2 truncate">{item.redirect_url}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-400">Ordre: {item.display_order}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-[#00A1C6] hover:text-[#012F4E] transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Add/Edit */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#012F4E]">
                {editingItem ? 'Modifier l\'item' : 'Ajouter un item'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingItem(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'image *
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                  placeholder="/images/ebo.png"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de redirection *
                </label>
                <input
                  type="text"
                  value={formData.redirect_url}
                  onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                  placeholder="/admin/boutique?category=ebook"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                  placeholder="Ebook"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
                  >
                    <option value="true">Actif</option>
                    <option value="false">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingItem(null)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#00A1C6] text-white rounded-lg hover:bg-[#012F4E] transition-colors"
                >
                  {editingItem ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prévisualisation du carrousel */}
      {showPreview && items.filter(item => item.is_active).length > 0 && (
        <CarouselPopup
          items={items.filter(item => item.is_active)}
          onClose={() => setShowPreview(false)}
          title="Nouveautés dans votre boutique"
        />
      )}
    </div>
  )
}
