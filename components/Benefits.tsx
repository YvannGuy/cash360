
'use client';
import React from 'react';

export default function Benefits() {
  const benefits = [
    {
      icon: 'ri-money-dollar-circle-fill',
      title: 'Liberté financière',
      description:
        'Apprenez à créer des revenus passifs et à optimiser vos investissements',
    },
    {
      icon: 'ri-line-chart-fill',
      title: 'Stratégies concrètes',
      description:
        'Des méthodes éprouvées et des outils pratiques pour gérer votre argent',
    },
    {
      icon: 'ri-eye-fill',
      title: 'Vision claire',
      description:
        'Développez une vision à long terme pour vos objectifs financiers',
    },
    {
      icon: 'ri-shield-check-fill',
      title: 'Transparence totale',
      description:
        'Une approche éthique et transparente de la gestion financière',
    },
    {
      icon: 'ri-team-fill',
      title: 'Communauté engagée',
      description:
        'Rejoignez une communauté de personnes partageant les mêmes valeurs',
    },
    {
      icon: 'ri-book-open-fill',
      title: 'Formation complète',
      description:
        'Un programme structuré adapté à votre niveau et vos besoins',
    },
  ];

  return (
    <section className="py-20 px-6 bg-transparent relative">
      {/* Background elements matching hero */}
      <div className="absolute inset-0">
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Benefits Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pourquoi choisir Cash360 ?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Découvrez les avantages qui font de Cash360 la référence en formation
            financière
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 border border-white/20 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="w-16 h-16 flex items-center justify-center bg-yellow-400/20 rounded-full mb-4 mx-auto border border-yellow-400/30">
                <i
                  className={`${benefit.icon} text-2xl text-yellow-400`}
                ></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 text-center">
                {benefit.title}
              </h3>
              <p className="text-white/70 text-center leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h3 className="text-3xl font-bold mb-4 text-white">
              Prêt à transformer votre vie financière ?
            </h3>
            <p className="text-xl mb-6 text-white/80">
              Rejoignez Cash360 dès aujourd'hui et prenez le contrôle de vos
              finances
            </p>
            <button
              onClick={() =>
                document
                  .getElementById('cash360-signup')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-3 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 hover:scale-105 transition-all duration-300 whitespace-nowrap cursor-pointer shadow-2xl shadow-yellow-500/25"
            >
              Commencer maintenant
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}