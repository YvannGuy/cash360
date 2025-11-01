'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/AdminSidebar'

export default function AdminMigrationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const applyMigrations = async () => {
    setLoading(true)
    setMessage('')
    setError('')
    
    try {
      const response = await fetch('/api/admin/apply-migrations', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage('✅ Migrations appliquées avec succès!')
      } else {
        setError(`❌ Erreur: ${data.error}`)
      }
    } catch (err) {
      setError(`❌ Erreur lors de l'application: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar activeTab="settings" />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-[9998]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0 ml-2 sm:ml-16 mt-4">
                <button onClick={() => router.push('/')} className="cursor-pointer">
                  <Image src="/images/logo/logofinal.png" alt="Cash360" width={540} height={540} className="h-16 sm:h-32 md:h-42 w-auto hover:opacity-80 transition-opacity duration-200" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#012F4E] mb-2">Migrations Supabase</h1>
            <p className="text-gray-600">Appliquez les migrations de base de données pour créer les tables nécessaires.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#012F4E] mb-4">Tables à créer:</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  formations - Sessions de formation
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  formation_registrations - Inscriptions
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  products - Produits boutique
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  payments - Transactions
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  cart_items - Panier utilisateur
                </li>
              </ul>
            </div>

            {message && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}

            <button
              onClick={applyMigrations}
              disabled={loading}
              className="w-full bg-[#00A1C6] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0089a3] transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Application en cours...
                </>
              ) : (
                'Appliquer les migrations'
              )}
            </button>
          </div>
        </main>

      </div>
    </div>
  )
}

