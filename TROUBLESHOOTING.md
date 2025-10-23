# 🔧 Guide de Dépannage - "Aucune analyse trouvée"

## 🚨 **Problème : Dashboard vide après soumission**

Si votre dashboard affiche toujours "aucune analyse trouvée" après avoir soumis le formulaire, suivez ce guide étape par étape.

## 📋 **Étapes de Diagnostic**

### **ÉTAPE 1 : Vérifier les Tables Supabase**

1. **Connectez-vous à Supabase**
2. **Allez dans "SQL Editor"**
3. **Exécutez cette requête pour vérifier les tables :**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('analyses', 'analysis_files');
```

**Résultat attendu :** Vous devriez voir les 2 tables listées.

### **ÉTAPE 2 : Créer les Tables (si manquantes)**

Si les tables n'existent pas, exécutez le script complet :

```sql
-- Copiez et exécutez tout le contenu du fichier setup-database.sql
-- Ou exécutez le script dans DATABASE_SETUP.md
```

### **ÉTAPE 3 : Tester avec l'Analyse de Démonstration**

1. **Allez sur votre dashboard** (`/dashboard`)
2. **Cliquez sur "Créer une analyse de test"**
3. **Vérifiez** si l'analyse apparaît

**Si ça marche :** Le problème vient de la création d'analyses lors de la soumission
**Si ça ne marche pas :** Le problème vient de la configuration Supabase

### **ÉTAPE 4 : Vérifier les Logs**

1. **Ouvrez la console du navigateur** (F12)
2. **Regardez les erreurs** lors du chargement du dashboard
3. **Regardez les erreurs** lors de la soumission du formulaire

## 🔍 **Solutions par Problème**

### **Problème 1 : Tables manquantes**

**Symptôme :** Erreur "relation does not exist"

**Solution :**
1. Exécutez le script SQL complet
2. Vérifiez que les tables sont créées
3. Rechargez le dashboard

### **Problème 2 : Politiques RLS trop restrictives**

**Symptôme :** Tables créées mais données non visibles

**Solution :**
```sql
-- Désactiver temporairement RLS pour tester
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_files DISABLE ROW LEVEL SECURITY;

-- Puis réactiver avec des politiques plus permissives
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_files ENABLE ROW LEVEL SECURITY;

-- Politique permissive pour les analyses
DROP POLICY IF EXISTS "Users can view their own analyses" ON analyses;
CREATE POLICY "Allow all for analyses" ON analyses FOR ALL USING (true);

-- Politique permissive pour les fichiers
DROP POLICY IF EXISTS "Users can view files of their analyses" ON analysis_files;
CREATE POLICY "Allow all for analysis_files" ON analysis_files FOR ALL USING (true);
```

### **Problème 3 : Variables d'environnement**

**Symptôme :** Erreur "Supabase configuration is missing"

**Solution :**
Vérifiez votre fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role
```

### **Problème 4 : Authentification**

**Symptôme :** Utilisateur non authentifié

**Solution :**
1. Vérifiez que vous êtes bien connecté
2. Vérifiez les cookies de session
3. Essayez de vous déconnecter et reconnecter

## 🧪 **Tests de Diagnostic**

### **Test 1 : Vérifier la Connexion Supabase**

Ajoutez temporairement ce code dans votre dashboard pour tester :

```typescript
// Dans useEffect du dashboard
const testSupabase = async () => {
  try {
    const { data, error } = await supabase.from('analyses').select('count')
    console.log('Test Supabase:', { data, error })
  } catch (err) {
    console.error('Erreur Supabase:', err)
  }
}
testSupabase()
```

### **Test 2 : Vérifier l'API d'Upload**

1. **Ouvrez la console du navigateur**
2. **Soumettez le formulaire**
3. **Regardez les logs** dans l'onglet Network
4. **Vérifiez** si l'API `/api/upload` retourne une erreur

### **Test 3 : Vérifier les Données**

Exécutez dans Supabase SQL Editor :

```sql
-- Vérifier si des analyses existent
SELECT * FROM analyses ORDER BY created_at DESC LIMIT 5;

-- Vérifier les fichiers
SELECT * FROM analysis_files ORDER BY created_at DESC LIMIT 5;
```

## 🚀 **Solution Rapide**

Si vous voulez une solution rapide pour tester :

1. **Exécutez le script SQL** pour créer les tables
2. **Cliquez sur "Créer une analyse de test"** dans le dashboard
3. **Vérifiez** que l'analyse apparaît

## 📞 **Support Avancé**

Si le problème persiste :

1. **Copiez les erreurs** de la console
2. **Vérifiez les logs Supabase** dans l'onglet Logs
3. **Testez avec des données de démonstration**

## ✅ **Vérification Finale**

Une fois que tout fonctionne :

1. ✅ **Tables créées** dans Supabase
2. ✅ **Analyse de test** visible dans le dashboard
3. ✅ **Soumission de formulaire** crée une analyse
4. ✅ **Dashboard** affiche les analyses
5. ✅ **Admin** peut voir toutes les analyses

## 🎯 **Résultat Attendu**

Après avoir suivi ce guide, votre dashboard devrait :
- Afficher les analyses créées
- Permettre la création de nouvelles analyses
- Montrer la progression des analyses
- Fonctionner correctement avec l'admin

Si vous avez encore des problèmes, partagez les erreurs de la console et je vous aiderai à les résoudre ! 🚀
