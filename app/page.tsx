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
const LiveTikTok = lazy(() => import('@/components/LiveTikTok'))
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
        
        {/* Live TikTok Section - Lazy loaded */}
        <Suspense fallback={<LoadingPlaceholder height="h-96" />}>
          <LiveTikTok />
        </Suspense>
        
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