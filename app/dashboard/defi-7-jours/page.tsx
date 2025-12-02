import Link from 'next/link'

export const metadata = {
  title: 'Défi 7 jours - Cash360'
}

export default function DashboardChallengePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
          ← Retour au dashboard
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Défi 7 jours</h1>
          <p className="text-gray-600 mb-6">
            La version interactive du défi arrive bientôt pour vous aider à instaurer de nouvelles habitudes financières.
          </p>
          <p className="text-sm text-gray-500">
            {/* TODO: connecter aux étapes quotidiennes du défi */}
            À venir : checklist journalière, rappels automatiques et ressources motivantes.
          </p>
        </div>
      </div>
    </div>
  )
}

