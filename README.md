# 💰 Cash360 - Formation Financière

<div align="center">

![Cash360](https://img.shields.io/badge/Cash360-Formation%20Financière-yellow?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

**Transformez votre relation à l'argent avec Cash360**

Une plateforme moderne de formation financière pour particuliers, entrepreneurs, pasteurs et églises.

[🚀 Démo Live](#) | [📚 Documentation](#) | [💬 Support](#)

</div>

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Installation](#-installation)
- [Structure du projet](#-structure-du-projet)
- [Configuration](#-configuration)
- [Déploiement](#-déploiement)
- [Licence](#-licence)

---

## 🎯 À propos

**Cash360** est une plateforme de formation financière innovante conçue pour aider les personnes à transformer leur approche de l'argent et à atteindre la prospérité financière.

Notre mission est de fournir une **formation accessible, éthique et efficace** qui s'adapte aux besoins spécifiques de chaque profil :
- 👤 **Particuliers** - Gérez mieux votre budget personnel
- 💼 **Entrepreneurs** - Développez votre business avec intelligence
- ⛪ **Pasteurs & Églises** - Gérez les finances de votre communauté

### 🌟 Pourquoi Cash360 ?

- ✅ **Plus de 1000 personnes** ont déjà transformé leur relation à l'argent
- ✅ **Résultats visibles** dès les premières 30 jours
- ✅ **Support 24/7** par des experts en finance
- ✅ **Approche éthique** et bienveillante
- ✅ **Communauté active** pour se motiver ensemble

---

## 🚀 Fonctionnalités

### 🎬 Espace de présentation

- **Vidéo de formation exclusive** intégrée directement sur la page d'accueil
- **Design moderne** avec des animations et effets de glassmorphism
- **Interface responsive** optimisée pour mobile, tablette et desktop
- **Basculement multilingue** (Français/Anglais) en un clic

### 📝 Système d'inscription intelligent

- **Formulaire optimisé** avec validation en temps réel
- **Catégorisation par profil** : Particulier, Entrepreneur, Pasteur, Église
- **Notifications automatiques** par email via Resend
- **Protection des données** et conformité RGPD
- **Interface intuitive** avec feedback visuel instantané

### 💎 Avantages mis en avant

Le site présente **6 avantages clés** de la formation :

1. **💰 Stratégies éprouvées** - Des méthodes testées par des milliers de personnes
2. **📈 Résultats rapides** - Améliorations visibles dès les premières semaines
3. **🎯 Approche personnalisée** - Adaptée à votre situation financière
4. **👥 Communauté active** - Un réseau de personnes motivées
5. **📚 Formation complète** - Tous les outils nécessaires pour réussir
6. **🛡️ Support continu** - Accompagnement personnalisé tout au long du parcours

### 🔐 Fonctionnalités techniques

- **Internationalisation (i18n)** - Support FR/EN avec contexte React
- **Optimisation SEO** - Meta tags, Open Graph, performances
- **API Routes** - Endpoints Next.js pour le traitement des inscriptions
- **Animations fluides** - Transitions et effets visuels modernes
- **Accessibilité** - Respect des normes WCAG
- **Performance** - Chargement ultra-rapide et optimisé

### 📊 Indicateurs de confiance

- **Compteur d'inscriptions** - Preuve sociale en temps réel
- **Statistiques visuelles** - 20 inscriptions/semaine, Support 24h, Résultats en 30j
- **Témoignages** - Retours d'expérience de la communauté
- **Garanties de sécurité** - Paiement sécurisé et méthodes transparentes

---

## 🛠️ Technologies utilisées

### Frontend

- **[Next.js 15.5](https://nextjs.org/)** - Framework React avec App Router
- **[React 18](https://react.dev/)** - Bibliothèque UI moderne
- **[TypeScript 5](https://www.typescriptlang.org/)** - Typage statique
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Framework CSS utility-first
- **[Remix Icon](https://remixicon.com/)** - Bibliothèque d'icônes

### Backend & Services

- **[Resend](https://resend.com/)** - Service d'envoi d'emails transactionnels
- **API Routes Next.js** - Endpoints serverless
- **[Vercel](https://vercel.com/)** - Plateforme de déploiement

### Outils de développement

- **ESLint** - Linter JavaScript/TypeScript
- **PostCSS** - Transformation CSS
- **Autoprefixer** - Préfixes CSS automatiques

---

## 📦 Installation

### Prérequis

- **Node.js** 18.x ou supérieur
- **npm**, **yarn**, **pnpm** ou **bun**
- Un compte [Resend](https://resend.com/) pour les emails

### Installation locale

1. **Clonez le dépôt**

```bash
git clone https://github.com/votre-username/cash360.git
cd cash360
```

2. **Installez les dépendances**

```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

3. **Configurez les variables d'environnement**

Créez un fichier `.env.local` à la racine du projet :

```env
# Resend API Key
RESEND_API_KEY=your_resend_api_key_here

# Email de destination pour les notifications
NOTIFICATION_EMAIL=admin@cash360.com
```

4. **Lancez le serveur de développement**

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

5. **Ouvrez votre navigateur**

Accédez à [http://localhost:3000](http://localhost:3000) pour voir le résultat.

---

## 📁 Structure du projet

```
cash360/
├── app/                          # App Router Next.js
│   ├── api/                     # API Routes
│   │   └── signup/              # Endpoint d'inscription
│   │       └── route.ts         # Handler POST pour les inscriptions
│   ├── globals.css              # Styles globaux
│   ├── layout.tsx               # Layout principal
│   ├── not-found.tsx            # Page 404 personnalisée
│   └── page.tsx                 # Page d'accueil
│
├── components/                   # Composants React réutilisables
│   ├── Benefits.tsx             # Section des avantages
│   ├── Header.tsx               # En-tête du site
│   ├── Hero.tsx                 # Section héro avec vidéo
│   ├── LanguageSwitch.tsx       # Sélecteur de langue
│   └── SignupForm.tsx           # Formulaire d'inscription
│
├── lib/                         # Utilitaires et contextes
│   ├── LanguageContext.tsx      # Contexte i18n
│   └── translations.ts          # Traductions FR/EN
│
├── public/                      # Assets statiques
│
├── .eslintrc.json              # Configuration ESLint
├── eslint.config.mjs           # Configuration ESLint (module)
├── next.config.ts              # Configuration Next.js
├── package.json                # Dépendances du projet
├── postcss.config.mjs          # Configuration PostCSS
├── tailwind.config.js          # Configuration Tailwind CSS
├── tsconfig.json               # Configuration TypeScript
└── vercel.json                 # Configuration Vercel
```

### 🗂️ Détails des composants

#### `Hero.tsx`
- Vidéo de présentation Vimeo
- Logo Cash360
- CTA (Call-to-Action) avec scroll automatique
- 4 features clés avec icônes
- Statistiques en temps réel
- Modal vidéo plein écran

#### `SignupForm.tsx`
- Formulaire d'inscription avec validation
- Sélection du statut (Particulier/Entrepreneur/Pasteur/Église)
- Envoi via API Route Next.js
- Messages de succès/erreur
- Animation de chargement

#### `Benefits.tsx`
- Grille de 6 avantages avec icônes
- CTA de conversion
- Animations au survol
- Design glassmorphism

#### `LanguageSwitch.tsx`
- Toggle FR/EN avec drapeaux
- Sauvegarde de la préférence
- Transition fluide

---

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `RESEND_API_KEY` | Clé API Resend pour l'envoi d'emails | ✅ Oui |
| `NOTIFICATION_EMAIL` | Email de destination des notifications | ✅ Oui |

### Configuration Next.js

Le projet utilise les fonctionnalités suivantes de Next.js :
- **App Router** - Architecture moderne
- **Server Components** - Performance optimale
- **API Routes** - Endpoints serverless
- **Image Optimization** - Chargement d'images optimisé
- **Font Optimization** - Chargement de fonts optimisé

### Configuration Tailwind

Le projet utilise un thème personnalisé avec :
- **Glassmorphism** - Effets de verre
- **Animations personnalisées** - Pulse, fade, etc.
- **Gradients** - Dégradés de couleurs
- **Responsive breakpoints** - Mobile-first

---

## 🚀 Déploiement

### Déploiement sur Vercel (recommandé)

1. **Connectez votre dépôt GitHub à Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

2. **Configurez les variables d'environnement** dans le dashboard Vercel

3. **Déployez** - Le déploiement se fait automatiquement à chaque push

### Déploiement manuel

```bash
# Build de production
npm run build

# Lancement du serveur de production
npm start
```

### Configuration Vercel

Le fichier `vercel.json` configure :
- Les headers de sécurité
- Les redirections
- Les rewrites
- Les variables d'environnement

---

## 📈 Scripts disponibles

```json
{
  "dev": "next dev",           // Serveur de développement
  "build": "next build",       // Build de production
  "start": "next start",       // Serveur de production
  "lint": "next lint"         // Vérification du code
}
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📞 Support

Besoin d'aide ?

- 📧 Email : support@cash360.com
- 💬 Discord : [Rejoindre la communauté](#)
- 📱 WhatsApp : +33 6 12 34 56 78
- 🌐 Site web : [www.cash360.com](#)

---

## 📝 Licence

Ce projet est sous licence propriétaire. Tous droits réservés © 2025 Cash360.

---

<div align="center">

**Fait avec ❤️ par l'équipe Cash360**

[⬆ Retour en haut](#-cash360---formation-financière)

</div>
