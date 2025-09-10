'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300 text-white"
      aria-label={`Switch to ${language === 'fr' ? 'English' : 'Français'}`}
    >
      {/* Icône du drapeau */}
      <div className="flex items-center gap-1">
        {language === 'fr' ? (
          // Drapeau français
          <div className="flex">
            <div className="w-2 h-3 bg-blue-600"></div>
            <div className="w-2 h-3 bg-white"></div>
            <div className="w-2 h-3 bg-red-600"></div>
          </div>
        ) : (
          // Drapeau britannique (Union Jack) - Version simplifiée
          <div className="relative w-6 h-3 bg-blue-600 rounded-sm overflow-hidden">
            {/* Croix blanche horizontale */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white transform -translate-y-1/2"></div>
            {/* Croix blanche verticale */}
            <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white transform -translate-x-1/2"></div>
            {/* Croix rouge diagonale */}
            <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-red-600 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
            <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-red-600 transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
          </div>
        )}
      </div>
      
      {/* Code de langue */}
      <span className="text-xs sm:text-sm font-medium">
        {language.toUpperCase()}
      </span>
      
      {/* Icône de changement */}
      <svg 
        className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
        />
      </svg>
    </button>
  );
}
