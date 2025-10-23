'use client'

import { useEffect, useState } from 'react'

export default function Testimonials() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
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
  }, [])

  const testimonials = [
    {
      name: "Rachel K.",
      role: "Particulier",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      content: "Grâce à Cash360, j'ai compris mes erreurs financières et retrouvé la paix dans ma gestion. L'approche spirituelle m'a aidée à voir l'argent différemment.",
      rating: 5
    },
    {
      name: "Pasteur Jean-Marc L.",
      role: "Église",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: "L'accompagnement de Myriam a transformé la gestion financière de notre église. Nous avons appris à gérer nos ressources avec sagesse et transparence.",
      rating: 5
    },
    {
      name: "Sarah M.",
      role: "Entrepreneur",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      content: "En tant qu'entrepreneure, j'avais du mal à séparer mes finances personnelles et professionnelles. Cash360 m'a donné les outils pour reprendre le contrôle.",
      rating: 5
    },
    {
      name: "David P.",
      role: "Particulier",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content: "L'analyse de mes relevés bancaires a révélé des dépenses inutiles. Aujourd'hui, j'épargne 30% de plus chaque mois grâce aux conseils reçus.",
      rating: 5
    }
  ]

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Ils ont transformé leur{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              relation à l'argent
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez les témoignages de ceux qui ont retrouvé l'équilibre financier 
            grâce à l'accompagnement Cash360.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
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
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 text-center mb-6 flex-grow italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className={`mt-16 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">200+</div>
                <div className="text-gray-300">Personnes accompagnées</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400 mb-2">95%</div>
                <div className="text-gray-300">Satisfaction client</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400 mb-2">48h</div>
                <div className="text-gray-300">Délai d'analyse</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400 mb-2">15 ans</div>
                <div className="text-gray-300">D'expérience</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}