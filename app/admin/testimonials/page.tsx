'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

interface Testimonial {
  id: string
  first_name: string
  last_name: string
  content: string
  rating: number
  status: 'pending' | 'approved' | 'rejected'
  email?: string
  created_at: string
  approved_at?: string
}

export default function AdminTestimonialsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
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
      loadTestimonials()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSession, statusFilter])

  const loadTestimonials = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/testimonials'
        : `/api/admin/testimonials?status=${statusFilter}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setTestimonials(data.testimonials || [])
      } else {
        console.error('Erreur lors du chargement:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des témoignages:', error)
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: newStatus,
          approvedByEmail: adminSession?.email
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTestimonials()
      } else {
        alert('Erreur: ' + data.error)
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/testimonials?id=${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTestimonials()
      } else {
        alert('Erreur: ' + data.error)
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approuvé'
      case 'pending':
        return 'En attente'
      case 'rejected':
        return 'Rejeté'
      default:
        return status
    }
  }

  const copyLink = () => {
    // Générer un ID unique pour le lien de soumission
    const submissionId = `submit-${Date.now()}`
    const link = `${window.location.origin}/testimonial/${submissionId}`
    navigator.clipboard.writeText(link)
    alert('Lien de soumission copié dans le presse-papiers !\n\nEnvoyez ce lien à vos clients pour qu\'ils puissent soumettre leur témoignage.')
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

  const filteredTestimonials = testimonials

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab="testimonials"
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
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  💬 Témoignages clients
                </h1>
                <p className="text-gray-600">
                  Gérez les témoignages des clients qui seront affichés sur la homepage
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  title="Copier le lien de soumission de témoignage"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier lien soumission
                </button>
              <button
                onClick={loadTestimonials}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvés</option>
                  <option value="rejected">Rejetés</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                {filteredTestimonials.length} témoignage{filteredTestimonials.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Liste des témoignages */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredTestimonials.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Aucun témoignage trouvé</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {testimonial.first_name} {testimonial.last_name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testimonial.status)}`}>
                            {getStatusLabel(testimonial.status)}
                          </span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3 italic">"{testimonial.content}"</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {testimonial.email && (
                            <span>📧 {testimonial.email}</span>
                          )}
                          <span>📅 {new Date(testimonial.created_at).toLocaleDateString('fr-FR')}</span>
                          {testimonial.approved_at && (
                            <span>✅ Approuvé le {new Date(testimonial.approved_at).toLocaleDateString('fr-FR')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {testimonial.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(testimonial.id, 'approved')}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              ✅ Approuver
                            </button>
                            <button
                              onClick={() => handleStatusChange(testimonial.id, 'rejected')}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              ❌ Rejeter
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(testimonial.id)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
