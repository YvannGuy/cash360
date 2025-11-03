-- Migration 003: Ajout du système de rôles utilisateurs
-- Date: 2025-01-29

-- ============================================================================
-- 1. Ajouter la colonne 'role' à la table auth.users (via raw_user_meta_data)
-- ============================================================================

-- On ne peut pas modifier directement auth.users, donc on utilise user_metadata
-- Les rôles possibles sont: 'user', 'admin', 'commercial'x
-- Par défaut, tous les utilisateurs sont 'user'

-- ============================================================================
-- 2. Mettre à jour les utilisateurs existants pour définir leur rôle
-- ============================================================================

-- Définir le rôle admin pour les admins principaux
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email IN ('cash@cash360.finance', 'yvann.guyonnet@gmail.com');

-- Tous les autres utilisateurs ont le rôle 'user' par défaut
-- On va créer une fonction pour initialiser le rôle lors de l'inscription

-- ============================================================================
-- 3. Fonction pour vérifier le rôle d'un utilisateur
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = user_id),
    'user'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Retourne le rôle d''un utilisateur (user, admin, commercial)';

-- ============================================================================
-- 4. Fonction pour vérifier si l'utilisateur est admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin(UUID) IS 'Vérifie si l''utilisateur est admin';

-- ============================================================================
-- 5. Fonction pour vérifier si l'utilisateur est commercial
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_commercial(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(user_id) = 'commercial';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_commercial(UUID) IS 'Vérifie si l''utilisateur est commercial';

-- ============================================================================
-- 6. Mettre à jour les politiques RLS pour utiliser les rôles
-- ============================================================================

-- Supprimer les anciennes politiques basées sur l'email
DROP POLICY IF EXISTS "Admins can manage formations" ON public.formations;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins and commercial can manage formations" ON public.formations;
DROP POLICY IF EXISTS "Admins and commercial can manage products" ON public.products;

-- Nouvelle politique pour les formations (admins et commerciaux)
CREATE POLICY "Admins and commercial can manage formations"
  ON public.formations FOR ALL
  USING (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  );

-- Nouvelle politique pour les produits (admins et commerciaux)
CREATE POLICY "Admins and commercial can manage products"
  ON public.products FOR ALL
  USING (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
  );

-- ============================================================================
-- 7. Ajouter une colonne pour faciliter l'affichage du rôle dans le dashboard
-- ============================================================================

-- Créer une vue pour faciliter l'accès aux informations utilisateur avec rôle
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  created_at,
  updated_at,
  last_sign_in_at,
  email_confirmed_at,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'phone' as phone,
  raw_user_meta_data->>'country' as country,
  raw_user_meta_data->>'city' as city,
  raw_user_meta_data->>'profession' as profession
FROM auth.users;

COMMENT ON VIEW public.user_profiles IS 'Vue des profils utilisateurs avec leurs informations et rôle';

-- Rendre la vue accessible en lecture seule
GRANT SELECT ON public.user_profiles TO authenticated;

-- ============================================================================
-- 8. Trigger pour initialiser le rôle par défaut lors de l'inscription
-- ============================================================================

-- Note: On ne peut pas créer de trigger sur auth.users directement dans Supabase
-- Le rôle par défaut sera géré côté application lors de l'inscription

