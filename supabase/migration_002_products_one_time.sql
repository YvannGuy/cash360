-- Migration pour ajouter is_one_time aux produits
-- Permet de définir si un produit peut être acheté une seule fois ou plusieurs fois

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_one_time BOOLEAN DEFAULT true;

-- Mettre à jour le produit "analyse-financiere" pour permettre les achats illimités
UPDATE public.products SET is_one_time = false WHERE id = 'analyse-financiere';

-- Les capsules et le pack restent is_one_time = true par défaut

COMMENT ON COLUMN public.products.is_one_time IS 'Si true, le produit ne peut être acheté qu une seule fois par utilisateur. Si false, le produit peut être acheté plusieurs fois.';

