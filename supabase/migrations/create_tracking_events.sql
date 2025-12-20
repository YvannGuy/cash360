-- Migration: Create tracking_events table
-- Description: Table pour stocker les événements de tracking analytics

-- Créer la table tracking_events
CREATE TABLE IF NOT EXISTS public.tracking_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type ON public.tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_id ON public.tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON public.tracking_events(created_at);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session_id ON public.tracking_events(session_id);

-- Index composite pour les requêtes fréquentes (user_id + event_type + created_at)
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_event_date ON public.tracking_events(user_id, event_type, created_at DESC);

-- Index GIN pour les recherches dans le payload JSONB
CREATE INDEX IF NOT EXISTS idx_tracking_events_payload ON public.tracking_events USING GIN (payload);

-- Activer RLS (Row Level Security)
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir leurs propres événements
DROP POLICY IF EXISTS "Users can view their own tracking events" ON public.tracking_events;
CREATE POLICY "Users can view their own tracking events"
    ON public.tracking_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Politique RLS : Le service role peut tout faire (pour les API routes admin)
DROP POLICY IF EXISTS "Service role can do everything" ON public.tracking_events;
CREATE POLICY "Service role can do everything"
    ON public.tracking_events
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Commentaires pour documentation
COMMENT ON TABLE public.tracking_events IS 'Table pour stocker les événements de tracking analytics (outils utilisés, capsules vues, etc.)';
COMMENT ON COLUMN public.tracking_events.event_type IS 'Type d''événement (ex: tool.used, content.capsule_viewed)';
COMMENT ON COLUMN public.tracking_events.user_id IS 'ID de l''utilisateur (peut être null pour les événements anonymes)';
COMMENT ON COLUMN public.tracking_events.payload IS 'Données additionnelles de l''événement (JSON)';
COMMENT ON COLUMN public.tracking_events.session_id IS 'ID de session pour regrouper les événements';
COMMENT ON COLUMN public.tracking_events.created_at IS 'Date de création de l''événement';

