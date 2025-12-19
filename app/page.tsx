'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import About from '@/components/About'
import Steps from '@/components/Steps'
import Footer from '@/components/Footer'
import CookieConsentBanner from '@/components/CookieConsentBanner'

// Lazy load des composants non critiques pour améliorer le temps de chargement initial
const PremiumSubscription = lazy(() => import('@/components/PremiumSubscription'))
const DashboardTools = lazy(() => import('@/components/DashboardTools'))
const CTASection = lazy(() => import('@/components/CTASection'))
const FAQ = lazy(() => import('@/components/FAQ'))
const Testimonials = lazy(() => import('@/components/Testimonials'))

// Composant de chargement pour le Suspense
const LoadingPlaceholder = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} w-full flex items-center justify-center`}>
    <div className="animate-pulse text-gray-400">Chargement...</div>
  </div>
)

// Composant Nos évènements
function NosEvenements() {
  const events = [
    {
      city: 'Paris',
      country: 'France',
      month: 'Octobre',
      year: '2026',
      image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1200&h=800&fit=crop&q=90&auto=format'
    },
    {
      city: 'Kinshasa',
      country: 'Congo',
      month: 'Février',
      year: '2026',
      image: '/images/kinshasa.jpeg'
    },
    {
      city: 'Abidjan',
      country: 'Côte d\'Ivoire',
      month: 'Mai',
      year: '2026',
      image: '/images/abidjan.jpg'
    },
    {
      city: 'Casablanca',
      country: 'Maroc',
      month: 'Avril',
      year: '2026',
      image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&h=800&fit=crop&q=90&auto=format'
    }
  ]

  return (
    <section id="nos-evenements" className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Cash360 vient au plus près de vous
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Rejoignez-nous lors de nos événements dans les grandes villes pour découvrir nos solutions financières
          </p>
        </div>

        {/* Event Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {events.map((event, index) => (
            <div
              key={index}
              className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              {/* Image de fond */}
              <div className="relative h-64 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.image}
                  alt={`${event.city}, ${event.country}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback si l'image n'existe pas
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                
                {/* Overlay sombre en bas pour le texte */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                  {/* Contenu texte en bas */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{event.city}</h3>
                    <p className="text-white/90 text-sm mb-4">{event.country}</p>
                    
                    {/* Date avec icône calendrier */}
                    <div className="flex items-center gap-2">
                      <svg 
                        className="w-5 h-5 text-red-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                        />
                      </svg>
                      <span className="text-white font-medium">
                        {event.month} {event.year}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <a
            href="/masterclass"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#FEBE02] to-[#FEBE02] text-[#012F4E] font-bold rounded-xl hover:from-[#e6a802] hover:to-[#e6a802] transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Organiser un évènement Cash360
          </a>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { t } = useLanguage()
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    // Désactiver la redirection automatique vers le dashboard
    // L'utilisateur peut naviguer librement entre la homepage et le dashboard
    const checkAuthAndRedirect = async () => {
      // Ne plus rediriger automatiquement vers le dashboard
      // L'utilisateur peut choisir de rester sur la homepage même s'il est connecté
    }

    window.addEventListener('scroll', handleScroll)
    checkAuthAndRedirect()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero />
        
        {/* About Section */}
        <About />
        
        {/* Features Section */}
        <Features />
        
        {/* Steps Section */}
        <Steps />
        
        {/* Premium Subscription Section - Lazy loaded */}
        <Suspense fallback={<LoadingPlaceholder height="h-96" />}>
          <PremiumSubscription />
        </Suspense>
        
        {/* Dashboard Tools Section - Lazy loaded */}
        <Suspense fallback={<LoadingPlaceholder height="h-96" />}>
          <DashboardTools />
        </Suspense>
        
        {/* Section Analyse - Masquée */}
        {/* <SectionAnalyse /> */}
        
        {/* Nos évènements Section */}
        <NosEvenements />
        
        {/* Testimonials Section - Lazy loaded */}
        <Suspense fallback={<LoadingPlaceholder height="h-96" />}>
          <Testimonials />
        </Suspense>
        
        {/* CTA Section - Lazy loaded */}
        <Suspense fallback={<LoadingPlaceholder height="h-64" />}>
          <CTASection />
        </Suspense>
        
        {/* FAQ Section - Lazy loaded */}
        <Suspense fallback={<LoadingPlaceholder height="h-96" />}>
          <FAQ />
        </Suspense>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 flex items-center justify-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 rounded-full shadow-2xl shadow-yellow-500/25 hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-110 cursor-pointer"
          aria-label={t.common?.scrollToTop || 'Remonter en haut'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Calendly Modal */}
      <div id="calendly-modal" className="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[600px] relative">
            <button
              onClick={() => {
                const modal = document.getElementById('calendly-modal');
                if (modal) modal.style.display = 'none';
              }}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              ✕
            </button>
            <iframe
              src="https://calendly.com/cash360/30?embed=true"
              width="100%"
              height="100%"
              frameBorder="0"
              className="rounded-2xl"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Bandeau de consentement aux cookies */}
      <CookieConsentBanner />
    </div>
  )
}