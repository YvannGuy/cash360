'use client'

import { useEffect, useState } from 'react'

export default function LiveTikTok() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    // Calculer le prochain lundi à 22h (heure de Paris)
    const getNextMonday = () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek // Si dimanche, lundi = 1 jour, sinon 8 - jour actuel
      
      const nextMonday = new Date(now)
      nextMonday.setDate(now.getDate() + daysUntilMonday)
      nextMonday.setHours(22, 0, 0, 0) // 22h00 heure de Paris
      
      return nextMonday
    }

    const targetDate = getNextMonday()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section id="live-tiktok" className="py-16 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Live TikTok
          </h2>
          <p className="text-lg text-gray-600">
            Conseils financiers en direct tous les lundis à 22h00 (heure de Paris)
          </p>
        </div>

        {/* Event Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Event Header */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">EN DIRECT</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Lundi du Déclic</h3>
              <p className="text-blue-100">Conseils financiers personnalisés</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Event Image */}
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-slate-100 rounded-2xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop"
                      alt="Lundi du Déclic - Live TikTok"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Live Badge */}
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    EN DIRECT
                  </div>
                </div>

                {/* Countdown & Info */}
                <div className="space-y-6">
                  {/* Countdown */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Prochain live dans :</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center bg-yellow-50 rounded-xl p-3">
                        <div className="text-xl font-bold text-yellow-600">{timeLeft.days}</div>
                        <div className="text-xs text-gray-600">Jours</div>
                      </div>
                      <div className="text-center bg-blue-50 rounded-xl p-3">
                        <div className="text-xl font-bold text-blue-600">{timeLeft.hours}</div>
                        <div className="text-xs text-gray-600">Heures</div>
                      </div>
                      <div className="text-center bg-yellow-50 rounded-xl p-3">
                        <div className="text-xl font-bold text-yellow-600">{timeLeft.minutes}</div>
                        <div className="text-xs text-gray-600">Minutes</div>
                      </div>
                      <div className="text-center bg-blue-50 rounded-xl p-3">
                        <div className="text-xl font-bold text-blue-600">{timeLeft.seconds}</div>
                        <div className="text-xs text-gray-600">Secondes</div>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-yellow-500">📱</span>
                      <span className="text-gray-700">@ev.myriamkonan</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-500">⏰</span>
                      <span className="text-gray-700">Tous les lundis à 22h00 (Paris)</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div>
                    <a
                      href="https://www.tiktok.com/@ev.myriamkonan?_t=ZN-90nR9xLHIVa&_r=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <span className="mr-2">📱</span>
                      Suivre sur TikTok
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
