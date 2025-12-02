'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'

export default function SectionAnalyse() {
  const { t } = useLanguage()
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

    const element = document.getElementById('section-analyse')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const featuredProducts = (t.sectionAnalyse?.featuredProducts || [])
    .filter((product: any) => {
      const title = product.title?.toLowerCase() || ''
      // Masquer "Les combats liés à la prospérité" et ses traductions
      const battlesTitles = [
        'les combats liés à la prospérité',
        'battles related to prosperity',
        'las batallas relacionadas con la prosperidad',
        'as batalhas relacionadas à prosperidade'
      ]
      // Masquer "Analyse financière" et ses traductions
      const analysisTitles = [
        'analyse financière',
        'financial analysis',
        'análisis financiero',
        'análise financeira'
      ]
      return !battlesTitles.some(t => title.includes(t.toLowerCase())) && 
             !analysisTitles.some(t => title.includes(t.toLowerCase()))
    })
    .map((product: any, index: number) => ({
      id: index + 1,
      title: product.title,
      category: product.category,
      image: index === 0 ? "/images/stab.jpg" : index === 1 ? "/images/logo/capsule4.jpg" : "/images/logo/money1.png",
      description: product.description
    }))

  return (
    <section
      id="section-analyse"
      className={`py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Titre de la section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t.sectionAnalyse?.featuredTitle || 'Produit à la une'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.sectionAnalyse?.featuredDescription || 'Découvrez nos produits phares pour transformer votre vie financière'}
            </p>
          </div>

          {/* Grille de 3 cartes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 flex flex-col"
              >
                {/* Image */}
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-110"
                  />
                  {/* Badge catégorie */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#D4AF37] text-[#0B1B2B] px-3 py-1 rounded-full text-xs font-semibold">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed flex-1">
                    {product.description}
                  </p>
                  
                  {/* Bouton CTA aligné en bas */}
                  <Link
                    href={product.category?.toLowerCase() === 'analyse' ? "/analyse-financiere" : "https://www.cash360.finance/login"}
                    className="block w-full text-center bg-[#D4AF37] text-[#0B1B2B] font-semibold py-3 px-6 rounded-lg hover:bg-[#C5A028] transition-all duration-300 transform hover:scale-105 shadow-md mt-auto"
                  >
                    {product.category?.toLowerCase() === 'analyse'
                      ? (t.sectionAnalyse?.launchButton || "Je lance mon analyse")
                      : (t.sectionAnalyse?.ctaButton || "Je m'inscris")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
