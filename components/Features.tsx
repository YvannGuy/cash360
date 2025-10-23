'use client'

export default function Features() {
  const features = [
    {
      icon: "🔍",
      title: "Analyse claire et précise",
      description: "Diagnostic complet de votre situation financière avec des recommandations concrètes et actionables.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: "⚖️",
      title: "Accompagnement bienveillant et structuré",
      description: "Suivi personnalisé avec des étapes claires pour retrouver l'équilibre financier sans stress.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: "❤️",
      title: "Approche alliant foi et intelligence financière",
      description: "Méthodes qui respectent vos valeurs spirituelles tout en appliquant les meilleures pratiques financières.",
      color: "from-purple-500 to-purple-600"
    }
  ]

  const additionalFeatures = [
    {
      icon: "🎯",
      title: "Objectifs personnalisés",
      description: "Plan d'action adapté à votre situation unique"
    },
    {
      icon: "🛡️",
      title: "Confidentialité totale",
      description: "Vos données sont protégées et traitées en toute sécurité"
    },
    {
      icon: "📈",
      title: "Résultats mesurables",
      description: "Suivi des progrès avec des indicateurs clairs"
    }
  ]

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Pourquoi choisir{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Cash360
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une approche unique qui combine expertise financière et accompagnement spirituel 
            pour vous aider à retrouver la paix et la prospérité.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index}>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div>
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Nos engagements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {additionalFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{feature.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl p-8 text-gray-900">
            <h3 className="text-2xl font-bold mb-4">
              Prêt(e) à transformer votre relation à l'argent ?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Rejoignez les centaines de personnes qui ont déjà retrouvé l'équilibre financier
            </p>
            <button
              onClick={() => {
                const modal = document.getElementById('calendly-modal');
                if (modal) modal.style.display = 'block';
              }}
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Commencer maintenant
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}