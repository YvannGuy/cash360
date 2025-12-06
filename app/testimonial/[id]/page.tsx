'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TestimonialSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const testimonialId = params.id as string
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    content: '',
    rating: 5,
    email: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.content.trim()) {
      setError('Veuillez remplir tous les champs obligatoires')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          content: formData.content,
          rating: formData.rating,
          email: formData.email || null
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSubmitted(true)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setError(data.error || 'Erreur lors de la soumission')
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error)
      setError('Erreur lors de la soumission. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Merci pour votre témoignage !</h2>
          <p className="text-gray-600 mb-6">
            Votre témoignage a été soumis avec succès. Il sera publié sur notre site après validation.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers la page d'accueil...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">"</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Partagez votre expérience
          </h1>
          <p className="text-gray-600">
            Votre témoignage nous aide à améliorer nos services
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Votre prénom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Votre nom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (optionnel)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="votre@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (sur 5 étoiles) *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating })}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    rating <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-gray-600">{formData.rating}/5</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre témoignage *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Partagez votre expérience avec Cash360..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length} caractères
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              {submitting ? 'Envoi en cours...' : '✅ Valider et envoyer'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
