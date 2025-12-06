-- Migration: Ajouter le champ calendly_link à la table formations
-- Date: 2024

ALTER TABLE formations 
ADD COLUMN IF NOT EXISTS calendly_link TEXT;

COMMENT ON COLUMN formations.calendly_link IS 'Lien Calendly pour prendre rendez-vous avec Pasteur Myriam (utilisé pour Diagnostic Finance Express)';

