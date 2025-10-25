-- Créer la table 'leads' pour stocker les leads de la simulation
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'simulation',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur l'email pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Créer un index sur la date de création
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Créer un index sur la source
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Politique RLS : permettre l'insertion à tous (pour l'API publique)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion à tous
CREATE POLICY "Allow public insert" ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Politique pour permettre la lecture uniquement aux admins
CREATE POLICY "Allow admin read" ON leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'cash@cash360.finance'
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
