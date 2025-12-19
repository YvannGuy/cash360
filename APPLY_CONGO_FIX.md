# Correction de la contrainte orders_operator_check

## Problème
La contrainte CHECK `orders_operator_check` sur la colonne `operator` de la table `orders` n'accepte que `orange_money` et `wave`, mais pas `congo_mobile_money`.

## Solution
Exécuter la migration SQL suivante dans Supabase :

```sql
-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_operator_check;

-- Recréer la contrainte avec les 3 opérateurs autorisés
ALTER TABLE public.orders 
ADD CONSTRAINT orders_operator_check 
CHECK (operator IS NULL OR operator IN ('orange_money', 'wave', 'congo_mobile_money'));
```

## Comment appliquer

1. Aller dans Supabase Dashboard → SQL Editor
2. Coller le SQL ci-dessus
3. Exécuter la requête
4. Vérifier que la contrainte est bien mise à jour

## Vérification

Après avoir appliqué la migration, tester à nouveau un paiement Congo. La commande devrait maintenant être créée avec succès.
