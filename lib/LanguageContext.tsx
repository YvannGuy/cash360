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

  // 3. Détecter via IP géolocalisation (fallback) - avec cache pour éviter les appels répétés
  try {
    // Vérifier le cache d'abord (expiration 24h)
    const cachedLang = sessionStorage.getItem('cash360-detected-lang')
    const cachedTimestamp = sessionStorage.getItem('cash360-detected-lang-timestamp')
    if (cachedLang && cachedTimestamp) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp, 10)
      const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 heures
      if (cacheAge < CACHE_DURATION && ['fr', 'en', 'es', 'pt'].includes(cachedLang)) {
        return cachedLang as Language
      }
    }

    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code?.toLowerCase();
    
    // Mapping pays -> langue (Europe, Amérique, Afrique)
    const countryToLang: { [key: string]: Language } = {
      // Europe Francophone
      'fr': 'fr', 'be': 'fr', 'ch': 'fr', 'mc': 'fr', 'lu': 'fr', 'ad': 'fr',
      
      // Europe Anglophone
      'gb': 'en', 'ie': 'en', 'mt': 'en', 'cy': 'en',
      
      // Europe Hispanophone
      'es': 'es', 'gi': 'es',
      
      // Europe Lusophone
      'pt': 'pt',
      
      // Europe Autres (fallback FR)
      'it': 'fr', 'de': 'fr', 'nl': 'fr', 'at': 'fr', 'se': 'fr', 'no': 'fr', 'dk': 'fr', 'fi': 'fr', 'pl': 'fr', 'cz': 'fr', 'sk': 'fr', 'hu': 'fr', 'ro': 'fr', 'bg': 'fr', 'hr': 'fr', 'si': 'fr', 'ee': 'fr', 'lv': 'fr', 'lt': 'fr', 'gr': 'fr',
      
      // Amérique du Nord
      'us': 'en', 'ca': 'en',
      
      // Amérique Centrale & Caraïbes Hispanophone
      'mx': 'es', 'gt': 'es', 'bz': 'es', 'sv': 'es', 'hn': 'es', 'ni': 'es', 'cr': 'es', 'pa': 'es', 'cu': 'es', 'do': 'es', 'pr': 'es',
      
      // Amérique Centrale & Caraïbes Anglophone
      'jm': 'en', 'tt': 'en', 'bb': 'en', 'bs': 'en', 'ag': 'en', 'dm': 'en', 'gd': 'en', 'kn': 'en', 'lc': 'en', 'vc': 'en',
      
      // Amérique Centrale & Caraïbes Francophone
      'ht': 'fr', 'mq': 'fr', 'gp': 'fr', 'gf': 'fr',
      
      // Amérique du Sud Hispanophone
      'ar': 'es', 'bo': 'es', 'cl': 'es', 'co': 'es', 'ec': 'es', 'py': 'es', 'pe': 'es', 'uy': 'es', 've': 'es',
      
      // Amérique du Sud Lusophone
      'br': 'pt', 'gy': 'pt', 'sr': 'pt',
      
      // Afrique Francophone
      'sn': 'fr', 'ma': 'fr', 'tn': 'fr', 'dz': 'fr', 'cm': 'fr', 'ci': 'fr', 'bf': 'fr', 'mg': 'fr', 'cd': 'fr', 'ml': 'fr', 'ne': 'fr', 'td': 'fr', 'cf': 'fr', 'cg': 'fr', 'ga': 'fr', 'gq': 'fr', 'dj': 'fr', 'km': 'fr', 'bi': 'fr', 'rw': 'fr', 'tg': 'fr', 'bj': 'fr', 'gn': 'fr', 'mr': 'fr', 're': 'fr', 'yt': 'fr',
      
      // Afrique Anglophone
      'ng': 'en', 'ke': 'en', 'gh': 'en', 'ug': 'en', 'za': 'en', 'tz': 'en', 'et': 'en', 'zw': 'en', 'zm': 'en', 'mw': 'en', 'bw': 'en', 'ls': 'en', 'sz': 'en', 'sl': 'en', 'lr': 'en', 'gm': 'en', 'sc': 'en', 'mu': 'en',
      
      // Afrique Lusophone
      'ao': 'pt', 'mz': 'pt', 'cv': 'pt', 'gw': 'pt', 'st': 'pt',
      
      // Afrique Hispanophone
      'eh': 'es',
      
      // Asie & Océanie Anglophone
      'au': 'en', 'nz': 'en', 'sg': 'en', 'hk': 'en', 'ph': 'en', 'my': 'en', 'in': 'en', 'pk': 'en', 'bd': 'en', 'lk': 'en', 'mm': 'en', 'th': 'en', 'vn': 'en', 'kh': 'en', 'la': 'en', 'id': 'en', 'bn': 'en', 'tl': 'en', 'fj': 'en', 'pg': 'en', 'sb': 'en', 'vu': 'en', 'ws': 'en', 'to': 'en', 'ki': 'en', 'tv': 'en', 'nr': 'en', 'pw': 'en', 'fm': 'en', 'mh': 'en', 'ck': 'en', 'nu': 'en', 'tk': 'en', 'as': 'en', 'gu': 'en', 'mp': 'en', 'vi': 'en',
      
      // Océanie Francophone
      'nc': 'fr', 'pf': 'fr', 'wf': 'fr',
      
      // Moyen-Orient Anglophone
      'il': 'en', 'ae': 'en', 'sa': 'en', 'kw': 'en', 'qa': 'en', 'bh': 'en', 'om': 'en', 'jo': 'en', 'iq': 'en', 'ir': 'en', 'tr': 'en', 'eg': 'en', 'sd': 'en', 'ss': 'en', 'er': 'en', 'so': 'en',
      
      // Moyen-Orient Francophone
      'lb': 'fr', 'sy': 'fr', 'ly': 'fr'
    };
    
    if (countryCode && countryToLang[countryCode]) {
      const detectedLang = countryToLang[countryCode]
      // Mettre en cache le résultat
      try {
        sessionStorage.setItem('cash360-detected-lang', detectedLang)
        sessionStorage.setItem('cash360-detected-lang-timestamp', Date.now().toString())
      } catch (e) {
        // Ignore si sessionStorage n'est pas disponible
      }
      return detectedLang
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
