'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/Hero';
import SignupForm from '@/components/SignupForm';
import Benefits from '@/components/Benefits';

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero />
      <SignupForm />
      <Benefits />
      
      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 flex items-center justify-center bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-full shadow-2xl shadow-yellow-500/25 hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-110 cursor-pointer"
          aria-label="Remonter en haut"
        >
          <i className="ri-arrow-up-line text-xl font-bold"></i>
        </button>
      )}
    </div>
  );
}