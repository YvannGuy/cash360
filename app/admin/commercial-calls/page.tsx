'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import Image from 'next/image'

interface AdminSession {
  isAdmin: boolean
  email: string
  role?: 'admin' | 'commercial'
}

interface Appointment {
  id: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  appointment_date: string
  timezone: string
  duration: number
  zoom_link?: string
  appointment_type: string
  source: string
  status: string
  priority: boolean
  notes?: string
  user_id?: string
  user_email?: string
  followups_count?: number
  payments_count?: number
  total_paid_amount?: number
  created_at: string
  updated_at: string
}

export default function CommercialCallsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [activeView, setActiveView] = useState<'kanban' | 'tableau' | 'agenda' | 'statistiques'>('kanban')
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [appointmentFormData, setAppointmentFormData] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    appointment_date: '',
    appointment_time: '',
    duration: '30',
    appointment_type: 'analysis',
    source: 'manual',
    zoom_link: '',
    priority: false,
    notes: ''
  })
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importStep, setImportStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

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
      loadAppointments()
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

  const loadAppointments = async () => {
    try {
      const response = await fetch('/api/admin/commercial-calls')
      const data = await response.json()
      
      if (data.success) {
        setAppointments(data.appointments || [])
      } else {
        console.error('Erreur lors du chargement des rendez-vous:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_email')
    localStorage.removeItem('admin_role')
    router.push('/admin/login')
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleSaveAppointment = async () => {
    setIsSaving(true)
    try {
      const dateTime = new Date(`${appointmentFormData.appointment_date}T${appointmentFormData.appointment_time}`)
      
      const response = await fetch('/api/admin/commercial-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: appointmentFormData.contact_name,
          contact_email: appointmentFormData.contact_email,
          contact_phone: appointmentFormData.contact_phone || null,
          appointment_date: dateTime.toISOString(),
          duration: parseInt(appointmentFormData.duration),
          appointment_type: appointmentFormData.appointment_type,
          source: appointmentFormData.source,
          zoom_link: appointmentFormData.zoom_link || null,
          priority: appointmentFormData.priority,
          notes: appointmentFormData.notes || null,
          status: 'nouveau'
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowAddModal(false)
        setAppointmentFormData({
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          appointment_date: '',
          appointment_time: '',
          duration: '30',
          appointment_type: 'analysis',
          source: 'manual',
          zoom_link: '',
          priority: false,
          notes: ''
        })
        loadAppointments()
      } else {
        alert('Erreur: ' + (data.error || 'Impossible de créer le rendez-vous'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du rendez-vous')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImportCSV = async () => {
    if (!csvFile) return
    
    setIsSaving(true)
    try {
      // Lire le fichier CSV
      const text = await csvFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('Le fichier CSV est vide ou ne contient que l\'en-tête')
        return
      }

      // Parser la première ligne (en-têtes)
      const headers = parseCSVLine(lines[0])
      const headersLower = headers.map(h => h.toLowerCase().trim())
      
      // Fonction pour trouver l'index d'une colonne (supporte plusieurs variantes)
      const findColumn = (variants: string[]): number => {
        for (const variant of variants) {
          const index = headersLower.findIndex(h => 
            h.includes(variant.toLowerCase()) || variant.toLowerCase().includes(h)
          )
          if (index !== -1) return index
        }
        return -1
      }

      // Identifier les colonnes
      const clientIndex = findColumn(['client', 'contact_name', 'nom', 'name'])
      const emailIndex = findColumn(['email', 'contact_email', 'courriel'])
      const phoneIndex = findColumn(['téléphone', 'telephone', 'phone', 'contact_phone', 'tel'])
      const dateIndex = findColumn(['date', 'appointment_date'])
      const timeIndex = findColumn(['heure', 'time', 'appointment_time'])
      const durationIndex = findColumn(['durée', 'duree', 'duration', 'durée (min)'])
      const typeIndex = findColumn(['type', 'appointment_type', 'type de rendez-vous'])
      const sourceIndex = findColumn(['source'])
      const statusIndex = findColumn(['statut', 'status'])
      const priorityIndex = findColumn(['priorité', 'priorite', 'priority'])
      const zoomIndex = findColumn(['lien zoom', 'zoom_link', 'zoom', 'lien'])
      const notesIndex = findColumn(['notes', 'note', 'commentaire'])

      // Vérifier les colonnes obligatoires
      if (clientIndex === -1 || emailIndex === -1 || dateIndex === -1 || timeIndex === -1) {
        alert('Le fichier CSV doit contenir au minimum les colonnes: Client, Email, Date, Heure')
        return
      }

      // Parser les lignes de données
      const appointments: any[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        
        if (values.length === 0) continue

        try {
          const contactName = values[clientIndex]?.trim()
          const contactEmail = values[emailIndex]?.trim()
          const contactPhone = phoneIndex !== -1 ? values[phoneIndex]?.trim() || null : null
          const dateStr = values[dateIndex]?.trim()
          const timeStr = values[timeIndex]?.trim()
          const duration = durationIndex !== -1 ? parseInt(values[durationIndex]?.trim() || '30') : 30
          const appointmentType = typeIndex !== -1 ? mapAppointmentType(values[typeIndex]?.trim()) : 'analysis'
          const source = sourceIndex !== -1 ? mapSource(values[sourceIndex]?.trim()) : 'calendly'
          const status = statusIndex !== -1 ? mapStatus(values[statusIndex]?.trim()) : 'nouveau'
          const priority = priorityIndex !== -1 ? mapPriority(values[priorityIndex]?.trim()) : false
          const zoomLink = zoomIndex !== -1 ? values[zoomIndex]?.trim() || null : null
          const notes = notesIndex !== -1 ? values[notesIndex]?.trim() || null : null

          // Validation des champs obligatoires
          if (!contactName || !contactEmail || !dateStr || !timeStr) {
            errors.push(`Ligne ${i + 1}: Champs obligatoires manquants (Client, Email, Date, Heure)`)
            continue
          }

          // Parser la date et l'heure
          let appointmentDate: Date
          try {
            // Essayer différents formats de date
            let datePart = dateStr
            // Si format JJ/MM/AAAA, convertir en AAAA-MM-JJ
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/')
              if (parts.length === 3) {
                datePart = `${parts[2]}-${parts[1]}-${parts[0]}`
              }
            }
            
            // Formater l'heure (enlever les secondes si présentes)
            let timePart = timeStr
            if (timePart.includes(':')) {
              const timeParts = timePart.split(':')
              timePart = `${timeParts[0]}:${timeParts[1]}`
            }

            appointmentDate = new Date(`${datePart}T${timePart}`)
            
            if (isNaN(appointmentDate.getTime())) {
              throw new Error('Date invalide')
            }
          } catch (dateError) {
            errors.push(`Ligne ${i + 1}: Format de date/heure invalide (${dateStr} ${timeStr})`)
            continue
          }

          appointments.push({
            contact_name: contactName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            appointment_date: appointmentDate.toISOString(),
            duration,
            appointment_type: appointmentType,
            source,
            status,
            priority,
            zoom_link: zoomLink,
            notes
          })
        } catch (error) {
          errors.push(`Ligne ${i + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        }
      }

      if (appointments.length === 0) {
        alert('Aucun rendez-vous valide trouvé dans le fichier CSV')
        return
      }

      // Créer les rendez-vous
      let successCount = 0
      let errorCount = 0

      for (const appointment of appointments) {
        try {
          const response = await fetch('/api/admin/commercial-calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...appointment,
              timezone: 'Europe/Paris'
            })
          })

          const data = await response.json()
          if (data.success) {
            successCount++
          } else {
            errorCount++
            errors.push(`${appointment.contact_name}: ${data.error || 'Erreur inconnue'}`)
          }
        } catch (error) {
          errorCount++
          errors.push(`${appointment.contact_name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        }
      }

      // Afficher les résultats
      let message = `Import terminé: ${successCount} rendez-vous créé(s)`
      if (errorCount > 0 || errors.length > 0) {
        message += `, ${errorCount} erreur(s)`
        if (errors.length > 0) {
          console.error('Erreurs détaillées:', errors)
        }
      }
      alert(message)

      // Recharger les rendez-vous et fermer le modal
      loadAppointments()
      setShowImportModal(false)
      setCsvFile(null)
      setImportStep(1)
    } catch (error) {
      console.error('Erreur:', error)
      alert(`Erreur lors de l'import CSV: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Fonction helper pour parser une ligne CSV (gère les guillemets)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Double guillemet échappé
          current += '"'
          i++
        } else {
          // Toggle guillemets
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // Nouvelle colonne
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    // Ajouter la dernière colonne
    result.push(current.trim())
    
    return result
  }

  // Fonction helper pour mapper les types de rendez-vous
  const mapAppointmentType = (type: string): string => {
    if (!type) return 'analysis'
    
    const typeLower = type.toLowerCase().trim()
    
    const typeMap: { [key: string]: string } = {
      'analyse financière': 'analysis',
      'analyse': 'analysis',
      'analysis': 'analysis',
      'consultation': 'consultation',
      'suivi': 'followup',
      'capsule 1': 'capsule1',
      'capsule 2': 'capsule2',
      'capsule 3': 'capsule3',
      'capsule 4': 'capsule4',
      'capsule 5': 'capsule5',
      'pack complet': 'pack',
      'pack': 'pack',
      'autre': 'other',
      'other': 'other'
    }
    
    return typeMap[typeLower] || 'analysis'
  }

  // Fonction helper pour mapper les sources
  const mapSource = (source: string): string => {
    if (!source) return 'calendly'
    
    const sourceLower = source.toLowerCase().trim()
    
    const sourceMap: { [key: string]: string } = {
      'calendly': 'calendly',
      'manuel': 'manual',
      'manual': 'manual',
      'whatsapp': 'whatsapp',
      'tiktok': 'tiktok',
      'autre': 'other',
      'other': 'other'
    }
    
    return sourceMap[sourceLower] || 'calendly'
  }

  // Fonction helper pour mapper les statuts
  const mapStatus = (status: string): string => {
    if (!status) return 'nouveau'
    
    const statusLower = status.toLowerCase().trim()
    
    const statusMap: { [key: string]: string } = {
      'nouveau': 'nouveau',
      'new': 'nouveau',
      'confirmé': 'confirme',
      'confirme': 'confirme',
      'confirmed': 'confirme',
      'en cours': 'en_cours',
      'en_cours': 'en_cours',
      'in progress': 'en_cours',
      'terminé': 'termine',
      'termine': 'termine',
      'completed': 'termine',
      'annulé': 'annule',
      'annule': 'annule',
      'cancelled': 'annule'
    }
    
    return statusMap[statusLower] || 'nouveau'
  }

  // Fonction helper pour mapper la priorité
  const mapPriority = (priority: string): boolean => {
    if (!priority) return false
    
    const priorityLower = priority.toLowerCase().trim()
    
    return priorityLower === 'oui' || 
           priorityLower === 'yes' || 
           priorityLower === 'true' || 
           priorityLower === '1' || 
           priorityLower === 'prioritaire'
  }

  const handleExportCSV = () => {
    // Filtrer les rendez-vous selon les filtres actifs
    let filteredAppointments = appointments
    
    if (statusFilter !== 'all') {
      filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter)
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filteredAppointments = filteredAppointments.filter(apt =>
        apt.contact_name?.toLowerCase().includes(searchLower) ||
        apt.contact_email?.toLowerCase().includes(searchLower) ||
        apt.contact_phone?.toLowerCase().includes(searchLower)
      )
    }

    const headers = [
      'Client',
      'Email',
      'Téléphone',
      'Date',
      'Heure',
      'Durée (min)',
      'Type',
      'Source',
      'Statut',
      'Priorité',
      'Lien Zoom',
      'Notes',
      'Date de création',
      'Dernière modification'
    ]
    
    const rows = filteredAppointments.map((appointment: Appointment) => {
      const appointmentDate = appointment.appointment_date ? new Date(appointment.appointment_date) : null
      const createdDate = appointment.created_at ? new Date(appointment.created_at) : null
      const updatedDate = appointment.updated_at ? new Date(appointment.updated_at) : null
      
      // Formatage de la date et heure
      const dateStr = appointmentDate ? appointmentDate.toLocaleDateString('fr-FR') : ''
      const timeStr = appointmentDate ? appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
      
      // Labels pour le type et le statut
      const typeLabels: { [key: string]: string } = {
        'analysis': 'Analyse financière',
        'consultation': 'Consultation',
        'followup': 'Suivi',
        'other': 'Autre'
      }
      
      const statusLabels: { [key: string]: string } = {
        'nouveau': 'Nouveau',
        'confirme': 'Confirmé',
        'en_cours': 'En cours',
        'termine': 'Terminé',
        'annule': 'Annulé'
      }
      
      return [
        appointment.contact_name || '',
        appointment.contact_email || '',
        appointment.contact_phone || '',
        dateStr,
        timeStr,
        appointment.duration?.toString() || '30',
        typeLabels[appointment.appointment_type] || appointment.appointment_type || '',
        appointment.source || '',
        statusLabels[appointment.status] || appointment.status || '',
        appointment.priority ? 'Oui' : 'Non',
        appointment.zoom_link || '',
        appointment.notes || '',
        createdDate ? createdDate.toLocaleString('fr-FR') : '',
        updatedDate ? updatedDate.toLocaleString('fr-FR') : ''
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `appels_rdv_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nouveau':
        return 'bg-blue-100 text-blue-800'
      case 'a_qualifier':
        return 'bg-purple-100 text-purple-800'
      case 'a_relancer':
        return 'bg-orange-100 text-orange-800'
      case 'rdv_confirme':
        return 'bg-green-100 text-green-800'
      case 'no_show':
        return 'bg-red-100 text-red-800'
      case 'paye':
        return 'bg-emerald-100 text-emerald-800'
      case 'cloture':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'nouveau':
        return 'Nouveau'
      case 'a_qualifier':
        return 'À qualifier'
      case 'a_relancer':
        return 'À relancer'
      case 'rdv_confirme':
        return 'RDV confirmé'
      case 'no_show':
        return 'No-show'
      case 'paye':
        return 'Payé'
      case 'cloture':
        return 'Clôturé'
      default:
        return 'Inconnu'
    }
  }

  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'Analyse'
      case 'capsule1':
        return 'Capsule 1'
      case 'capsule2':
        return 'Capsule 2'
      case 'capsule3':
        return 'Capsule 3'
      case 'capsule4':
        return 'Capsule 4'
      case 'capsule5':
        return 'Capsule 5'
      case 'pack':
        return 'Pack'
      default:
        return type
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'calendly':
        return 'Calendly'
      case 'manual':
        return 'Manuel'
      case 'whatsapp':
        return 'WhatsApp'
      case 'tiktok':
        return 'TikTok'
      case 'other':
        return 'Autre'
      default:
        return source
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Statuts pour le Kanban
  const kanbanStatuses = [
    { id: 'nouveau', label: 'Nouveau' },
    { id: 'a_qualifier', label: 'À qualifier' },
    { id: 'a_relancer', label: 'À relancer' },
    { id: 'rdv_confirme', label: 'RDV confirmé' },
    { id: 'no_show', label: 'No-show' },
    { id: 'paye', label: 'Payé' },
    { id: 'cloture', label: 'Clôturé' }
  ]

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
      <AdminSidebar activeTab="commercial-calls" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Bouton hamburger pour mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2"
                aria-label="Ouvrir le menu"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
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
              
              {/* Informations de connexion */}
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#012F4E] mb-2">Appels & RDV</h2>
            <p className="text-gray-600">Gérez vos rendez-vous commerciaux et appels clients</p>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importer CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#FEBE02] text-white rounded-lg hover:bg-[#FEBE02]/90 flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un RDV
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un client, RDV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00A1C6] focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A1C6] cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                {kanbanStatuses.map(status => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Sous-navigation */}
          <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveView('kanban')}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeView === 'kanban'
                    ? 'border-[#00A1C6] text-[#00A1C6]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Kanban
              </button>
              <button
                onClick={() => setActiveView('tableau')}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeView === 'tableau'
                    ? 'border-[#00A1C6] text-[#00A1C6]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Tableau
              </button>
              <button
                onClick={() => setActiveView('agenda')}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeView === 'agenda'
                    ? 'border-[#00A1C6] text-[#00A1C6]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Agenda
              </button>
              <button
                onClick={() => setActiveView('statistiques')}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeView === 'statistiques'
                    ? 'border-[#00A1C6] text-[#00A1C6]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistiques
              </button>
          </div>

          {/* Views Content */}
          <div>
          {/* Vue Kanban */}
          {activeView === 'kanban' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#012F4E]">Pipeline des rendez-vous</h2>
              </div>
              
              <div className="grid grid-cols-7 gap-4 overflow-x-auto pb-6">
                {kanbanStatuses.map(status => {
                  const statusAppointments = filteredAppointments.filter(a => a.status === status.id)
                  return (
                    <div key={status.id} className="min-w-[280px] bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">{status.label}</h3>
                        <span className="bg-white text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                          {statusAppointments.length}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {statusAppointments.map(appointment => (
                          <div key={appointment.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-move">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm">{appointment.contact_name}</h4>
                                <p className="text-xs text-gray-600 truncate">{appointment.contact_email}</p>
                              </div>
                              {appointment.priority && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium ml-2">
                                  Prioritaire
                                </span>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-600 mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(appointment.appointment_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {getSourceLabel(appointment.source)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.appointment_type)}`}>
                                {getAppointmentTypeLabel(appointment.appointment_type)}
                              </span>
                            </div>
                            
                            {appointment.status === 'a_relancer' && (
                              <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium mb-3">
                                À relancer
                              </span>
                            )}
                            
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                              <button className="flex-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Appel
                              </button>
                              <button className="flex-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 transition-colors flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email
                              </button>
                              <button className="flex-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100 transition-colors flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Relance
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {statusAppointments.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            Aucun RDV
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Vue Tableau */}
          {activeView === 'tableau' && (
            <div className={`space-y-6 ${showDetailPanel ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}`}>
              <div className={showDetailPanel ? 'lg:col-span-2' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[#012F4E]">Liste détaillée des rendez-vous</h2>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Client</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Tél.</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Date/Heure</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Objet</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Source</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Paiement</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-gray-500">
                            Aucun rendez-vous trouvé
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-[#00A1C6] flex items-center justify-center text-white font-medium text-sm">
                                  {getInitials(appointment.contact_name)}
                                </div>
                                <div className="font-medium text-gray-900">{appointment.contact_name}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">{appointment.contact_email}</td>
                            <td className="py-4 px-6 text-sm text-gray-600">{appointment.contact_phone || '—'}</td>
                            <td className="py-4 px-6 text-sm text-gray-600">{formatDate(appointment.appointment_date)}</td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.appointment_type)}`}>
                                {getAppointmentTypeLabel(appointment.appointment_type)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">{getSourceLabel(appointment.source)}</td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {appointment.total_paid_amount ? (
                                <span className="text-green-600 font-medium">
                                  {(appointment.total_paid_amount as number).toFixed(2)} €
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedAppointment(appointment)
                                    setShowDetailPanel(true)
                                  }}
                                  title="Voir détails"
                                  className="text-gray-400 hover:text-[#00A1C6] transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
              
              {/* Panel latéral de détails */}
              {showDetailPanel && selectedAppointment && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#012F4E]">Détail RDV</h3>
                    <button
                      onClick={() => setShowDetailPanel(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Informations contact */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-700">{selectedAppointment.contact_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{selectedAppointment.contact_email}</span>
                        </div>
                        {selectedAppointment.contact_phone && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm text-gray-700">{selectedAppointment.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* RDV */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Rendez-vous</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{formatDate(selectedAppointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">{selectedAppointment.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-sm text-gray-700">{getSourceLabel(selectedAppointment.source)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Statut */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Statut</h4>
                      <div className="space-y-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                          {getStatusLabel(selectedAppointment.status)}
                        </span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.appointment_type)} ml-2`}>
                          {getAppointmentTypeLabel(selectedAppointment.appointment_type)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Paiement */}
                    {selectedAppointment.total_paid_amount && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Paiement</h4>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-lg font-bold text-green-600">
                            {(selectedAppointment.total_paid_amount as number).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions rapides */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Actions rapides</h4>
                      <div className="space-y-2">
                        <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors text-sm">
                          📞 Appeler
                        </button>
                        <button className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors text-sm">
                          ✉️ Email
                        </button>
                        {selectedAppointment.zoom_link && (
                          <button
                            onClick={() => window.open(selectedAppointment.zoom_link, '_blank')}
                            className="w-full px-4 py-2 bg-[#FEBE02] text-white rounded-lg hover:bg-[#FEBE02]/90 font-medium transition-colors text-sm"
                          >
                            🔗 Rejoindre Zoom
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vue Agenda */}
          {activeView === 'agenda' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#012F4E]">Calendrier des rendez-vous</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendrier de la semaine */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-[#012F4E]">Cette semaine</h3>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button className="p-2 rounded-lg hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {filteredAppointments.map((appointment) => (
                      <div key={appointment.id} className="border-l-4 border-[#00A1C6] bg-blue-50 p-4 rounded-r-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{appointment.contact_name}</h4>
                            <p className="text-sm text-gray-600">{formatDate(appointment.appointment_date)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {filteredAppointments.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        Aucun rendez-vous cette semaine
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Légende et actions rapides */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-[#012F4E] mb-4">Statut</h3>
                    <div className="space-y-2">
                      {kanbanStatuses.map(status => (
                        <div key={status.id} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.id === 'nouveau' ? 'bg-blue-500' : status.id === 'rdv_confirme' ? 'bg-green-500' : status.id === 'no_show' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                          <span className="text-sm text-gray-700">{status.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#00A1C6] to-[#012F4E] rounded-lg shadow-sm p-6 text-white">
                    <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-full px-4 py-2 bg-white text-[#012F4E] rounded-lg hover:bg-gray-100 font-medium transition-colors mb-2"
                    >
                      Nouveau RDV
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="w-full px-4 py-2 border-2 border-white text-white rounded-lg hover:bg-white hover:text-[#012F4E] font-medium transition-colors"
                    >
                      Importer CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vue Statistiques */}
          {activeView === 'statistiques' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#012F4E]">Statistiques et performances</h2>
              </div>
              
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{appointments.length}</h3>
                  <p className="text-sm text-gray-600 mt-1">RDV planifiés</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {appointments.filter(a => a.status === 'no_show').length}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Taux de no-show</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {appointments.length > 0 ? Math.round((appointments.filter(a => a.status === 'paye').length / appointments.length) * 100) : 0}%
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Taux de conversion</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {appointments.filter(a => a.total_paid_amount).reduce((sum, a) => sum + (a.total_paid_amount as number), 0).toFixed(0)} €
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Revenus associés</p>
                </div>
              </div>
              
              {/* Sources et Types */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-[#012F4E] mb-4">Top sources</h3>
                  <div className="space-y-4">
                    {['calendly', 'manual', 'whatsapp', 'tiktok', 'other'].map(source => {
                      const count = appointments.filter(a => a.source === source).length
                      const percentage = appointments.length > 0 ? (count / appointments.length) * 100 : 0
                      return (
                        <div key={source} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{getSourceLabel(source)}</span>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#00A1C6] h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-[#012F4E] mb-4">Répartition par type</h3>
                  <div className="space-y-4">
                    {['analysis', 'capsule1', 'capsule2', 'capsule3', 'capsule4', 'capsule5', 'pack'].map(type => {
                      const count = appointments.filter(a => a.appointment_type === type).length
                      const percentage = appointments.length > 0 ? (count / appointments.length) * 100 : 0
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{getAppointmentTypeLabel(type)}</span>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#FEBE02] h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Modal Ajouter/Éditer RDV */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#012F4E]">Ajouter un RDV</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={appointmentFormData.contact_name}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, contact_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={appointmentFormData.contact_email}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={appointmentFormData.contact_phone}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                </div>
                
                {/* RDV */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={appointmentFormData.appointment_date}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, appointment_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                    <input
                      type="time"
                      value={appointmentFormData.appointment_time}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, appointment_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                    <select
                      value={appointmentFormData.duration}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1h</option>
                    </select>
                  </div>
                </div>
                
                {/* Type et Source */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={appointmentFormData.appointment_type}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, appointment_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                      required
                    >
                      <option value="analysis">Analyse financière</option>
                      <option value="capsule1">Capsule 1</option>
                      <option value="capsule2">Capsule 2</option>
                      <option value="capsule3">Capsule 3</option>
                      <option value="capsule4">Capsule 4</option>
                      <option value="capsule5">Capsule 5</option>
                      <option value="pack">Pack complet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
                    <select
                      value={appointmentFormData.source}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                      required
                    >
                      <option value="calendly">Calendly</option>
                      <option value="manual">Manuel</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="tiktok">TikTok</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lien Zoom</label>
                  <input
                    type="url"
                    value={appointmentFormData.zoom_link}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, zoom_link: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={appointmentFormData.notes}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1C6]"
                    placeholder="Notes internes..."
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={appointmentFormData.priority}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, priority: e.target.checked })}
                    className="w-4 h-4 text-[#00A1C6] rounded focus:ring-[#00A1C6]"
                  />
                  <label className="text-sm font-medium text-gray-700">Marquer comme prioritaire</label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveAppointment}
                  disabled={isSaving || !appointmentFormData.contact_name || !appointmentFormData.contact_email || !appointmentFormData.appointment_date || !appointmentFormData.appointment_time}
                  className="px-4 py-2 bg-[#FEBE02] text-white rounded-lg hover:bg-[#FEBE02]/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Création...' : 'Créer le RDV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#012F4E]">Importer CSV (Calendly)</h3>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {importStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Étape 1 : Charger le fichier CSV</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#00A1C6] transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setCsvFile(file)
                            setImportStep(2)
                          }
                        }}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-700 font-medium">Cliquez pour télécharger un fichier CSV</p>
                        <p className="text-sm text-gray-500 mt-1">Format accepté: CSV Calendly</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              {importStep === 2 && csvFile && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Étape 2 : Prévisualisation</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-green-900">Fichier chargé : {csvFile.name}</p>
                        <p className="text-sm text-green-700 mt-1">
                          Votre fichier CSV Calendly sera importé avec les rendez-vous disponibles.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Étape 3 : Configuration</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#00A1C6] rounded focus:ring-[#00A1C6]" />
                        <span className="text-sm text-gray-700">Ignorer les doublons basés sur l'email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#00A1C6] rounded focus:ring-[#00A1C6]" />
                        <span className="text-sm text-gray-700">Créer les utilisateurs manquants automatiquement</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 text-[#00A1C6] rounded focus:ring-[#00A1C6]" />
                        <span className="text-sm text-gray-700">Marquer les rendez-vous comme 'Autre' source</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setCsvFile(null)
                    setImportStep(1)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Annuler
                </button>
                {importStep === 2 && (
                  <button
                    onClick={handleImportCSV}
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#FEBE02] text-white rounded-lg hover:bg-[#FEBE02]/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Import en cours...' : 'Importer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

