-- Migration: Create user_subscriptions table
-- Description: Table pour stocker les abonnements utilisateurs (Stripe)

-- Créer la table user_subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    plan_id VARCHAR(100),
    price_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    grace_until TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_grace_until ON public.user_subscriptions(grace_until);

-- Index composite pour les requêtes fréquentes (status + grace_until)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_grace ON public.user_subscriptions(status, grace_until);

-- Activer RLS (Row Level Security)
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir leurs propres abonnements
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
    ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Politique RLS : Le service role peut tout faire (pour les API routes admin)
DROP POLICY IF EXISTS "Service role can do everything" ON public.user_subscriptions;
CREATE POLICY "Service role can do everything"
    ON public.user_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER trigger_update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE public.user_subscriptions IS 'Table pour stocker les abonnements utilisateurs synchronisés avec Stripe';
COMMENT ON COLUMN public.user_subscriptions.user_id IS 'ID de l''utilisateur (clé primaire)';
COMMENT ON COLUMN public.user_subscriptions.status IS 'Statut de l''abonnement (active, trialing, past_due, canceled, etc.)';
COMMENT ON COLUMN public.user_subscriptions.grace_until IS 'Date limite de grâce pour les abonnements past_due';
COMMENT ON COLUMN public.user_subscriptions.stripe_subscription_id IS 'ID de l''abonnement Stripe';
COMMENT ON COLUMN public.user_subscriptions.stripe_customer_id IS 'ID du customer Stripe';
