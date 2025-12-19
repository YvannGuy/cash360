-- Migration: Créer une fonction pour rafraîchir le cache PostgREST
-- Description: Cette fonction permet de forcer le rafraîchissement du cache de schéma PostgREST

-- Créer la fonction pour rafraîchir le schéma PostgREST
CREATE OR REPLACE FUNCTION refresh_postgrest_schema()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notifier PostgREST pour recharger le schéma
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

-- Commentaire pour documentation
COMMENT ON FUNCTION refresh_postgrest_schema() IS 'Force le rafraîchissement du cache de schéma PostgREST. Utile après la création de nouvelles tables.';
