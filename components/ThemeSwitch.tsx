'use client';

import { useTheme } from '@/lib/ThemeContext';

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log('[ThemeSwitch] Clic détecté, thème actuel:', theme);
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 text-gray-700 dark:text-gray-200"
      aria-label={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
      type="button"
    >
      {theme === 'light' ? (
        // Icône lune pour mode sombre
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
          />
        </svg>
      ) : (
        // Icône soleil pour mode clair
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
      )}
      <span className="text-sm font-medium hidden sm:inline">
        {theme === 'light' ? 'Clair' : 'Sombre'}
      </span>
    </button>
  );
}

