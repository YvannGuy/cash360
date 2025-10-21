# 📊 Page d'Analyse Financière - Cash360

Cette page permet aux clients de soumettre leurs relevés bancaires pour une analyse approfondie de leurs finances par Pasteur Myriam Konan.

## 🚀 Fonctionnalités

- **Formulaire sécurisé** avec validation Zod
- **Upload de 3 relevés bancaires** (PDF, PNG, JPG)
- **Deux modes de paiement** : Virement bancaire ou PayPal
- **Stockage sécurisé** des fichiers dans Supabase Storage
- **Emails automatiques** via Resend (admin + client)
- **URLs signées** pour l'accès aux fichiers (expiration 15 min)
- **Conformité RGPD** avec consentement explicite

## 📋 Prérequis

- Node.js 18+
- Compte Supabase
- Compte Resend
- Compte PayPal (optionnel)

## ⚙️ Installation

### 1. Installer les dépendances

```bash
npm install @supabase/supabase-js resend zod uuid
npm install -D @types/uuid
```

### 2. Configuration Supabase

#### Créer un bucket privé `releves`

1. Allez dans votre dashboard Supabase
2. Naviguez vers **Storage** → **Buckets**
3. Cliquez sur **New bucket**
4. Nom : `releves`
5. **Important** : Cochez **Private** (pas public)
6. Créez le bucket

#### Configurer les politiques RLS

Dans l'onglet **Storage** → **Policies** du bucket `releves` :

```sql
-- Politique pour permettre l'upload depuis le serveur
CREATE POLICY "Enable upload for service role" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'releves');

-- Politique pour permettre la lecture depuis le serveur
CREATE POLICY "Enable read for service role" ON storage.objects
FOR SELECT USING (bucket_id = 'releves');
```

### 3. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# URL publique de votre site
NEXT_PUBLIC_SITE_URL=https://cash360.finance

# Supabase (récupérez dans Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Resend (récupérez dans votre dashboard Resend)
RESEND_API_KEY=re_votre_api_key

# Configuration email
MAIL_FROM="Cash360 <no-reply@cash360.finance>"
MAIL_ADMIN="contact@cash360.finance"

# reCAPTCHA (optionnel)
# RECAPTCHA_SECRET=votre_secret_key
```

### 4. Vérification des domaines

#### Supabase
- Assurez-vous que votre domaine est autorisé dans **Settings** → **API** → **Site URL**

#### Resend
- Vérifiez votre domaine dans **Settings** → **Domains**
- Ou utilisez `onboarding@resend.dev` pour les tests

## 🧪 Tests

### Test manuel complet

1. **Accédez à** `/analyse-financiere`
2. **Sélectionnez** un mode de paiement
3. **Si virement** : téléversez un justificatif
4. **Remplissez** le formulaire client
5. **Téléversez** exactement 3 relevés (PDF/PNG/JPG, max 10 Mo)
6. **Cochez** le consentement RGPD
7. **Soumettez** le formulaire
8. **Vérifiez** la redirection vers la page succès
9. **Vérifiez** les emails reçus (admin + client)

### Tests d'erreurs

- **< 3 fichiers** → Erreur attendue
- **Fichier trop lourd** → Erreur attendue
- **Mauvais format** → Erreur attendue
- **Virement sans justificatif** → Erreur attendue
- **Consentement non coché** → Erreur attendue

## 📁 Structure des fichiers

```
app/
├── analyse-financiere/
│   ├── page.tsx                 # Page principale
│   └── succes/
│       └── page.tsx            # Page de confirmation
└── api/
    └── upload/
        └── route.ts            # API route pour traitement

components/
├── Field.tsx                   # Composant input générique
└── UploadDropzone.tsx          # Zone de drag & drop

lib/
├── mail.ts                     # Client Resend
├── supabase.ts                 # Clients Supabase
└── validation.ts               # Schémas Zod
```

## 🔐 Sécurité

### Stockage des fichiers
- **Bucket privé** Supabase
- **URLs signées** avec expiration 15 minutes
- **Validation côté serveur** des types et tailles
- **Pas de clés exposées** côté client

### Données personnelles
- **Pas de logging** des numéros de compte
- **Consentement RGPD** explicite
- **Traitement limité** aux fins d'analyse
- **Accès restreint** aux fichiers

## 📧 Templates d'emails

### Email Admin
- **Sujet** : `[Cash360] Nouveau dossier d'analyse – {Nom} – {ticket}`
- **Contenu** : Infos client + liens signés vers fichiers
- **Liens** : Expiration 15 minutes

### Email Client
- **Sujet** : `Cash360 – Confirmation de réception de vos documents – {ticket}`
- **Contenu** : Remerciement + délais + contact support

## 🚨 Dépannage

### Erreur Supabase
```
Error: Missing Supabase environment variables
```
→ Vérifiez vos variables d'environnement

### Erreur Resend
```
Error: Invalid API key
```
→ Vérifiez votre clé API Resend

### Erreur upload
```
Error: Failed to upload file
```
→ Vérifiez les politiques RLS du bucket

### Emails non reçus
1. Vérifiez les spams
2. Vérifiez le domaine Resend
3. Consultez les logs serveur

## 📊 Monitoring

### Logs à surveiller
- Uploads de fichiers réussis/échoués
- Génération d'URLs signées
- Envoi d'emails (succès/échec)
- Erreurs de validation

### Métriques importantes
- Nombre de soumissions par jour
- Taux d'erreur d'upload
- Délai de traitement des emails

## 🔄 Maintenance

### Nettoyage des fichiers
- Les fichiers restent dans Supabase Storage
- Pas de suppression automatique
- Nettoyage manuel recommandé périodiquement

### Mise à jour des prix
- Modifier le prix dans `/app/analyse-financiere/page.tsx`
- Mettre à jour l'URL PayPal si nécessaire

## 📞 Support

Pour toute question technique :
- **Email** : contact@cash360.finance
- **Documentation** : Ce README
- **Logs** : Console serveur pour debugging

## 🎯 Roadmap

### Fonctionnalités futures
- [ ] Intégration Stripe Checkout
- [ ] Dashboard admin pour voir les dossiers
- [ ] Notifications push pour nouveaux dossiers
- [ ] Export des analyses en PDF
- [ ] Système de tickets de support

### Améliorations
- [ ] reCAPTCHA pour anti-spam
- [ ] Compression automatique des images
- [ ] Sauvegarde automatique des brouillons
- [ ] Historique des soumissions client
