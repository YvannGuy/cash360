
'use client';
import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function Benefits() {
  const { t } = useLanguage();

  return (
    <section className="py-20 px-6 bg-transparent relative">
      {/* Background elements matching hero */}
      <div className="absolute inset-0">
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10 px-4">
        {/* Benefits Section */}
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            {t.benefits.title}
          </h2>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            {t.benefits.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-20">
          {t.benefits.items.map((benefit, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 border border-white/20 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="w-16 h-16 flex items-center justify-center bg-yellow-400/20 rounded-full mb-4 mx-auto border border-yellow-400/30">
                <span className="text-2xl">
                  {benefit.icon}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 text-center">
                {benefit.title}
              </h3>
              <p className="text-white/70 text-center leading-relaxed text-sm sm:text-base">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
              {t.cta.title}
            </h3>
            <p className="text-lg sm:text-xl mb-6 text-white/80">
              {t.cta.subtitle}
            </p>
            <button
              onClick={() =>
                document
                  .getElementById('cash360-signup')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-3 px-6 sm:px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 hover:scale-105 transition-all duration-300 whitespace-nowrap cursor-pointer shadow-2xl shadow-yellow-500/25 text-sm sm:text-base"
            >
              {t.hero.cta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}