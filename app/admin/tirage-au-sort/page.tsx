'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import Image from 'next/image'

interface RaffleEntry {
  id: string
  first_name: string
  last_name: string
  email: string
  message: string | null
  created_at: string
}

export default function AdminTirageAuSortPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<RaffleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [winner, setWinner] = useState<RaffleEntry | null>(null)
  const [adminSession, setAdminSession] = useState<any>(null)

  const loadEntries = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/raffle')
      const data = await response.json()
      
      if (data.success) {
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Erreur chargement entries:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Vérifier la session admin
    const checkAdminSession = () => {
      const adminSessionData = localStorage.getItem('admin_session')
      const adminEmail = localStorage.getItem('admin_email')
      const adminRole = localStorage.getItem('admin_role')
      
      if (adminSessionData === 'true' && adminEmail) {
        setAdminSession({ isAdmin: true, email: adminEmail, role: adminRole as 'admin' | 'commercial' })
        if (adminRole === 'commercial') {
          router.push('/admin/commercial-calls')
        } else {
          loadEntries()
        }
      } else {
        router.push('/admin/login')
        return
      }
      setLoading(false)
    }

    checkAdminSession()
  }, [router, loadEntries])

  const handleDraw = async () => {
    if (entries.length === 0) {
      alert('Aucune inscription disponible pour le tirage au sort')
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir tirer au sort parmi ${entries.length} participant(s) ?`)) {
      return
    }

    setDrawing(true)
    setWinner(null)

    try {
      const response = await fetch('/api/admin/raffle/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success && data.winner) {
        setWinner(data.winner)
      } else {
        alert(data.error || 'Erreur lors du tirage au sort')
      }
    } catch (error) {
      console.error('Erreur tirage au sort:', error)
      alert('Erreur lors du tirage au sort')
    } finally {
      setDrawing(false)
    }
  }

  const handleResetDraw = () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser le tirage au sort ? Le gagnant actuel sera effacé.')) {
      return
    }
    setWinner(null)
  }

  const handleDeleteEntry = async (entryId: string, entryName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${entryName} de la liste des participants ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/raffle?id=${entryId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Recharger la liste des participants
        await loadEntries()
        // Si le participant supprimé était le gagnant, réinitialiser le gagnant
        if (winner?.id === entryId) {
          setWinner(null)
        }
        alert('Participant supprimé avec succès')
      } else {
        alert(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression participant:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading || !adminSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar activeTab="tirage-au-sort" />
      
      <div className="flex-1 md:ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
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
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Tirage au sort</h1>
            <p className="text-gray-600">
              Gérez les inscriptions et effectuez le tirage au sort du 25 décembre 2025
            </p>
          </div>

          {/* Statistiques */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-[#012F4E]">{entries.length}</div>
                <div className="text-sm text-gray-600 mt-1">Participant(s)</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-[#FEBE02]">
                  {new Date('2025-12-25').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </div>
                <div className="text-sm text-gray-600 mt-1">Date du tirage</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {winner ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Gagnant sélectionné</div>
              </div>
            </div>
          </div>

          {/* Bouton tirer au sort */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#012F4E] mb-2">
                  Effectuer le tirage au sort
                </h2>
                <p className="text-gray-600">
                  Cliquez sur le bouton ci-dessous pour sélectionner un gagnant au hasard parmi les {entries.length} participant(s)
                </p>
              </div>
              <div className="flex gap-3">
                {winner && (
                  <button
                    onClick={handleResetDraw}
                    className="bg-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Reset le tirage
                  </button>
                )}
                <button
                  onClick={handleDraw}
                  disabled={drawing || entries.length === 0}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold py-3 px-8 rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {drawing ? 'Tirage en cours...' : 'Tirer au sort'}
                </button>
              </div>
            </div>
          </div>

          {/* Gagnant */}
          {winner && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">
                    🎉 Gagnant sélectionné !
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Nom:</strong> {winner.first_name} {winner.last_name}</p>
                    <p><strong>Email:</strong> {winner.email}</p>
                    {winner.message && (
                      <p><strong>Message:</strong> {winner.message}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      Inscrit le {new Date(winner.created_at).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-6xl">🎊</div>
              </div>
            </div>
          )}

          {/* Liste des participants */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#012F4E] mb-4">
              Liste des participants ({entries.length})
            </h2>
            
            {entries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucune inscription pour le moment
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom complet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d'inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id} className={winner?.id === entry.id ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.first_name} {entry.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {entry.message || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteEntry(entry.id, `${entry.first_name} ${entry.last_name}`)}
                            className="text-red-600 hover:text-red-800 font-medium hover:underline"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
