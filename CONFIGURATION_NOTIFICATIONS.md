# 🔔 Configuration des Notifications Email

## 📋 Configuration Actuelle

Votre application envoie **automatiquement** deux emails lors de la validation du formulaire :

1. **Email Client** : Confirmation envoyée au client avec son ticket
2. **Email Admin** : Notification envoyée à `sndrush12@gmail.com` avec toutes les informations

---

## ⚙️ Configuration Requise

### 1. Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet avec ce contenu :

```env
# 📧 Configuration Email (Resend)
RESEND_API_KEY=votre_clé_api_resend
MAIL_FROM=Cash360 <no-reply@cash360.finance>
MAIL_ADMIN=sndrush12@gmail.com

# 🗄️ Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_publique_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_supabase
```

### 2. Obtenir une clé API Resend

1. Allez sur [https://resend.com](https://resend.com)
2. Créez un compte gratuit
3. Allez dans **API Keys**
4. Créez une nouvelle clé API
5. Copiez-la dans `RESEND_API_KEY`

**Plan gratuit Resend :** 100 emails/jour, 3 000 emails/mois

---

## 📧 Ce que vous recevrez à chaque validation

### Email envoyé à : `sndrush12@gmail.com`

**Sujet :**
```
[Cash360] Nouveau paiement reçu – [Prénom] [Nom] – [Ticket]
```

**Contenu :**
- ✅ Nom complet du client
- ✅ Email du client
- ✅ Mode de paiement (Virement ou PayPal)
- ✅ Message optionnel du client
- ✅ Liens de téléchargement des 3 relevés bancaires (valides 15 minutes)
- ✅ Numéro de ticket unique
- ✅ Date et heure de soumission

---

## 🔍 Vérification du système actuel

Le code dans `app/api/upload/route.ts` (ligne 110-114) envoie déjà l'email admin :

```typescript
await sendMail({
  to: process.env.MAIL_ADMIN || process.env.DESTINATION_EMAIL || 'cash@cash360.finance',
  subject: `[Cash360] Nouveau paiement reçu – ${validatedClientInfo.prenom} ${validatedClientInfo.nom} – ${ticket}`,
  html: adminEmailHtml
})
```

**Ordre de priorité pour l'adresse de destination :**
1. `MAIL_ADMIN` → **sndrush12@gmail.com** (si configuré)
2. `DESTINATION_EMAIL` → fallback
3. `cash@cash360.finance` → fallback par défaut

---

## 🚀 Actions à effectuer

### Étape 1 : Créer `.env.local`
```bash
# À la racine du projet
touch .env.local
```

Puis copiez-y la configuration ci-dessus.

### Étape 2 : Obtenir les clés API

#### Resend (Email)
- [https://resend.com/api-keys](https://resend.com/api-keys)

#### Supabase (Stockage)
- [https://supabase.com/dashboard/project/_/settings/api](https://supabase.com/dashboard/project/_/settings/api)

### Étape 3 : Redémarrer le serveur
```bash
npm run dev
```

### Étape 4 : Tester
1. Remplissez le formulaire sur votre site
2. Validez
3. Vérifiez votre boîte `sndrush12@gmail.com`

---

## 📱 Améliorer les notifications Gmail

Pour être alerté instantanément sur votre téléphone :

### Sur Android/iOS :
1. Installez l'app **Gmail**
2. Allez dans **Paramètres** → Votre compte
3. Activez **Notifications**
4. Choisissez **Toutes les notifications**

### Filtres Gmail recommandés :
1. Créez un filtre pour `[Cash360]` dans le sujet
2. Appliquez un **libellé de couleur** (ex: rouge)
3. Activez **Ne jamais envoyer dans spam**
4. **Toujours marquer comme important**

### Notification sonore personnalisée :
1. Gmail → Paramètres → Votre compte → Libellés
2. Créez un libellé "Cash360 Urgent"
3. Activez une sonnerie personnalisée pour ce libellé

---

## 🔧 Dépannage

### Je ne reçois pas les emails
1. Vérifiez que `MAIL_ADMIN=sndrush12@gmail.com` est dans `.env.local`
2. Vérifiez que `RESEND_API_KEY` est valide
3. Vérifiez les **spams** de Gmail
4. Vérifiez les logs du serveur : `console.log` dans le terminal

### Les liens de téléchargement expirent
- Les liens Supabase sont valides **15 minutes** seulement
- Téléchargez les fichiers immédiatement après réception de l'email
- Si expiré, les fichiers restent dans Supabase Storage

### Tester l'envoi d'email
Vous pouvez créer un endpoint de test si besoin.

---

## 📊 Statistiques et Monitoring

### Option 1 : Dashboard Resend
- Consultez [https://resend.com/emails](https://resend.com/emails)
- Voir tous les emails envoyés
- Statut de livraison
- Taux d'ouverture

### Option 2 : Logs serveur
Les logs sont affichés dans la console du serveur Next.js.

---

## 🎯 Prochaines améliorations possibles

1. **Notification Slack/Discord** en plus de l'email
2. **SMS** pour les paiements importants
3. **Dashboard admin** pour voir tous les tickets
4. **Statistiques** : nombre de formulaires par jour
5. **Notifications groupées** : résumé quotidien

---

Besoin d'aide pour configurer ? Contactez-moi ! 🚀

