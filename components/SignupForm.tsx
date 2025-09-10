'use client';

import { useState, FormEvent, useEffect } from 'react';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    status: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [currentSignup, setCurrentSignup] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  // Simuler des inscriptions en temps réel
  const fakeSignups = [
    "Marie D. de Lyon",
    "Thomas L. de Paris", 
    "Sophie M. de Marseille",
    "David R. de Toulouse",
    "Emma B. de Nantes",
    "Lucas P. de Strasbourg",
    "Camille V. de Bordeaux",
    "Alexandre H. de Lille",
    "Léa F. de Nice",
    "Julien C. de Rennes",
    "Sarah K. de Montpellier",
    "Antoine G. de Nancy"
  ];

  useEffect(() => {
    const showRandomSignup = () => {
      const randomName = fakeSignups[Math.floor(Math.random() * fakeSignups.length)];
      setCurrentSignup(randomName);
      setShowNotification(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 4000);
    };

    // Première notification après 2 secondes
    const initialTimer = setTimeout(showRandomSignup, 2000);
    
    // Puis toutes les 8-15 secondes
    const interval = setInterval(() => {
      showRandomSignup();
    }, Math.random() * 7000 + 8000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
        }),
      });

      if (response.ok) {
        setSubmitMessage('Inscription réussie ! Nous vous contacterons bientôt.');
        setFormData({ fullName: '', email: '', phone: '', status: '' });
      } else {
        setSubmitMessage("Erreur lors de l'inscription. Veuillez réessayer.");
      }
    } catch (error) {
      setSubmitMessage("Erreur lors de l'inscription. Veuillez réessayer.");
    }

    setIsSubmitting(false);
  };

  return (
    <section className="py-20 px-6 bg-transparent relative">
      {/* Notification d'inscription en temps réel */}
      {showNotification && (
        <div className="fixed top-8 right-8 z-50 bg-green-500/90 backdrop-blur-lg text-white px-6 py-4 rounded-xl shadow-2xl border border-green-400/30 animate-in slide-in-from-right-full duration-500">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <div>
              <p className="font-semibold text-sm">Nouvelle inscription !</p>
              <p className="text-xs opacity-90">{currentSignup} vient de s'inscrire</p>
            </div>
            <i className="ri-check-circle-fill text-green-300 text-lg"></i>
          </div>
        </div>
      )}

      {/* Background elements matching hero */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto max-w-2xl relative z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Commencez votre transformation financière
            </h2>
            <p className="text-lg text-white/80">
              Comme des milliers d'autres, changez dès aujourd'hui votre manière de voir et gérer l'argent
            </p>
            
            {/* Compteur social */}
            <div className="mt-6 flex items-center justify-center gap-2 bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-4 py-2 max-w-fit mx-auto">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-white/90 text-sm font-medium">20 personnes inscrites cette semaine</span>
            </div>
          </div>

          <form id="cash360-signup" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-white/90 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all text-sm text-white placeholder-white/50 backdrop-blur-sm"
                placeholder="Votre nom complet"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
                Adresse email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all text-sm text-white placeholder-white/50 backdrop-blur-sm"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-white/90 mb-2">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all text-sm text-white placeholder-white/50 backdrop-blur-sm"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-white/90 mb-2">
                Votre statut *
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:border-yellow-400 focus:bg-white/20 focus:outline-none transition-all text-sm text-white appearance-none backdrop-blur-sm pr-8"
                >
                  <option value="" className="bg-slate-800 text-white">Sélectionnez votre statut</option>
                  <option value="particulier" className="bg-slate-800 text-white">Particulier</option>
                  <option value="entrepreneur" className="bg-slate-800 text-white">Entrepreneur</option>
                  <option value="pasteur" className="bg-slate-800 text-white">Pasteur</option>
                  <option value="eglise" className="bg-slate-800 text-white">Église</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <i className="ri-arrow-down-s-line text-white/50"></i>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-2xl shadow-yellow-500/25"
            >
              {isSubmitting ? 'Inscription en cours...' : "S'inscrire maintenant"}
            </button>
          </form>

          {submitMessage && (
            <div
              className={`mt-6 p-4 rounded-xl text-center backdrop-blur-sm ${
                submitMessage.includes('réussie')
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {submitMessage}
            </div>
          )}

          <div className="mt-8 text-center text-sm text-white/60">
            <p>
              En vous inscrivant, vous acceptez de recevoir nos communications sur la formation
              Cash360.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}