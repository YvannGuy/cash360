'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Fonction pour détecter le thème préféré
const detectTheme = (): Theme => {
  // Vérifier si on est côté client
  if (typeof window === 'undefined') {
    return 'light'; // Défaut côté serveur
  }

  // 1. Vérifier localStorage
  try {
    const savedTheme = localStorage.getItem('cash360-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
  } catch (error) {
    console.log('localStorage non disponible');
  }

  // 2. Vérifier les préférences système
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (error) {
    console.log('matchMedia non disponible');
  }

  // 3. Défaut : light
  return 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Appliquer le thème au document
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    // Supprimer d'abord la classe dark pour éviter les conflits
    root.classList.remove('dark');
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      // En mode light, on retire juste 'dark'
    }
    
    // Forcer un re-render en déclenchant un événement
    window.dispatchEvent(new Event('theme-changed'));
  }, []);

  // Utiliser useRef pour éviter les re-renders en boucle
  const applyThemeRef = useRef(applyTheme);
  applyThemeRef.current = applyTheme;

  // Charger et détecter le thème au montage (côté client uniquement)
  useEffect(() => {
    setMounted(true);
    const detectedTheme = detectTheme();
    setThemeState(detectedTheme);
    applyThemeRef.current(detectedTheme);
  }, []); // Dépendances vides pour éviter les re-exécutions

  // Sauvegarder le thème dans localStorage quand il change
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cash360-theme', newTheme);
      } catch (error) {
        console.log('[Theme] ❌ Impossible de sauvegarder le thème:', error);
      }
    }
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const currentTheme = theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log('[Theme] 🎨 toggleTheme appelé - basculage:', currentTheme, '→', newTheme);
    setTheme(newTheme);
  }, [theme, setTheme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme
  }), [theme, setTheme, toggleTheme]);

  // Toujours render le provider, même pendant le chargement
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
}
