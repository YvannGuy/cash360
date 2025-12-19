-- Migration: Fix orders_operator_check constraint to include congo_mobile_money
-- Description: Ajoute 'congo_mobile_money' aux valeurs autorisées pour la colonne operator

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_operator_check;

-- Recréer la contrainte avec les 3 opérateurs autorisés
ALTER TABLE public.orders 
ADD CONSTRAINT orders_operator_check 
CHECK (operator IS NULL OR operator IN ('orange_money', 'wave', 'congo_mobile_money'));

-- Vérification
DO $$
BEGIN
  RAISE NOTICE 'Contrainte orders_operator_check mise à jour avec succès';
  RAISE NOTICE 'Valeurs autorisées: orange_money, wave, congo_mobile_money';
END $$;
