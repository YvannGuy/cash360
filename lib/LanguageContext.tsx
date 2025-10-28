'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKeys } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Fonction pour détecter la langue depuis le navigateur ou l'IP
const detectLanguage = async (): Promise<Language> => {
  // Vérifier si on est côté client
  if (typeof window === 'undefined') {
    return 'fr'; // Défaut côté serveur
  }

  // 1. Vérifier localStorage
  try {
    const savedLanguage = localStorage.getItem('cash360-language') as Language;
    if (savedLanguage && ['fr', 'en', 'es', 'pt'].includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.log('localStorage non disponible');
  }

  // 2. Détecter via le navigateur
  try {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('en')) return 'en';
  } catch (error) {
    console.log('navigator.language non disponible');
  }

  // 3. Détecter via IP géolocalisation (fallback)
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code?.toLowerCase();
    
    // Mapping pays -> langue
    const countryToLang: { [key: string]: Language } = {
      'fr': 'fr', 'be': 'fr', 'ch': 'fr', 'ca': 'fr', // Français
      'es': 'es', 'mx': 'es', 'ar': 'es', 'co': 'es', 'cl': 'es', // Espagnol
      'pt': 'pt', 'br': 'pt', 'ao': 'pt', 'mz': 'pt', // Portugais
      'us': 'en', 'gb': 'en', 'au': 'en', 'nz': 'en', 'ie': 'en', // Anglais
    };
    
    if (countryCode && countryToLang[countryCode]) {
      return countryToLang[countryCode];
    }
  } catch (error) {
    console.log('Géolocalisation IP non disponible, utilisation du français par défaut');
  }

  // 4. Défaut : français
  return 'fr';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [mounted, setMounted] = useState(false);

  // Charger et détecter la langue au montage (côté client uniquement)
  useEffect(() => {
    setMounted(true);
    detectLanguage().then(lang => {
      setLanguageState(lang);
    });
  }, []);

  // Sauvegarder la langue dans localStorage quand elle change
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cash360-language', lang);
      } catch (error) {
        console.log('Impossible de sauvegarder la langue');
      }
    }
  };

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  // Toujours render le provider, même pendant le chargement
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
