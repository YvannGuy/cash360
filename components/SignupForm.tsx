'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function SignupForm() {
  const { t } = useLanguage();

  useEffect(() => {
    // Charger le script Calendly
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Nettoyer le script lors du démontage
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <section className="py-20 px-6 bg-transparent relative">
      {/* Background elements matching hero */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto max-w-4xl relative z-10 px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              {t.signup.title}
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-6">
              {t.signup.subtitle}
            </p>
            
            {/* Compteur social */}
            <div className="mt-6 flex items-center justify-center gap-2 bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-4 py-2 max-w-fit mx-auto">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-white/90 text-xs sm:text-sm font-medium">20 {t.signup.socialProof}</span>
            </div>
          </div>

          {/* Widget Calendly */}
          <div id="cash360-signup" className="calendly-container">
            <div 
              className="calendly-inline-widget" 
              data-url="https://calendly.com/cash360/15min" 
              style={{minWidth: '320px', height: '700px'}}
            ></div>
          </div>

          <div className="mt-8 text-center text-sm text-white/60">
            <p>
              {t.signup.form.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}