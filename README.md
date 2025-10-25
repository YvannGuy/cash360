# Cash360 - Plateforme de Formation Financière

<div align="center">

<div style="background-color: white; display: inline-block; padding: 8px; border-radius: 8px;">
  <img src="public/images/logo/cashaz.jpg" alt="Cash360 Logo" width="300" />
</div>

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-3.0-green?style=for-the-badge&logo=supabase)

**Architecture Full-Stack moderne avec Next.js 15 et Supabase**

[🔗 Application Live](https://www.cash360.finance)

</div>

---

## Contexte & Vision

Cash360 est une plateforme SaaS de formation et d'accompagnement financier développée avec une approche B2C premium. Le projet démontre la mise en œuvre d'une architecture full-stack moderne combinant Next.js 15 (App Router), TypeScript, et Supabase pour créer une expérience utilisateur performante et scalable.

---

## Stack Technique & Justifications

### Frontend
- **Next.js 15.5 (App Router)** : Choix stratégique pour le Server-Side Rendering, l'optimisation automatique, et l'API Routes intégrées. L'App Router apporte routing basé sur les fichiers, layouts imbriqués, et streaming côté serveur.
- **TypeScript 5.0** : Typage strict pour réduire les erreurs runtime et améliorer la maintenabilité du code sur une base en croissance constante.
- **TailwindCSS 3.4** : Design system atomique permettant un développement rapide, une cohérence visuelle, et une maintenance simplifiée sans CSS customisé.
- **React 18** : Hooks modernes et Context API pour la gestion d'état côté client, animations, et composants réutilisables.

### Backend & Infrastructure
- **Supabase** : BaaS complet remplaçant un backend custom. Utilisé pour :
  - **Base de données PostgreSQL** avec Row Level Security (RLS) pour la sécurité granulaire
  - **Authentification** : JWT, sessions, réinitialisation de mot de passe
  - **Storage** : Upload sécurisé de documents financiers avec gestion des permissions
  - **Realtime** : Synchronisation automatique des données (non implémenté mais prêt)
- **Next.js API Routes** : Endpoints RESTful pour logique métier complexe, intégrations tierces (Calendly), et webhooks.

### Pourquoi ces choix ?
- **Time-to-market** : Supabase réduit le développement backend de 60% vs. API custom
- **Sécurité native** : RLS de PostgreSQL évite les failles d'autorisation courantes
- **Scalabilité** : Architecture serverless prête pour montée en charge
- **Coût** : Infra serverless = coûts variables vs. serveurs dédiés

---

## Architecture & Fonctionnalités

### Espace Utilisateur
- **Dashboard** : Vue d'ensemble des analyses financières avec suivi de progression en temps réel
- **Upload de documents** : Interface drag-and-drop pour relevés bancaires (3 fichiers max)
- **Système de tickets** : Génération automatique de tickets uniques pour traçabilité
- **Gestion de sessions** : Authentification JWT avec middleware de protection des routes
- **Intégrations** : Calendly pour rendez-vous, WhatsApp pour support client

### Espace Administrateur
- **Gestion multi-utilisateurs** : Vue centralisée avec pagination (10 items/page)
- **Workflow d'analyse** : États (En cours, En analyse, Terminée) avec progression visuelle
- **Upload de rapports** : Stockage sécurisé de PDFs dans Supabase Storage avec URLs signées
- **CRUD complet** : Création, modification, suppression d'analyses et d'utilisateurs
- **Export de données** : Téléchargement de relevés bancaires via signed URLs

### Simulateur Financier
- **Calcul en temps réel** : Analyse de l'équilibre revenus/dépenses côté client
- **Email gate** : Capture de leads avec consentement RGPD
- **Scoring** : Catégorisation automatique (sain, à améliorer, déséquilibré)
- **Intégration CTA** : Redirection vers Calendly post-simulation

---

## Architecture Technique

### Structure du Projet
```
app/
├── admin/                      # Routes protégées admin
│   ├── dashboard/             # Vue d'ensemble et gestion
│   └── login/                 # Authentification admin
├── dashboard/                  # Dashboard utilisateur
├── analyse-financiere/         # Formulaire de demande
├── api/                        # Endpoints RESTful
│   ├── admin/                 # Opérations admin (bypass RLS)
│   ├── upload/                # Upload de relevés bancaires
│   ├── leads/                 # Capture de leads
│   └── files/                 # Téléchargement sécurisé
├── simulation/                 # Simulateur interactif
└── login/                      # Page de connexion dédiée

components/                     # Composants réutilisables
lib/                            # Configuration et utilitaires
├── supabase.ts                 # Clients Supabase (client, admin)
├── database.ts                 # Queries réutilisables
└── validation.ts               # Schémas Zod
```

### Sécurité & Bonnes Pratiques
- **Row Level Security (RLS)** : Politiques PostgreSQL pour isolation des données
- **Middleware de protection** : Vérification des sessions JWT avant accès aux routes
- **Validation côté serveur** : Schémas Zod pour sanitization des inputs
- **Signed URLs** : Accès temporaire aux fichiers sensibles (60 min)
- **Service Role Key** : Utilisé uniquement côté serveur pour opérations admin

### Performance
- **Code splitting** : Chargement lazy des composants lourds
- **Image optimization** : Next.js Image avec formats modernes (WebP)
- **Caching** : Revalidation ISR pour contenu statique
- **Bundle optimization** : Analyse avec @next/bundle-analyzer

---

## Déploiement & Infrastructure

### Stack de Déploiement
- **Vercel** : Hosting serverless Next.js avec déploiement CI/CD automatique
- **Supabase Cloud** : Base de données PostgreSQL + Auth + Storage
- **Domain** : cash360.finance avec SSL automatique

### Variables d'Environnement
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Application
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_CALENDLY_URL=
```

### Workflow de Déploiement
1. Push sur `main` → Build automatique Vercel
2. Tests automatiques (à implémenter)
3. Déploiement en staging → Validation
4. Déploiement en production

---

## Métriques & Résultats

### Performance
- **Lighthouse Score** : 95+ (Performance, Accessibility, SEO)
- **Temps de chargement** : <2s (First Contentful Paint)
- **Bundle Size** : Optimisé avec tree-shaking automatique

### Fonctionnalités Livrées
- Authentification complète (inscription, connexion, mot de passe oublié)
- CRUD complet pour analyses et utilisateurs
- Upload/téléchargement sécurisé de fichiers
- Pagination et recherche dans l'admin
- Intégration Calendly et WhatsApp
- Capture de leads avec stockage Supabase

### Architecture Scalable
- **Scalabilité horizontale** : Architecture serverless permettant de supporter ~10k utilisateurs concurrents sans modifications majeures du code
- **Optimisations** : Cache tiers pour réduire les coûts Supabase, CDN Vercel pour assets statiques
- **Montée en charge** : Pas de serveur à dimensionner, scaling automatique par Vercel/Supabase

---

## Installation Locale

```bash
# Prérequis
Node.js >= 18.0
npm >= 9.0

# Clone du repository (si accès accordé)
git clone https://github.com/YvannGuy/cash360.git
cd cash360

# Installation des dépendances
npm install

# Configuration
cp .env.example .env.local
# Renseigner les clés Supabase dans .env.local

# Lancement du serveur de développement
npm run dev

# Build de production
npm run build
npm start
```

---

## Compétences Développées

### Technique
- Architecture full-stack Next.js avec App Router
- Intégration BaaS (Supabase) dans un workflow production
- Typage TypeScript avancé avec génériques et utilitaires
- Sécurité web (RLS, JWT, validation, sanitization)
- Optimisation de performance (lazy loading, caching, image optimization)
- API RESTful avec gestion d'erreurs robuste

### Product & UX
- Conception d'interfaces utilisateur intuitives et accessibles
- Responsive design mobile-first
- Gestion d'état complexe (auth, données, UI)
- Intégration d'APIs tierces (Calendly, WhatsApp)

### DevOps & Déploiement
- CI/CD avec Vercel
- Configuration d'environnements multi-étapes
- Monitoring et debugging en production

---

## Contact & Support

- **Application** : https://www.cash360.finance
- **GitHub** : [Repository privé]
- **Email** : contact@cash360.finance

---

## Licence

MIT License - Voir [LICENSE](LICENSE) pour détails complets.

---

<div align="center">

**Cash360** - Plateforme de Formation Financière

*Développée avec Next.js 15, TypeScript, et Supabase*

[🔗 Application Live](https://www.cash360.finance)

</div>