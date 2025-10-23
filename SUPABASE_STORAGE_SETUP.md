# 📁 Configuration Supabase Storage - Bucket "analyses"

Ce guide explique comment configurer le bucket Supabase Storage pour l'upload de PDF dans Cash360.

## 🎯 Objectif

Le bucket `analyses` est utilisé pour stocker les fichiers PDF des analyses financières uploadés par les administrateurs.

## 🚀 Configuration rapide

### Option 1 : Création automatique (Recommandée)

1. **Connectez-vous à l'espace admin** : `https://votre-domaine.com/admin/login`
2. **Cliquez sur "📁 Storage"** dans le dashboard admin
3. **Le bucket sera créé automatiquement** s'il n'existe pas

### Option 2 : Création manuelle

1. **Connectez-vous à Supabase** : https://supabase.com/dashboard
2. **Allez dans Storage** dans le menu de gauche
3. **Cliquez sur "New bucket"**
4. **Configurez le bucket** :
   - **Name** : `analyses`
   - **Public bucket** : ✅ Activé
   - **File size limit** : `10485760` (10 MB)
   - **Allowed MIME types** : `application/pdf`

## ⚙️ Configuration détaillée

### Paramètres du bucket

```json
{
  "name": "analyses",
  "public": true,
  "file_size_limit": 10485760,
  "allowed_mime_types": ["application/pdf"]
}
```

### Structure des fichiers

```
analyses/
├── analysis-{uuid}-{timestamp}.pdf
├── analysis-{uuid}-{timestamp}.pdf
└── ...
```

### Permissions requises

Le bucket doit avoir les permissions suivantes :

- ✅ **Lecture publique** : Pour permettre le téléchargement des PDF
- ✅ **Écriture service role** : Pour l'upload depuis l'API admin
- ✅ **Suppression service role** : Pour le nettoyage des fichiers de test

## 🔧 Vérification de la configuration

### 1. Diagnostic automatique

Utilisez les boutons de diagnostic dans l'espace admin :

- **🔍 Diagnostic** : Vérifie la connexion Supabase
- **📁 Storage** : Vérifie l'existence et les permissions du bucket
- **🧪 Test PDF** : Teste l'upload d'un fichier PDF

### 2. Vérification manuelle

```bash
# Test de l'API de vérification
curl -X GET "https://votre-domaine.com/api/test/check-storage"
```

### 3. Test d'upload

```bash
# Test d'upload PDF
curl -X POST "https://votre-domaine.com/api/test/test-pdf-upload"
```

## 🚨 Résolution des problèmes

### Erreur : "Le bucket analyses n'existe pas"

**Cause** : Le bucket n'a pas été créé dans Supabase Storage.

**Solution** :
1. Utilisez le bouton "📁 Storage" dans l'espace admin
2. Ou créez le bucket manuellement dans Supabase
3. Ou utilisez l'API de création :

```bash
curl -X POST "https://votre-domaine.com/api/test/create-bucket"
```

### Erreur : "Permissions insuffisantes"

**Cause** : La SERVICE_ROLE_KEY n'a pas les bonnes permissions.

**Solution** :
1. Vérifiez que la SERVICE_ROLE_KEY est correcte
2. Assurez-vous qu'elle a accès au Storage
3. Vérifiez les politiques RLS si nécessaire

### Erreur : "File size limit exceeded"

**Cause** : Le fichier PDF dépasse la limite de 10MB.

**Solution** :
1. Réduisez la taille du fichier PDF
2. Ou augmentez la limite dans la configuration du bucket

### Erreur : "Invalid MIME type"

**Cause** : Le fichier n'est pas un PDF valide.

**Solution** :
1. Vérifiez que le fichier est bien un PDF
2. Assurez-vous que l'extension est `.pdf`
3. Vérifiez le contenu du fichier

## 📋 Checklist de configuration

- [ ] Projet Supabase créé
- [ ] Variables d'environnement configurées
- [ ] Bucket `analyses` créé
- [ ] Bucket configuré comme public
- [ ] Limite de taille définie (10MB)
- [ ] Types MIME autorisés (application/pdf)
- [ ] SERVICE_ROLE_KEY configurée
- [ ] Test d'upload réussi
- [ ] Test de téléchargement réussi

## 🔗 Liens utiles

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [API Supabase Storage](https://supabase.com/docs/reference/javascript/storage-api)
- [Politiques RLS Supabase](https://supabase.com/docs/guides/auth/row-level-security)

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans la console du navigateur
2. Utilisez les outils de diagnostic intégrés
3. Consultez la documentation Supabase
4. Contactez le support technique

---

**Note** : Ce bucket est essentiel au fonctionnement de l'upload PDF. Assurez-vous qu'il est correctement configuré avant d'utiliser l'application en production.
