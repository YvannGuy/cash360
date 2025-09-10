# Guide de déploiement Vercel pour Cash360

## ✅ Problème résolu

Le problème était que votre `next.config.ts` contenait `output: "export"` qui force un export statique, incompatible avec les API routes.

**Solution appliquée :**
- ✅ Suppression de `output: "export"`
- ✅ Configuration Vercel optimisée
- ✅ Support des API routes activé

## 🚀 Déploiement sur Vercel

### 1. Préparation
Assurez-vous d'avoir :
- Un compte Vercel (gratuit)
- Votre projet sur GitHub/GitLab
- Vos clés API Resend

### 2. Déploiement automatique
1. Connectez votre repository à Vercel
2. Vercel détectera automatiquement Next.js
3. Le build se fera sans erreur

### 3. Configuration des variables d'environnement
Dans le dashboard Vercel :

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez ces variables :

```
RESEND_API_KEY = re_votre_cle_api_resend
DESTINATION_EMAIL = votre-email@example.com
FROM_EMAIL = onboarding@resend.dev
```

### 4. Redéploiement
Après avoir ajouté les variables :
- Allez dans **Deployments**
- Cliquez sur **Redeploy** sur le dernier déploiement

## 🔧 Commandes de build

### Build local (pour tester)
```bash
npm run build
npm run start
```

### Build Vercel
Vercel utilise automatiquement :
```bash
npm run build
```

## 📋 Checklist de déploiement

- [ ] `output: "export"` supprimé de `next.config.ts`
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Clé API Resend valide
- [ ] Email de destination correct
- [ ] Test du formulaire après déploiement

## 🐛 Dépannage

### Erreur "Static export not supported"
- ✅ **Résolu** : Suppression de `output: "export"`

### Erreur 500 sur l'API
- Vérifiez les variables d'environnement
- Vérifiez la clé API Resend
- Consultez les logs Vercel

### Emails non reçus
- Vérifiez le dossier spam
- Vérifiez la configuration Resend
- Testez avec `onboarding@resend.dev`

## 🎯 Résultat attendu

Après déploiement :
- ✅ Site accessible sur Vercel
- ✅ Formulaire fonctionnel
- ✅ Emails reçus automatiquement
- ✅ Pas d'erreur de build
