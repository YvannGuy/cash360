export const translations = {
  fr: {
    // Header
    header: {
      title: "Cash360",
      subtitle: "Formation Financière"
    },
    
    // Hero Section
    hero: {
      title: "Transformez votre relation à l'argent",
      subtitle: "Découvrez les secrets de la prospérité financière avec Cash360",
      description: "Rejoignez des milliers de personnes qui ont déjà révolutionné leur approche de l'argent grâce à notre formation exclusive.",
      cta: "Commencer maintenant",
      videoTitle: "Formation exclusive",
      watchVideo: "Regarder la vidéo"
    },
    
    // Signup Form
    signup: {
      title: "Commencez votre transformation financière",
      subtitle: "Comme des milliers d'autres, changez dès aujourd'hui votre manière de voir et gérer l'argent",
      socialProof: "personnes inscrites cette semaine",
      form: {
        fullName: "Nom complet",
        fullNamePlaceholder: "Votre nom complet",
        email: "Adresse email",
        emailPlaceholder: "votre@email.com",
        phone: "Numéro de téléphone",
        phonePlaceholder: "+33 6 12 34 56 78",
        status: "Votre statut",
        statusPlaceholder: "Sélectionnez votre statut",
        statusOptions: {
          particulier: "Particulier",
          entrepreneur: "Entrepreneur",
          pasteur: "Pasteur",
          eglise: "Église"
        },
        submit: "S'inscrire maintenant",
        submitting: "Inscription en cours...",
        success: "Inscription réussie ! Nous vous contacterons bientôt.",
        error: "Erreur lors de l'inscription. Veuillez réessayer.",
        disclaimer: "En vous inscrivant, vous acceptez de recevoir nos communications sur la formation Cash360."
      },
      notification: {
        title: "Nouvelle inscription !",
        message: "vient de s'inscrire"
      }
    },
    
    // Benefits Section
    benefits: {
      title: "Pourquoi choisir Cash360 ?",
      subtitle: "Une approche révolutionnaire de la gestion financière",
      items: [
        {
          icon: "💰",
          title: "Stratégies éprouvées",
          description: "Des méthodes testées et approuvées par des milliers de personnes"
        },
        {
          icon: "📈",
          title: "Résultats rapides",
          description: "Voyez des améliorations dès les premières semaines"
        },
        {
          icon: "🎯",
          title: "Approche personnalisée",
          description: "Adaptée à votre situation financière actuelle"
        },
        {
          icon: "👥",
          title: "Communauté active",
          description: "Rejoignez une communauté de personnes motivées"
        },
        {
          icon: "📚",
          title: "Formation complète",
          description: "Tous les outils nécessaires pour réussir"
        },
        {
          icon: "🛡️",
          title: "Support continu",
          description: "Accompagnement personnalisé tout au long du parcours"
        }
      ],
      // Titres des features dans le Hero
      heroFeatures: [
        {
          title: "100% Sécurisé",
          description: "Méthodes éprouvées et transparentes"
        },
        {
          title: "Apprentissage progressif",
          description: "Formation étape par étape"
        },
        {
          title: "Communauté VIP",
          description: "Support 24/7 d'experts"
        },
        {
          title: "Approche bienveillante",
          description: "Formation humaine et éthique"
        }
      ]
    },
    
    // Common
    common: {
      scrollToTop: "Remonter en haut"
    },
    
    // CTA Section
    cta: {
      title: "Prêt à transformer votre vie financière ?",
      subtitle: "Rejoignez Cash360 dès aujourd'hui et prenez le contrôle de vos finances"
    }
  },
  
  en: {
    // Header
    header: {
      title: "Cash360",
      subtitle: "Financial Training"
    },
    
    // Hero Section
    hero: {
      title: "Transform your relationship with money",
      subtitle: "Discover the secrets of financial prosperity with Cash360",
      description: "Join thousands of people who have already revolutionized their approach to money through our exclusive training.",
      cta: "Start now",
      videoTitle: "Exclusive training",
      watchVideo: "Watch video"
    },
    
    // Signup Form
    signup: {
      title: "Start your financial transformation",
      subtitle: "Like thousands of others, change today how you see and manage money",
      socialProof: "people registered this week",
      form: {
        fullName: "Full name",
        fullNamePlaceholder: "Your full name",
        email: "Email address",
        emailPlaceholder: "your@email.com",
        phone: "Phone number",
        phonePlaceholder: "+1 234 567 8900",
        status: "Your status",
        statusPlaceholder: "Select your status",
        statusOptions: {
          particulier: "Individual",
          entrepreneur: "Entrepreneur",
          pasteur: "Pastor",
          eglise: "Church"
        },
        submit: "Register now",
        submitting: "Registering...",
        success: "Registration successful! We will contact you soon.",
        error: "Registration error. Please try again.",
        disclaimer: "By registering, you agree to receive our communications about the Cash360 training."
      },
      notification: {
        title: "New registration!",
        message: "just registered"
      }
    },
    
    // Benefits Section
    benefits: {
      title: "Why choose Cash360?",
      subtitle: "A revolutionary approach to financial management",
      items: [
        {
          icon: "💰",
          title: "Proven strategies",
          description: "Methods tested and approved by thousands of people"
        },
        {
          icon: "📈",
          title: "Quick results",
          description: "See improvements from the first weeks"
        },
        {
          icon: "🎯",
          title: "Personalized approach",
          description: "Adapted to your current financial situation"
        },
        {
          icon: "👥",
          title: "Active community",
          description: "Join a community of motivated people"
        },
        {
          icon: "📚",
          title: "Complete training",
          description: "All the tools you need to succeed"
        },
        {
          icon: "🛡️",
          title: "Continuous support",
          description: "Personalized support throughout the journey"
        }
      ],
      // Titres des features dans le Hero
      heroFeatures: [
        {
          title: "100% Secure",
          description: "Proven and transparent methods"
        },
        {
          title: "Progressive learning",
          description: "Step-by-step training"
        },
        {
          title: "VIP Community",
          description: "24/7 expert support"
        },
        {
          title: "Caring approach",
          description: "Human and ethical training"
        }
      ]
    },
    
    // Common
    common: {
      scrollToTop: "Back to top"
    },
    
    // CTA Section
    cta: {
      title: "Ready to transform your financial life?",
      subtitle: "Join Cash360 today and take control of your finances"
    }
  }
};

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations.fr;
