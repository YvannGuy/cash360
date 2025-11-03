'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  is_pack: boolean
  image_url: string | null
  available: boolean
  is_one_time: boolean
  product_type?: string | null
  capsule_id?: string | null
  created_at: string
  updated_at: string
}

export default function AdminBoutiquePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 9 // 3 colonnes × 3 lignes
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    isPack: false,
    imageUrl: '',
    available: true,
    isOneTime: true,
    productType: '',
    capsuleId: '',
    category: 'capsules', // Catégorie du produit
    pdfFile: null as File | null // Fichier PDF pour ebook
  })
  const [uploadingPdf, setUploadingPdf] = useState(false)

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
      loadProducts()
    }
  }, [adminSession])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAdminMenu) {
        const target = event.target as Element
        if (!target.closest('.admin-menu-container')) {
          setShowAdminMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAdminMenu])

  const loadProducts = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/products')
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.products || [])
        console.log('Produits chargés:', data.products?.length || 0)
      } else {
        console.error('Erreur lors du chargement des produits:', data.error)
        alert('Erreur lors du chargement des produits: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error)
      alert('Erreur lors du chargement des produits')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_email')
    router.push('/admin/login')
  }

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const handleOpenModalForNew = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      isPack: false,
      imageUrl: '',
      available: true,
      isOneTime: true,
      productType: '',
      capsuleId: '',
      category: 'capsules', // Catégorie par défaut
      pdfFile: null
    })
    setShowProductModal(true)
  }

  const handleOpenModalForEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      originalPrice: product.original_price?.toString() || '',
      isPack: product.is_pack,
      imageUrl: product.image_url || '',
      available: product.available,
      isOneTime: product.is_one_time !== false,
      productType: product.product_type || '',
      capsuleId: product.capsule_id || '',
      category: (product as any).category || 'capsules', // Récupérer la catégorie du produit
      pdfFile: null // Reset le fichier PDF lors de l'édition
    })
    setShowProductModal(true)
  }

  const handleSaveProduct = async () => {
    try {
      if (!formData.name || !formData.price) {
        alert('Veuillez remplir tous les champs obligatoires (Nom, Prix)')
        return
      }

      // Pour ebook, vérifier qu'un PDF est fourni (sauf si édition et PDF déjà existant)
      const isEdit = !!editingProduct
      if (formData.category === 'ebook' && !formData.pdfFile && !isEdit) {
        alert('Veuillez télécharger un fichier PDF pour un ebook')
        return
      }

      const url = isEdit 
        ? `/api/admin/products?productId=${editingProduct.id}`
        : '/api/admin/products'
      
      const method = isEdit ? 'PUT' : 'POST'

      // Pour l'édition : si PDF existant et pas de nouveau PDF, utiliser l'existant
      let pdfUrl = null
      if (isEdit && formData.category === 'ebook') {
        pdfUrl = (editingProduct as any).pdf_url || null
      }

      // Créer/mettre à jour le produit d'abord
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          isPack: formData.isPack,
          imageUrl: formData.imageUrl || null,
          available: formData.available,
          isOneTime: formData.isOneTime,
          productType: formData.productType || null,
          capsuleId: formData.capsuleId || null,
          appearsInFormations: true, // Par défaut true - tous les produits apparaissent dans "Mes achats" selon leur catégorie
          category: formData.category || 'capsules', // Catégorie du produit
          pdfUrl: pdfUrl // URL du PDF pour ebook (sera mis à jour après upload si nouveau PDF)
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      // Si c'est un ebook et qu'un nouveau PDF est fourni, l'uploader maintenant (après création du produit)
      if (formData.category === 'ebook' && formData.pdfFile) {
        setUploadingPdf(true)
        try {
          const productId = isEdit ? editingProduct.id : data.product.id
          const uploadFormData = new FormData()
          uploadFormData.append('pdf', formData.pdfFile)
          uploadFormData.append('productId', productId)

          const uploadResponse = await fetch('/api/admin/upload-ebook-pdf', {
            method: 'POST',
            body: uploadFormData
          })

          const uploadData = await uploadResponse.json()

          if (!uploadResponse.ok || !uploadData.success) {
            throw new Error(uploadData.error || 'Erreur lors de l\'upload du PDF')
          }

          // Mettre à jour le produit avec l'URL du PDF
          const updateResponse = await fetch(`/api/admin/products?productId=${productId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: formData.name,
              description: formData.description || null,
              price: parseFloat(formData.price),
              originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
              isPack: formData.isPack,
              imageUrl: formData.imageUrl || null,
              available: formData.available,
              isOneTime: formData.isOneTime,
              productType: formData.productType || null,
              capsuleId: formData.capsuleId || null,
              appearsInFormations: true,
              category: formData.category || 'capsules',
              pdfUrl: uploadData.pdfUrl // Mettre à jour avec l'URL du PDF uploadé
            })
          })

          const updateData = await updateResponse.json()
          if (!updateResponse.ok || !updateData.success) {
            console.error('Erreur lors de la mise à jour du PDF:', updateData.error)
          }

          pdfUrl = uploadData.pdfUrl
          console.log('PDF uploadé avec succès:', pdfUrl)
        } catch (error) {
          console.error('Erreur upload PDF:', error)
          alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload du PDF')
          setUploadingPdf(false)
          return
        } finally {
          setUploadingPdf(false)
        }
      }

      // Afficher un message d'avertissement si la formation n'a pas pu être créée
      if (data.warning) {
        console.warn('Avertissement:', data.warning)
        alert(`Produit créé avec succès mais: ${data.warning}`)
      } else if (data.formationCreated) {
        console.log('Produit et formation créés avec succès')
        alert(isEdit ? 'Produit modifié avec succès!' : 'Produit créé avec succès! La formation associée a été créée et apparaîtra dans "Formations et Sessions".')
      } else {
        alert(isEdit ? 'Produit modifié avec succès!' : 'Produit créé avec succès!')
      }
      setShowProductModal(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        isPack: false,
        imageUrl: '',
        available: true,
        isOneTime: true,
        productType: '',
        capsuleId: '',
        category: 'capsules',
        pdfFile: null
      })
      loadProducts()
      // Réinitialiser à la première page après ajout/modification
      setCurrentPage(1)
      
      // Si ce n'est pas une édition, le produit vient d'être créé et une formation associée a été créée
      // Un message informatif pourrait être affiché, mais la formation sera visible dans Formations et Sessions
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
      setUploadingPdf(false)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products?productId=${product.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      alert('Produit supprimé avec succès!')
      loadProducts()
      // Ajuster la page si nécessaire après suppression
      const totalPagesAfterDelete = Math.ceil((products.length - 1) / productsPerPage)
      if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        setCurrentPage(totalPagesAfterDelete)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    )
  }

  if (!adminSession?.isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <AdminSidebar activeTab="boutique" />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex-shrink-0 ml-2 sm:ml-16 mt-4">
                <button
                  onClick={() => router.push('/')}
                  className="cursor-pointer"
                >
                  <Image
                    src="/images/logo/logofinal.png"
                    alt="Cash360"
                    width={540}
                    height={540}
                    className="h-16 sm:h-32 md:h-42 w-auto hover:opacity-80 transition-opacity duration-200"
                  />
                </button>
              </div>
              
              {/* Theme & Informations de connexion */}
              <div className="flex items-center gap-3 mr-2 sm:mr-20">
                {adminSession && (
                  <div className="flex items-center gap-1 sm:gap-3">
                    <div className="relative admin-menu-container z-[9999]">
                      <button
                        onClick={() => setShowAdminMenu(!showAdminMenu)}
                        className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {getInitials(adminSession.email)}
                        </span>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showAdminMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]">
                          <button
                            onClick={() => {
                              router.push('/admin/dashboard')
                              setShowAdminMenu(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Mon compte
                          </button>
                          <button
                            onClick={() => {
                              handleSignOut()
                              setShowAdminMenu(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Se déconnecter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {/* Page Title */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Boutique</h1>
              <p className="text-gray-600">Gérez les produits de la boutique Cash360 : capsules, formations et packs.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={loadProducts}
                disabled={refreshing}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg 
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
              <button 
                onClick={handleOpenModalForNew}
                className="bg-[#FEBE02] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e6a802] transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un produit
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {/* Calculs de pagination */}
          {(() => {
            const totalPages = Math.ceil(products.length / productsPerPage)
            const startIndex = (currentPage - 1) * productsPerPage
            const endIndex = startIndex + productsPerPage
            const currentProducts = products.slice(startIndex, endIndex)
            
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {currentProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {!product.available && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Indisponible
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <div className="flex gap-1">
                      {product.product_type && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {product.product_type}
                        </span>
                      )}
                      {product.is_pack && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Pack
                        </span>
                      )}
                      {product.is_one_time === false && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Illimité
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    {product.original_price ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-blue-600">{product.price.toFixed(2)} €</span>
                        <span className="text-sm text-gray-400 line-through">{product.original_price.toFixed(2)} €</span>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">
                          -{Math.round((1 - product.price / product.original_price) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-blue-600">{product.price.toFixed(2)} €</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModalForEdit(product)}
                      className="flex-1 px-4 py-2 bg-[#00A1C6] text-white rounded-lg hover:bg-[#0089a3] transition-colors font-medium"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
                  ))}
                </div>
                
                {/* Contrôles de pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Précédent
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-[#00A1C6] text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Suivant
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <span className="text-sm text-gray-600 ml-4">
                      Page <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{totalPages}</span>
                      {' • '}
                      <span className="font-medium">{Math.min(endIndex, products.length)}</span> sur{' '}
                      <span className="font-medium">{products.length}</span> produit{products.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </>
            )
          })()}

          {products.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun produit</h3>
              <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un nouveau produit à la boutique.</p>
              <div className="mt-6">
                <button
                  onClick={handleOpenModalForNew}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#FEBE02] hover:bg-[#e6a802]"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un produit
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-[#012F4E]">
                  {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Formation avancée en investissement"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Décrivez le produit..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                </div>

                {/* Price & Original Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix original (pour promo)
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Image
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="/images/product.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({...formData, category: e.target.value, pdfFile: null})
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  >
                    <option value="capsules">Capsules</option>
                    <option value="analyse-financiere">Analyse financière</option>
                    <option value="pack">Pack</option>
                    <option value="ebook">Ebook (Produits à venir très bientôt)</option>
                    <option value="abonnement">Abonnement (Produits à venir très bientôt)</option>
                  </select>
                </div>

                {/* PDF Upload pour ebook */}
                {formData.category === 'ebook' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fichier PDF *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.type !== 'application/pdf') {
                            alert('Veuillez sélectionner un fichier PDF uniquement.')
                            return
                          }
                          if (file.size > 50 * 1024 * 1024) { // 50MB limit
                            alert('Le fichier doit faire moins de 50MB.')
                            return
                          }
                          setFormData({...formData, pdfFile: file})
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    />
                    {formData.pdfFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Fichier sélectionné: {formData.pdfFile.name} ({(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    {editingProduct && (editingProduct as any).pdf_url && (
                      <p className="mt-2 text-sm text-green-600">
                        PDF actuel: <a href={(editingProduct as any).pdf_url} target="_blank" rel="noopener noreferrer" className="underline">Voir le PDF actuel</a>
                      </p>
                    )}
                  </div>
                )}


                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPack}
                      onChange={(e) => setFormData({...formData, isPack: e.target.checked})}
                      className="rounded border-gray-300 text-[#00A1C6] focus:ring-[#00A1C6]"
                    />
                    <span className="text-sm text-gray-700">Produit de type "Pack"</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isOneTime}
                      onChange={(e) => setFormData({...formData, isOneTime: e.target.checked})}
                      className="rounded border-gray-300 text-[#00A1C6] focus:ring-[#00A1C6]"
                    />
                    <span className="text-sm text-gray-700">Achat unique (cocher) / Achat illimité (décoché)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({...formData, available: e.target.checked})}
                      className="rounded border-gray-300 text-[#00A1C6] focus:ring-[#00A1C6]"
                    />
                    <span className="text-sm text-gray-700">Disponible à la vente</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-gray-200 flex gap-4">
                <button
                  onClick={() => {
                    setShowProductModal(false)
                    setEditingProduct(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={uploadingPdf}
                  className="flex-1 px-4 py-2 bg-[#00A1C6] text-white rounded-lg font-medium hover:bg-[#0089a3] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPdf ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

