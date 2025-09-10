
'use client';
import { useState } from 'react';

export default function Hero() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <section className="relative min-h-screen bg-transparent overflow-hidden">
      {/* Logo en haut */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-8">
        <img 
          src="https://static.readdy.ai/image/da957b73b52f8479bc0334fc9a75f115/f52c7bde8663a1201da816853efea912.png"
          alt="Cash360"
          className="h-44 w-auto"
        />
      </div>

      {/* Background elements - matching main site background */}
      
      <div className="relative z-10 container mx-auto px-6 py-20 pt-56 min-h-screen flex items-center">
        <div className="flex flex-col items-center w-full space-y-12">
          
          {/* Video Container - En haut et grand */}
          <div className="w-full max-w-5xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-yellow-400/20 rounded-3xl blur-xl transform rotate-1"></div>
              <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Formation exclusive</h3>
                </div>
                
                <div className="relative rounded-2xl overflow-hidden">
                  <iframe 
                    src="https://player.vimeo.com/video/1117610452?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0&controls=1&loop=1&suggested=0&end_screen=0"
                    width="100%" 
                    height="500" 
                    frameBorder="0" 
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write" 
                    title="Cash360 Formation"
                    className="w-full"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Tout centré sous la vidéo */}
          <div className="flex flex-col items-center w-full space-y-12 max-w-4xl">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-yellow-400/20 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-white/90 text-sm font-medium">Transformez votre vie financière</span>
            </div>

            {/* Main Title - Centré */}
            <div className="text-center space-y-6">
              <h1 className="text-6xl lg:text-7xl font-black text-white leading-[0.9)">
                Maîtrisez vos
                <span className="block bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                  Finances
                </span>
                <span className="block text-blue-400">
                  avec Cash360
                </span>
              </h1>
              
              <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                Comme des milliers d'autres, changez dès aujourd'hui votre manière de voir et gérer l'argent.
              </p>
            </div>

            {/* Stats - Centrées */}
            <div className="grid grid-cols-3 gap-8 w-full max-w-2xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">20</div>
                <div className="text-white/60 text-sm">Personnes inscrites cette semaine</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">24h</div>
                <div className="text-white/60 text-sm">Support dédié</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">30j</div>
                <div className="text-white/60 text-sm">Premiers résultats</div>
              </div>
            </div>

            {/* CTA Buttons - Centrés */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('cash360-signup')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold px-8 py-4 rounded-2xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-yellow-500/25 whitespace-nowrap cursor-pointer"
              >
                Réserver ma séance découverte
              </button>
              <button 
                onClick={() => setShowVideoModal(true)}
                className="border-2 border-white/20 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Voir la vidéo
              </button>
            </div>

            {/* Key Features - Centrées sous les boutons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl mt-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-500/20 rounded-xl mb-3 mx-auto">
                  <i className="ri-shield-check-line text-blue-400 text-xl"></i>
                </div>
                <h4 className="text-white font-semibold mb-2">100% Sécurisé</h4>
                <p className="text-white/60 text-sm">Méthodes éprouvées et transparentes</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <div className="w-10 h-10 flex items-center justify-center bg-yellow-500/20 rounded-xl mb-3 mx-auto">
                  <i className="ri-book-open-line text-yellow-400 text-xl"></i>
                </div>
                <h4 className="text-white font-semibold mb-2">Apprentissage progressif</h4>
                <p className="text-white/60 text-sm">Formation étape par étape</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <div className="w-10 h-10 flex items-center justify-center bg-green-500/20 rounded-xl mb-3 mx-auto">
                  <i className="ri-team-line text-green-400 text-xl"></i>
                </div>
                <h4 className="text-white font-semibold mb-2">Communauté VIP</h4>
                <p className="text-white/60 text-sm">Support 24/7 d'experts</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-500/20 rounded-xl mb-3 mx-auto">
                  <i className="ri-heart-line text-purple-400 text-xl"></i>
                </div>
                <h4 className="text-white font-semibold mb-2">Approche bienveillante</h4>
                <p className="text-white/60 text-sm">Formation humaine et éthique</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 max-w-4xl w-full mx-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-xl">Formation Cash360 - Présentation complète</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-white text-xl"></i>
              </button>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden">
              <iframe 
                src="https://player.vimeo.com/video/1117610452?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0&controls=1&autoplay=1&loop=1&suggested=0&end_screen=0"
                width="100%" 
                height="500" 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write" 
                title="Cash360 Formation Complète"
                className="w-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
