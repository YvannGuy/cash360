'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TirageAuSortPage() {

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-center mb-8">
            Tirage au sort
          </h1>
          {/* Contenu de la page à ajouter ici */}
        </div>
      </main>
      <Footer />
    </div>
  )
}
