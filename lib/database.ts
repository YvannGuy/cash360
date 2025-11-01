import { createClientBrowser } from './supabase'

export interface AnalysisRecord {
  id: string
  user_id: string
  ticket: string
  client_name: string
  client_email: string
  status: 'en_cours' | 'en_analyse' | 'terminee'
  progress: number
  mode_paiement: string
  message?: string
  pdf_url?: string
  created_at: string
  updated_at: string
}

export interface AnalysisFile {
  id: string
  analysis_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type?: string
  created_at: string
}

export class AnalysisService {
  private _supabase: ReturnType<typeof createClientBrowser> | null = null

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClientBrowser()
    }
    return this._supabase
  }

  async createAnalysis(data: {
    ticket: string
    clientName: string
    clientEmail: string
    modePaiement: string
    message?: string
    userId?: string // Optionnel pour permettre la création depuis l'API
  }): Promise<AnalysisRecord | null> {
    try {
      let userId = data.userId
      
      if (!userId) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Utilisateur non authentifié')
        userId = user.id
      }

      const { data: analysis, error } = await this.supabase
        .from('analyses')
        .insert({
          user_id: userId,
          ticket: data.ticket,
          client_name: data.clientName,
          client_email: data.clientEmail,
          status: 'en_cours',
          progress: 10,
          mode_paiement: data.modePaiement,
          message: data.message || null
        })
        .select()
        .single()

      if (error) throw error
      return analysis
    } catch (error) {
      console.error('Erreur lors de la création de l\'analyse:', error)
      return null
    }
  }

  async getAnalysesByUser(): Promise<AnalysisRecord[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Récupérer les analyses par user_id ET par email client (pour les analyses créées via l'API)
      const { data: analyses, error } = await this.supabase
        .from('analyses')
        .select('*')
        .or(`user_id.eq.${user.id},client_email.eq.${user.email}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return analyses || []
    } catch (error) {
      console.error('Erreur lors de la récupération des analyses:', error)
      return []
    }
  }

  async getAllAnalyses(): Promise<AnalysisRecord[]> {
    try {
      const { data: analyses, error } = await this.supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return analyses || []
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les analyses:', error)
      return []
    }
  }

  async updateAnalysisProgress(analysisId: string, progress: number, status?: string): Promise<boolean> {
    try {
      const updateData: any = { progress }
      if (status) updateData.status = status

      const { error } = await this.supabase
        .from('analyses')
        .update(updateData)
        .eq('id', analysisId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'analyse:', error)
      return false
    }
  }

  async addFileToAnalysis(analysisId: string, fileData: {
    fileName: string
    fileUrl: string
    fileSize: number
  }): Promise<AnalysisFile | null> {
    try {
      const { data: file, error } = await this.supabase
        .from('analysis_files')
        .insert({
          analysis_id: analysisId,
          file_name: fileData.fileName,
          file_url: fileData.fileUrl,
          file_size: fileData.fileSize
        })
        .select()
        .single()

      if (error) throw error
      return file
    } catch (error) {
      console.error('Erreur lors de l\'ajout du fichier:', error)
      return null
    }
  }

  async getFilesByAnalysis(analysisId: string): Promise<AnalysisFile[]> {
    try {
      const { data: files, error } = await this.supabase
        .from('analysis_files')
        .select('*')
        .eq('analysis_id', analysisId)

      if (error) throw error
      return files || []
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error)
      return []
    }
  }
}

// SQL pour créer les tables dans Supabase
export const SQL_CREATE_TABLES = `
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
`;

export const analysisService = new AnalysisService()

// ---------- Capsules (Formations) ----------

export interface UserCapsuleRecord {
  id: string
  user_id: string
  capsule_id: string
  created_at: string
}

export class CapsulesService {
  private _supabase: ReturnType<typeof createClientBrowser> | null = null

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClientBrowser()
    }
    return this._supabase
  }

  async getUserCapsules(): Promise<UserCapsuleRecord[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data, error } = await this.supabase
        .from('user_capsules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      // Fallback localStorage si la table n'existe pas encore
      try {
        const raw = localStorage.getItem('cash360-user-capsules')
        return raw ? JSON.parse(raw) : []
      } catch {
        return []
      }
    }
  }

  async addUserCapsules(capsuleIds: string[]): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const rows = capsuleIds.map(id => ({ user_id: user.id, capsule_id: id }))
      const { error } = await this.supabase
        .from('user_capsules')
        .insert(rows)

      if (error) throw error
      return true
    } catch (error) {
      // Fallback localStorage
      try {
        const raw = localStorage.getItem('cash360-user-capsules')
        const existing: UserCapsuleRecord[] = raw ? JSON.parse(raw) : []
        const now = new Date().toISOString()
        const additions: UserCapsuleRecord[] = capsuleIds.map(id => ({
          id: `${id}-${now}`,
          user_id: 'local',
          capsule_id: id,
          created_at: now
        }))
        localStorage.setItem('cash360-user-capsules', JSON.stringify([...existing, ...additions]))
        return true
      } catch {
        return false
      }
    }
  }

  async removeUserCapsule(capsuleId: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { error } = await this.supabase
        .from('user_capsules')
        .delete()
        .eq('user_id', user.id)
        .eq('capsule_id', capsuleId)

      if (error) throw error
      return true
    } catch (error) {
      // Fallback localStorage
      try {
        const raw = localStorage.getItem('cash360-user-capsules')
        const existing: UserCapsuleRecord[] = raw ? JSON.parse(raw) : []
        const filtered = existing.filter(r => r.capsule_id !== capsuleId)
        localStorage.setItem('cash360-user-capsules', JSON.stringify(filtered))
        return true
      } catch {
        return false
      }
    }
  }
}

export const capsulesService = new CapsulesService()

export const SQL_CREATE_USER_CAPSULES = `
CREATE TABLE IF NOT EXISTS user_capsules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  capsule_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their capsules"
  ON user_capsules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
`;
