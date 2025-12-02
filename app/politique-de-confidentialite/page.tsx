import Link from 'next/link'
import { getLegalContent } from '@/lib/legalContent'

export const metadata = {
  title: 'Politique de confidentialité | Cash360',
  description: 'Découvrez la politique de confidentialité Cash360 : gestion des données, sécurité et droits des utilisateurs.'
}

export default function PolitiqueDeConfidentialitePage() {
  const { title, content } = getLegalContent('privacy')
  const lastUpdated = 'Décembre 2024'

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="mr-2 text-xl">←</span>
          Retour à l'accueil
        </Link>

        <article className="mt-6 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <header className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-10 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-2">Cash360</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#D4AF37]">{title}</h1>
            <p className="mt-4 text-sm text-white/80">Version mise à jour — {lastUpdated}</p>
          </header>

          <div className="px-6 py-10 text-gray-700 leading-relaxed space-y-6">
            {content}
          </div>
        </article>
      </div>
    </main>
  )
}

