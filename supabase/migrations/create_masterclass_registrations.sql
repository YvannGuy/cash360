-- Migration: Create masterclass_registrations table
-- Description: Table pour stocker les inscriptions à la masterclass édition 2026

-- Créer la table masterclass_registrations
CREATE TABLE IF NOT EXISTS public.masterclass_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    country VARCHAR(100),
    registration_type VARCHAR(50) NOT NULL DEFAULT 'participant', -- 'participant' ou 'pitch'
    project_description TEXT, -- Pour les participants au pitch
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    payment_method VARCHAR(50), -- 'stripe', 'wave', 'orange_money'
    payment_reference VARCHAR(255), -- Référence du paiement
    payment_proof_url TEXT, -- URL de la preuve de paiement pour Mobile Money
    order_id VARCHAR(255), -- ID de commande si paiement via système existant
    amount DECIMAL(10, 2) DEFAULT 15.00,
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT, -- Notes additionnelles
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_masterclass_registrations_email ON public.masterclass_registrations(email);
CREATE INDEX IF NOT EXISTS idx_masterclass_registrations_payment_status ON public.masterclass_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_masterclass_registrations_registration_type ON public.masterclass_registrations(registration_type);
CREATE INDEX IF NOT EXISTS idx_masterclass_registrations_created_at ON public.masterclass_registrations(created_at);

-- Activer RLS (Row Level Security)
ALTER TABLE public.masterclass_registrations ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Le service role peut tout faire (pour les API routes)
DROP POLICY IF EXISTS "Service role can do everything" ON public.masterclass_registrations;
CREATE POLICY "Service role can do everything"
    ON public.masterclass_registrations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_masterclass_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_masterclass_registrations_updated_at ON public.masterclass_registrations;
CREATE TRIGGER update_masterclass_registrations_updated_at
    BEFORE UPDATE ON public.masterclass_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_masterclass_registrations_updated_at();

