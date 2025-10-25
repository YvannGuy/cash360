'use client'

import { useState } from 'react'
import { Tooltip, fmtEUR } from '@/components/Helpers'
import CTABox from '@/components/CTABox'

type ScoreCategory = 'sain' | 'ameliorer' | 'desequilibre'

export default function SimulationPage() {
  // États pour le formulaire
  const [revenus, setRevenus] = useState<string>('')
  const [fixes, setFixes] = useState<string>('')
  const [variables, setVariables] = useState<string>('')
  
  // États pour le gate e-mail
  const [showEmailGate, setShowEmailGate] = useState(false)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  
  // États pour les résultats
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState<ScoreCategory>('sain')
  const [epargne, setEpargne] = useState(0)
  const [epargnePercent, setEpargnePercent] = useState(0)
  const [fixesPercent, setFixesPercent] = useState(0)
  
  // État de chargement
  const [isLoading, setIsLoading] = useState(false)

  const handleCalculate = () => {
    const revenusNum = parseFloat(revenus)
    const fixesNum = parseFloat(fixes)
    const variablesNum = parseFloat(variables)
    
    if (!revenusNum || revenusNum <= 0) {
      alert('Veuillez saisir vos revenus mensuels')
      return
    }
    
    if (!fixesNum || fixesNum < 0 || !variablesNum || variablesNum < 0) {
      alert('Veuillez saisir vos dépenses')
      return
    }
    
    // Afficher le gate e-mail
    setShowEmailGate(true)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !consent) {
      alert('Veuillez saisir votre email et accepter le traitement de vos données')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Enregistrer le lead via l'API
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          consent: true,
          meta: {
            source: 'simulation',
            revenus: parseFloat(revenus),
            fixes: parseFloat(fixes),
            variables: parseFloat(variables),
          },
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement')
      }
      
      // Calculer les résultats
      const revenusNum = parseFloat(revenus)
      const fixesNum = parseFloat(fixes)
      const variablesNum = parseFloat(variables)
      const depensesTotales = fixesNum + variablesNum
      const epargneCalc = Math.max(0, revenusNum - depensesTotales)
      const epargnePercentCalc = revenusNum > 0 ? (epargneCalc / revenusNum) * 100 : 0
      const fixesPercentCalc = revenusNum > 0 ? (fixesNum / revenusNum) * 100 : 0
      
      setEpargne(epargneCalc)
      setEpargnePercent(epargnePercentCalc)
      setFixesPercent(fixesPercentCalc)
      
      // Déterminer le score
      if (epargnePercentCalc >= 10 && fixesPercentCalc <= 50) {
        setScore('sain')
      } else if (epargnePercentCalc >= 5 && fixesPercentCalc <= 65) {
        setScore('ameliorer')
      } else {
        setScore('desequilibre')
      }
      
      // Afficher les résultats
      setShowResults(true)
      setShowEmailGate(false)
    } catch (error) {
      console.error(error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreMessage = () => {
    switch (score) {
      case 'sain':
        return {
          title: 'Bravo ! Vos finances sont plutôt bien équilibrées',
          message:
            'Il vous reste une marge chaque mois. Pour avancer vers une vraie liberté financière, transformons cette base en stratégie : épargne planifiée, priorités claires, projets.',
          ctaText: 'Prenez 15 minutes pour identifier comment faire fructifier ce bon équilibre.',
          emoji: '✅',
        }
      case 'ameliorer':
        return {
          title: 'Votre budget tient, mais il commence à être tendu',
          message:
            'Avec quelques ajustements simples (abonnements, variables, priorités), vous pouvez libérer une vraie marge dès ce mois-ci.',
          ctaText: 'En 15 minutes, identifions 2 à 3 leviers immédiats pour respirer financièrement.',
          emoji: '🟡',
        }
      case 'desequilibre':
        return {
          title: 'Votre budget est actuellement trop serré',
          message:
            "Ce n'est pas une fatalité : avec une méthode pas à pas, vous pouvez reprendre le contrôle et retrouver la paix financière.",
          ctaText: 'En 15 minutes, clarifions l\'origine du déséquilibre et définissons les premières actions concrètes.',
          emoji: '🔴',
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Bouton retour */}
          <div className="mb-6">
            <a
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-[#0B1B2B] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour à l'accueil
            </a>
          </div>

          {/* Titre et description centrés */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#0B1B2B]">
              Testez votre équilibre financier en 60 secondes 🕒
            </h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Voyez en un instant où part votre argent et quel pourcentage vous pouvez épargner chaque mois.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Calcul local sur votre appareil. Vos données ne sont ni stockées ni transmises.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {!showResults && (
          <>
            {/* Formulaire */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Vos informations financières
              </h2>

              <div className="space-y-6">
                {/* Revenus mensuels */}
                <div>
                  <label
                    htmlFor="revenus"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Revenus mensuels{' '}
                    <Tooltip content="Tout l'argent reçu chaque mois (salaire, aides, dons…).">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs cursor-help">
                        ?
                      </span>
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    id="revenus"
                    value={revenus}
                    onChange={(e) => setRevenus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2000"
                    min="0"
                  />
                </div>

                {/* Dépenses fixes */}
                <div>
                  <label
                    htmlFor="fixes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Dépenses fixes{' '}
                    <Tooltip content="Dépenses qui changent peu : loyer, crédits, assurances, internet, dîme, abonnements…">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs cursor-help">
                        ?
                      </span>
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    id="fixes"
                    value={fixes}
                    onChange={(e) => setFixes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1200"
                    min="0"
                  />
                </div>

                {/* Dépenses variables */}
                <div>
                  <label
                    htmlFor="variables"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Dépenses variables{' '}
                    <Tooltip content="Dépenses qui varient : courses, transport, restaurants, vêtements, petits plaisirs…">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs cursor-help">
                        ?
                      </span>
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    id="variables"
                    value={variables}
                    onChange={(e) => setVariables(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="800"
                    min="0"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculate}
                className="mt-8 w-full bg-[#D4AF37] text-[#0B1B2B] py-3 rounded-lg font-medium hover:brightness-95 transition-all duration-200"
              >
                Calculer mon équilibre
              </button>
            </div>

            {/* Gate e-mail */}
            {showEmailGate && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Votre email pour recevoir vos résultats
                </h3>
                <form onSubmit={handleEmailSubmit}>
                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 mr-3"
                        required
                      />
                      <span className="text-sm text-gray-700">
                        J'accepte que mes données soient utilisées pour me contacter concernant cette
                        simulation et les services Cash360.
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-[#D4AF37] text-[#0B1B2B] py-3 rounded-lg font-medium hover:brightness-95 transition-all duration-200 disabled:opacity-50"
                    >
                      {isLoading ? 'Envoi...' : 'Voir mes résultats'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmailGate(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* Résultats */}
        {showResults && (
          <div className="space-y-8">
            {/* Score visuel */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-6xl">
                  {getScoreMessage().emoji}
                </span>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {getScoreMessage().title}
                  </h2>
                </div>
              </div>

              <p className="text-gray-700 text-lg mb-6">
                {getScoreMessage().message}
              </p>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Épargne mensuelle</div>
                  <div className="text-2xl font-bold text-blue-900">{fmtEUR(epargne)}</div>
                  <div className="text-sm text-blue-700">{epargnePercent.toFixed(1)}%</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Charges fixes</div>
                  <div className="text-2xl font-bold text-purple-900">{fmtEUR(parseFloat(fixes))}</div>
                  <div className="text-sm text-purple-700">{fixesPercent.toFixed(1)}%</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Dépenses variables</div>
                  <div className="text-2xl font-bold text-yellow-900">{fmtEUR(parseFloat(variables))}</div>
                  <div className="text-sm text-yellow-700">{((parseFloat(variables) / parseFloat(revenus)) * 100).toFixed(1)}%</div>
                </div>
              </div>

              <p className="text-gray-600 italic">
                {getScoreMessage().ctaText}
              </p>
            </div>

            {/* CTA Box */}
            <CTABox title={getScoreMessage().ctaText} />
          </div>
        )}
      </div>

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
    </div>
  )
}
