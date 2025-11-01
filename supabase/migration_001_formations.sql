-- Migration 001: Création des tables formations

-- TABLE: formations
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'Capsule' CHECK (session_type IN ('Capsule', 'Workshop', 'Webinaire')),
  capsule_id TEXT,
  duration INTEGER NOT NULL DEFAULT 60 CHECK (duration > 0),
  date_scheduled DATE NOT NULL,
  time_scheduled TIME NOT NULL,
  description TEXT,
  zoom_link TEXT,
  max_participants INTEGER NOT NULL DEFAULT 50 CHECK (max_participants > 0),
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  access_type TEXT NOT NULL DEFAULT 'tous' CHECK (access_type IN ('tous', 'capsule', 'custom')),
  price DECIMAL(10, 2) DEFAULT 0 CHECK (price >= 0),
  require_payment BOOLEAN DEFAULT false,
  send_notification BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'a_venir' CHECK (status IN ('a_venir', 'en_ligne', 'termine')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formations_date ON public.formations(date_scheduled);
CREATE INDEX IF NOT EXISTS idx_formations_status ON public.formations(status);
CREATE INDEX IF NOT EXISTS idx_formations_capsule ON public.formations(capsule_id);

ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view available formations"
  ON public.formations FOR SELECT
  USING (true);

