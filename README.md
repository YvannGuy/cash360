# 💰 Cash360 - Formation Financière

<div align="center">

<img src="public/images/logo/logofinal.png" alt="Cash360 Logo" width="300" />

![Cash360](https://img.shields.io/badge/Cash360-Formation%20Financière-yellow?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

**Transformez votre relation à l'argent avec Cash360**

Une plateforme moderne de formation financière pour particuliers, entrepreneurs, pasteurs et églises.

[🚀 Démo Live](https://www.cash360.finance)

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

- **[Supabase](https://supabase.com/)** - Base de données PostgreSQL et authentification
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
- Un compte [Supabase](https://supabase.com/) pour la base de données
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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

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
│   │   ├── admin/               # Endpoints admin
│   │   │   ├── analyses/        # Gestion des analyses
│   │   │   └── upload-pdf/      # Upload de PDF
│   │   ├── auth/                # Authentification
│   │   │   └── callback/        # Callback Supabase
│   │   ├── test/                # Endpoints de diagnostic
│   │   │   ├── check-storage/   # Vérification Storage
│   │   │   ├── create-bucket/   # Création bucket
│   │   │   └── test-pdf-upload/ # Test upload PDF
│   │   ├── upload/              # Upload d'analyses
│   │   └── user/                # Endpoints utilisateur
│   ├── admin/                   # Interface administrateur
│   │   ├── dashboard/           # Dashboard admin
│   │   └── login/               # Connexion admin
│   ├── auth/                    # Pages d'authentification
│   ├── dashboard/               # Dashboard utilisateur
│   ├── analyse-financiere/      # Formulaire d'analyse
│   ├── globals.css              # Styles globaux
│   ├── layout.tsx               # Layout principal
│   ├── not-found.tsx            # Page 404 personnalisée
│   ├── page.tsx                 # Page d'accueil
│   └── middleware.ts            # Middleware d'authentification
│
├── components/                   # Composants React réutilisables
│   ├── AdminPdfUploadModal.tsx  # Modal d'upload PDF admin
│   ├── AuthModal.tsx            # Modal d'authentification
│   ├── Benefits.tsx             # Section des avantages
│   ├── CTASection.tsx           # Section call-to-action
│   ├── Features.tsx             # Section des fonctionnalités
│   ├── Footer.tsx               # Pied de page
│   ├── Header.tsx               # En-tête du site
│   ├── Hero.tsx                 # Section héro avec vidéo
│   ├── LanguageSwitch.tsx       # Sélecteur de langue
│   ├── LiveTikTok.tsx           # Section TikTok live
│   ├── Navbar.tsx               # Navigation principale
│   ├── SignupForm.tsx           # Formulaire d'inscription
│   ├── Steps.tsx                # Section des étapes
│   └── About.tsx                # Section à propos
│
├── lib/                         # Utilitaires et contextes
│   ├── LanguageContext.tsx      # Contexte i18n
│   ├── translations.ts          # Traductions FR/EN
│   ├── supabase.ts             # Configuration Supabase
│   └── database.ts             # Services base de données
│
├── public/                      # Assets statiques
│
├── .eslintrc.json              # Configuration ESLint
├── eslint.config.mjs           # Configuration ESLint (module)
├── next.config.ts              # Configuration Next.js
├── package.json                # Dépendances du projet
├── postcss.config.mjs          # Configuration PostCSS
├── setup-database.sql          # Script de création de la base de données
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
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | ✅ Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | ✅ Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | ✅ Oui |
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

### Configuration Supabase

#### 1. Création du projet Supabase

1. Créez un compte sur [Supabase](https://supabase.com/)
2. Créez un nouveau projet
3. Notez l'URL et les clés API dans les paramètres du projet

#### 2. Configuration de la base de données

Exécutez le script SQL fourni dans `setup-database.sql` pour créer les tables nécessaires :

```sql
-- Tables principales
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT DEFAULT 'en_cours',
  progress INTEGER DEFAULT 10,
  pdf_url TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Politiques RLS (Row Level Security)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id OR client_email = auth.email());

CREATE POLICY "Users can insert their own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON analyses
  FOR UPDATE USING (auth.uid() = user_id);
```

#### 3. Configuration du Storage Supabase

**⚠️ IMPORTANT :** Le bucket `analyses` est requis pour l'upload de PDF.

##### Option A : Création automatique (Recommandée)

1. Connectez-vous à l'espace admin : `/admin/login`
2. Cliquez sur le bouton **"📁 Storage"** pour diagnostiquer
3. Si le bucket n'existe pas, il sera créé automatiquement

##### Option B : Création manuelle

1. Allez dans **Storage** dans votre dashboard Supabase
2. Créez un nouveau bucket nommé `analyses`
3. Configurez les paramètres :
   - **Public** : ✅ Activé
   - **File size limit** : 10 MB
   - **Allowed MIME types** : `application/pdf`

##### Option C : Via l'API

```bash
curl -X POST "https://your-project.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyses",
    "public": true,
    "file_size_limit": 10485760,
    "allowed_mime_types": ["application/pdf"]
  }'
```

#### 4. Configuration de l'authentification

1. Activez l'authentification par email dans Supabase
2. Configurez les templates d'email si nécessaire
3. Définissez les URL de redirection :
   - **Site URL** : `http://localhost:3000` (développement)
   - **Redirect URLs** : `http://localhost:3000/auth/callback`

#### 5. Test de la configuration

Utilisez les outils de diagnostic intégrés :

1. **Diagnostic général** : Bouton "🔍 Diagnostic" dans l'espace admin
2. **Diagnostic Storage** : Bouton "📁 Storage" dans l'espace admin  
3. **Test PDF Upload** : Bouton "🧪 Test PDF" dans l'espace admin

Ces boutons vérifient :
- ✅ Connexion à Supabase
- ✅ Existence du bucket `analyses`
- ✅ Permissions de lecture/écriture
- ✅ Fonctionnement de l'upload PDF

#### 6. Résolution des problèmes courants

##### Erreur : "Le bucket analyses n'existe pas"
```bash
# Solution : Utilisez le bouton "📁 Storage" dans l'admin
# Ou créez le bucket manuellement dans Supabase Storage
```

##### Erreur : "Configuration Supabase manquante"
```bash
# Vérifiez vos variables d'environnement dans .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

##### Erreur : "Permissions insuffisantes"
```bash
# Vérifiez que la SERVICE_ROLE_KEY a les bonnes permissions
# Elle doit avoir accès au Storage et à la base de données
```

---

## 🚀 Déploiement

### Déploiement sur Vercel (recommandé)

1. **Connectez votre dépôt GitHub à Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

2. **Configurez les variables d'environnement** dans le dashboard Vercel :

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NOTIFICATION_EMAIL`

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
- 🌐 Site web : [www.cash360.com](#)

---

## 📝 Licence

Ce projet est sous licence propriétaire. Tous droits réservés © 2025 Cash360.

---

<div align="center">

**Fait avec ❤️ par l'équipe Cash360**

[⬆ Retour en haut](#-cash360---formation-financière)

</div>
