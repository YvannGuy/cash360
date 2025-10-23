# 🗄️ Configuration de la Base de Données - Cash360

## 🚨 **IMPORTANT : Configuration Requise**

Pour que le dashboard affiche les analyses (au lieu de "aucune analyse trouvée"), vous devez **obligatoirement** créer les tables dans votre base de données Supabase.

## 📋 Étapes de Configuration

### 1. **Accéder à Supabase**

1. Connectez-vous à votre projet Supabase
2. Allez dans l'onglet **"SQL Editor"**
3. Cliquez sur **"New Query"**

### 2. **Exécuter le Script SQL**

Copiez et collez ce script complet dans l'éditeur SQL :

```sql
-- Table des analyses
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'en_analyse', 'terminee')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  mode_paiement TEXT NOT NULL,
  message TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des fichiers d'analyse
CREATE TABLE IF NOT EXISTS analysis_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT DEFAULT 'document',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analysis_files_analysis_id ON analysis_files(analysis_id);

-- RLS (Row Level Security)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_files ENABLE ROW LEVEL SECURITY;

-- Politique pour les analyses
CREATE POLICY "Users can view their own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour les fichiers d'analyse
CREATE POLICY "Users can view files of their analyses" ON analysis_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses 
      WHERE analyses.id = analysis_files.analysis_id 
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files to their analyses" ON analysis_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses 
      WHERE analyses.id = analysis_files.analysis_id 
      AND analyses.user_id = auth.uid()
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. **Exécuter le Script**

1. Cliquez sur **"Run"** pour exécuter le script
2. Vérifiez qu'il n'y a pas d'erreurs
3. Vous devriez voir "Success. No rows returned"

### 4. **Vérifier la Création**

1. Allez dans l'onglet **"Table Editor"**
2. Vous devriez voir les tables :
   - `analyses`
   - `analysis_files`

## ✅ **Test de Fonctionnement**

Après avoir créé les tables :

1. **Connectez-vous** à votre application
2. **Créez une nouvelle analyse** via le formulaire
3. **Retournez sur votre dashboard**
4. Vous devriez maintenant voir votre analyse au lieu de "aucune analyse trouvée"

## 🔧 **Structure des Tables**

### **Table `analyses`**
- `id` : Identifiant unique
- `user_id` : Référence vers l'utilisateur
- `ticket` : Numéro de ticket unique (ex: CASH-12345A)
- `client_name` : Nom complet du client
- `client_email` : Email du client
- `status` : Statut (en_cours, en_analyse, terminee)
- `progress` : Progression (0-100%)
- `mode_paiement` : Mode de paiement choisi
- `message` : Message optionnel
- `pdf_url` : URL du PDF final (optionnel)
- `created_at` / `updated_at` : Timestamps

### **Table `analysis_files`**
- `id` : Identifiant unique
- `analysis_id` : Référence vers l'analyse
- `file_name` : Nom du fichier
- `file_url` : URL/chemin du fichier
- `file_size` : Taille en octets
- `file_type` : Type de fichier (document, pdf)
- `created_at` : Timestamp

## 🛡️ **Sécurité (RLS)**

Le script configure automatiquement :
- **Row Level Security** : Chaque utilisateur ne voit que ses propres analyses
- **Politiques de sécurité** : Contrôle d'accès granulaire
- **Isolation des données** : Protection des informations clients

## 🚨 **Problèmes Courants**

### **"Aucune analyse trouvée" persiste**
1. Vérifiez que les tables sont créées
2. Vérifiez les politiques RLS
3. Vérifiez que l'utilisateur est bien authentifié
4. Regardez les logs de la console pour les erreurs

### **Erreurs de permissions**
1. Vérifiez que les politiques RLS sont actives
2. Vérifiez que l'utilisateur est bien connecté
3. Vérifiez les logs Supabase

### **Tables déjà existantes**
Si les tables existent déjà, vous pouvez :
1. Les supprimer et les recréer
2. Ou modifier le script pour utiliser `CREATE TABLE IF NOT EXISTS`

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez les logs de la console
2. Vérifiez les logs Supabase
3. Assurez-vous que toutes les variables d'environnement sont configurées

Une fois les tables créées, votre dashboard devrait afficher correctement toutes les analyses ! 🎉
