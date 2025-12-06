'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

interface Testimonial {
  id: string
  first_name: string
  last_name: string
  content: string
  rating: number
  created_at: string
}

export default function Testimonials() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ne créer l'observer que si des témoignages sont disponibles
    if (testimonials.length === 0 && !loading) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('testimonials')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [testimonials.length, loading])

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials')
        const data = await response.json()
        
        if (data.success) {
          setTestimonials(data.testimonials || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des témoignages:', error)
        // En cas d'erreur, utiliser les témoignages par défaut depuis les traductions
        setTestimonials([])
      } finally {
        setLoading(false)
      }
    }

    loadTestimonials()
  }, [])

  // Utiliser uniquement les témoignages de la DB (approuvés)
  const displayTestimonials = testimonials.slice(0, 4).map((t) => ({
    name: `${t.first_name} ${t.last_name}`,
    content: t.content,
    role: 'Client Cash360',
    rating: t.rating
  }))

  // Masquer la section si aucun témoignage n'est disponible
  if (!loading && testimonials.length === 0) {
    return null
  }

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {t.testimonials?.title || 'Témoignages'}{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              {t.testimonials?.titleHighlight || 'clients'}
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.testimonials?.subtitle || 'Découvrez ce que nos clients disent de nous'}
          </p>
        </div>

        {/* Testimonials Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des témoignages...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`group transition-all duration-1000 delay-${index * 200} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="bg-gray-50 rounded-2xl p-6 h-full flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">"</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < (testimonial.rating || 5) ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>★</span>
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 text-center mb-6 flex-grow italic">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
