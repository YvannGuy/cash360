-- Migration: Ajouter 'ebook' et 'abonnement' aux types de paiement autorisés
-- Cette migration modifie la contrainte CHECK sur payment_type dans la table payments

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_type_check;

-- 2. Créer la nouvelle contrainte avec les types autorisés
ALTER TABLE payments
ADD CONSTRAINT payments_payment_type_check 
CHECK (payment_type IN (
  'capsule',
  'analysis',
  'pack',
  'ebook',
  'abonnement',
  'subscription',
  'formation',
  'other'
));

