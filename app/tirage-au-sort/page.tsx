'use client'

import React, { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// Date cible : 25 décembre 2025 à minuit
const targetDate = new Date('2025-12-25T00:00:00').getTime()

export default function TirageAuSortPage() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [confettiStyles, setConfettiStyles] = useState<Array<React.CSSProperties>>([])
  const [submitted, setSubmitted] = useState<{ first_name: string; email: string } | null>(null)
  const [showConfettiBurst, setShowConfettiBurst] = useState(false)
  const [confettiBurstStyles, setConfettiBurstStyles] = useState<Array<React.CSSProperties>>([])
  const hasGeneratedConfetti = useRef(false)

  // Générer les styles des confettis uniquement côté client pour éviter les erreurs d'hydratation
  useEffect(() => {
    const styles = Array.from({ length: 28 }).map(() => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2.5}s`,
      animationDuration: `${4 + Math.random() * 3}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
      opacity: 0.55 + Math.random() * 0.25,
      width: `${6 + Math.random() * 6}px`,
      height: `${10 + Math.random() * 10}px`
    }))
    setConfettiStyles(styles)
  }, [])

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  // Générer les confettis burst une seule fois quand success passe à true
  useEffect(() => {
    if (success && !hasGeneratedConfetti.current) {
      hasGeneratedConfetti.current = true
      
      // Générer les confettis burst
      const burst = Array.from({ length: 50 }).map(() => {
        const angle = Math.random() * 360
        const velocity = 200 + Math.random() * 200
        const x = Math.cos((angle * Math.PI) / 180) * velocity
        const y = Math.sin((angle * Math.PI) / 180) * velocity
        
        return {
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${Math.random() * 360}deg)`,
          opacity: 1,
          animation: 'confettiBurst 0.8s ease-out 1 forwards',
          animationIterationCount: 1,
          backgroundColor: [
            'rgba(239, 68, 68, 0.9)',
            'rgba(16, 185, 129, 0.9)',
            'rgba(59, 130, 246, 0.9)',
            'rgba(250, 204, 21, 0.9)',
            'rgba(255, 215, 0, 0.9)'
          ][Math.floor(Math.random() * 5)],
          width: `${8 + Math.random() * 8}px`,
          height: `${8 + Math.random() * 8}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px'
        } as React.CSSProperties
      })
      
      setConfettiBurstStyles(burst)
      setShowConfettiBurst(true)
      
      // Nettoyer complètement après l'animation (0.8s + marge)
      const timer = setTimeout(() => {
        setShowConfettiBurst(false)
        setConfettiBurstStyles([])
      }, 1000)
      
      return () => {
        clearTimeout(timer)
      }
    } else if (!success) {
      // Réinitialiser quand success redevient false
      hasGeneratedConfetti.current = false
      setShowConfettiBurst(false)
      setConfettiBurstStyles([])
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/raffle/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      // Stocker les données avant de reset
      setSubmitted({ first_name: formData.first_name, email: formData.email })
      setSuccess(true)
      setFormData({ first_name: '', last_name: '', email: '' })
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  // Composant SuccessCelebration
  const SuccessCelebration = ({ 
    showBurst, 
    confettiStyles 
  }: { 
    showBurst: boolean
    confettiStyles: Array<React.CSSProperties>
  }) => {

    return (
      <div className="relative">
        {/* Confetti burst overlay */}
        {showBurst && confettiStyles.length > 0 && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confettiStyles.map((style, i) => (
              <div
                key={`confetti-${i}`}
                className="confetti-burst"
                style={style}
              />
            ))}
          </div>
        )}

        {/* Carte de succès */}
        <div className="text-center py-8">
          {/* Check */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Message personnalisé */}
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Bravo {submitted?.first_name || 'vous'} ! 🎉
          </h3>
          <p className="text-lg text-gray-700 mb-2">
            Votre inscription au tirage au sort a été enregistrée avec succès.
          </p>
          <p className="text-base text-gray-600 mb-6">
            Adresse enregistrée :{' '}
            <a
              href={`mailto:${submitted?.email}`}
              className="text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              {submitted?.email}
            </a>
          </p>

          {/* Bouton pour réinscrire */}
          <button
            onClick={() => {
              setSuccess(false)
              setSubmitted(null)
              setShowConfettiBurst(false)
              setConfettiBurstStyles([])
            }}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Inscrire une autre personne
          </button>
        </div>

        {/* Styles pour les animations */}
        <style jsx>{`
          @keyframes pop-in {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(20px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes scale-in {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes fade-in-up {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes confettiBurst {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) translate(0, 0) rotate(0deg);
            }
            100% {
              opacity: 0;
            }
          }

          .animate-pop-in {
            animation: pop-in 0.5s ease-out 1;
            animation-fill-mode: forwards;
          }

          .animate-scale-in {
            animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1;
            animation-fill-mode: forwards;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out 0.3s 1 both;
          }

          .animate-fade-in-up-delay {
            animation: fade-in-up 0.6s ease-out 0.5s 1 both;
          }

          .animate-fade-in-up-delay-2 {
            animation: fade-in-up 0.6s ease-out 0.7s 1 both;
          }

          .checkmark-path {
            stroke-dasharray: 24;
            stroke-dashoffset: 24;
            animation: checkmark-draw 0.6s ease-out 0.4s forwards;
          }

          @keyframes checkmark-draw {
            to {
              stroke-dashoffset: 0;
            }
          }

          .confetti-burst {
            position: absolute;
            pointer-events: none;
            animation-iteration-count: 1;
            animation-fill-mode: forwards;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Navbar />
      
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
  {/* Décor Noël (ne touche pas au header/footer) */}
  <div aria-hidden className="absolute inset-0 pointer-events-none">
    {/* Glow + bokeh */}
    <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-red-500/20 blur-3xl" />
    <div className="absolute -bottom-40 -right-40 w-[620px] h-[620px] rounded-full bg-emerald-400/15 blur-3xl" />
    <div className="absolute top-24 right-10 w-40 h-40 rounded-full bg-yellow-300/10 blur-2xl" />
    <div className="absolute bottom-24 left-10 w-56 h-56 rounded-full bg-sky-400/10 blur-2xl" />

    {/* Neige (grain léger) */}
    <div className="absolute inset-0 opacity-[0.18] mix-blend-screen bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:18px_18px]" />

    {/* Cadeaux en watermark (SVG) */}
    <svg
      className="absolute left-[-40px] top-40 opacity-[0.08] rotate-[-12deg]"
      width="240"
      height="240"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 11h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9Z"
        stroke="white"
        strokeWidth="1.5"
      />
      <path d="M12 11v11" stroke="white" strokeWidth="1.5" />
      <path d="M2 11h20" stroke="white" strokeWidth="1.5" />
      <path
        d="M12 11c-2.5 0-4.5-.9-4.5-3 0-1.7 1.3-2.5 2.6-2.5 1.9 0 2.7 2.2 1.9 5.5Z"
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M12 11c2.5 0 4.5-.9 4.5-3 0-1.7-1.3-2.5-2.6-2.5-1.9 0-2.7 2.2-1.9 5.5Z"
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>

    <svg
      className="absolute right-[-60px] bottom-28 opacity-[0.08] rotate-[10deg]"
      width="260"
      height="260"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 7h12l-1 14H7L6 7Z"
        stroke="white"
        strokeWidth="1.5"
      />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" stroke="white" strokeWidth="1.5" />
      <path d="M9 11v7" stroke="white" strokeWidth="1.5" />
      <path d="M15 11v7" stroke="white" strokeWidth="1.5" />
    </svg>

    {/* Confettis animés */}
    <div className="absolute inset-0 overflow-hidden">
      {confettiStyles.map((style, i) => (
        <span
          key={i}
          className="confetti"
          style={style}
        />
      ))}
    </div>
  </div>

  {/* Styles confetti (local au contenu) */}
  <style jsx>{`
    .confetti {
      position: absolute;
      top: -24px;
      border-radius: 2px;
      background: linear-gradient(180deg, rgba(255, 215, 0, 0.95), rgba(255, 255, 255, 0.2));
      filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.15));
      animation-name: fall;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      pointer-events: none;
    }
    .confetti:nth-child(3n) {
      background: linear-gradient(180deg, rgba(239, 68, 68, 0.95), rgba(255, 255, 255, 0.2));
    }
    .confetti:nth-child(3n + 1) {
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.95), rgba(255, 255, 255, 0.2));
    }
    .confetti:nth-child(3n + 2) {
      background: linear-gradient(180deg, rgba(59, 130, 246, 0.95), rgba(255, 255, 255, 0.2));
    }
    @keyframes fall {
      0% {
        transform: translate3d(0, 0, 0) rotate(0deg);
      }
      100% {
        transform: translate3d(80px, 110vh, 0) rotate(360deg);
      }
    }
  `}</style>

  <div className="max-w-4xl mx-auto relative">
    {/* Titre */}
    <div className="text-center mb-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-gray-100 mb-5">
        <span className="text-lg">🎁</span>
        <span className="text-sm font-medium">Spécial Noël</span>
        <span className="text-lg">❄️</span>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
        Tirage au sort
      </h1>
      <p className="text-xl text-gray-200/90">
        Inscrivez-vous pour participer au tirage au sort du 25 décembre 2025
      </p>
    </div>

    {/* Compte à rebours */}
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-12 border border-white/20 relative overflow-hidden">
      {/* petit liseré “candy” en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(90deg,rgba(239,68,68,0.9),rgba(250,204,21,0.9),rgba(16,185,129,0.9))]" />

      <h2 className="text-2xl font-bold text-white text-center mb-6">
        Temps restant jusqu&apos;au tirage
      </h2>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Jours', value: countdown.days },
          { label: 'Heures', value: countdown.hours },
          { label: 'Minutes', value: countdown.minutes },
          { label: 'Secondes', value: countdown.seconds }
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="bg-white/15 rounded-lg p-4 mb-2 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <div className="text-4xl font-bold text-white tabular-nums">
                {item.value}
              </div>
            </div>
            <div className="text-sm text-gray-200/90">{item.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Formulaire */}
    <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
      {/* fond festif très léger */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(239,68,68,0.9) 0, transparent 42%), radial-gradient(circle at 88% 22%, rgba(16,185,129,0.9) 0, transparent 42%), radial-gradient(circle at 50% 90%, rgba(250,204,21,0.9) 0, transparent 45%)'
        }}
      />
      <div className="relative">
        {success ? (
          <SuccessCelebration showBurst={showConfettiBurst} confettiStyles={confettiBurstStyles} />
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Inscription au tirage au sort
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FEBE02] focus:border-transparent bg-white/95"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FEBE02] focus:border-transparent bg-white/95"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FEBE02] focus:border-transparent bg-white/95"
                  placeholder="votre@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold py-3 px-6 rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Inscription en cours...' : "S'inscrire au tirage au sort"}
              </button>

              <p className="text-xs text-gray-500 text-center pt-2">
                🎄 Bonne chance !
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  </div>
</main>


      <Footer />
    </div>
  )
}
