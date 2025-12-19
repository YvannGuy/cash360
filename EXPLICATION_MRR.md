# Explication détaillée du calcul du MRR

## 📊 Définition du MRR

**MRR = Monthly Recurring Revenue** (Revenu récurrent mensuel)

Le MRR représente le montant total des revenus mensuels générés par **tous les abonnements actifs à un instant T**. C'est un indicateur clé pour mesurer la santé financière d'une entreprise SaaS.

---

## 🔍 Sources de données utilisées

### 1. Table `user_subscriptions`
Cette table contient tous les abonnements utilisateurs avec les colonnes suivantes :
- `user_id` : UUID de l'utilisateur
- `status` : Statut de l'abonnement (`active`, `trialing`, `past_due`, `canceled`, etc.)
- `grace_until` : Date limite de grâce pour les abonnements `past_due`
- `stripe_subscription_id` : ID de l'abonnement Stripe
- `price_id` : ID du prix Stripe (pour récupérer le montant réel)
- `created_at` : Date de création de l'abonnement

### 2. Table `products`
Cette table contient les produits disponibles avec :
- `id` : UUID du produit
- `name` : Nom du produit
- `category` : Catégorie (`abonnement` pour les abonnements)
- `daily_price_ttc` : Prix journalier TTC (si applicable)
- `deposit` : Acompte (si applicable)

**Note** : Le code cherche un champ `price`, `amount` ou `monthly_price` dans `products`, mais la structure actuelle utilise `daily_price_ttc`. Le code utilise donc un **fallback de 39.98€** par défaut.

---

## 🧮 Calcul du MRR actuel (étape par étape)

### Étape 1 : Récupérer le prix de l'abonnement

```typescript
// 1. Chercher le produit "abonnement" dans la table products
const { data: subscriptionProducts } = await supabaseAdmin
  .from('products')
  .select('*')
  .or('category.eq.abonnement,id.eq.abonnement')
  .limit(1)

// 2. Extraire le prix (essayer plusieurs champs)
const product = subscriptionProducts[0]
subscriptionPrice = parseFloat(
  product.price ||           // Si existe
  product.amount ||          // Sinon celui-ci
  product.monthly_price ||   // Sinon celui-ci
  '39.98'                    // Sinon valeur par défaut
) || 39.98
```

**Résultat** : `subscriptionPrice = 39.98` (valeur par défaut actuellement)

---

### Étape 2 : Compter les abonnements ACTIFS

Le MRR inclut **3 types d'abonnements** :

#### A. Abonnements `active` ou `trialing`

```sql
SELECT * FROM user_subscriptions
WHERE status IN ('active', 'trialing')
```

**Exemple concret** :
- Si vous avez 5 abonnements avec `status = 'active'`
- Et 2 abonnements avec `status = 'trialing'`
- **Total A = 7 abonnements**

#### B. Abonnements `past_due` avec période de grâce valide

```sql
SELECT * FROM user_subscriptions
WHERE status = 'past_due'
  AND grace_until IS NOT NULL
  AND grace_until > NOW()
```

**Exemple concret** :
- Si vous avez 3 abonnements avec `status = 'past_due'`
- Mais seulement 1 a `grace_until = '2025-12-25'` (dans le futur)
- Les 2 autres ont `grace_until = '2025-12-10'` (déjà expiré)
- **Total B = 1 abonnement** (seulement celui avec grâce valide)

#### C. Total des abonnements actifs

```typescript
const allActiveSubscriptions = [
  ...activeTrialingSubs,    // 7 abonnements
  ...pastDueValidSubs       // 1 abonnement
]
const activeSubsCount = 8   // Total = 8 abonnements actifs
```

---

### Étape 3 : Calculer le MRR

```typescript
mrr = activeSubsCount * subscriptionPrice
mrr = 8 * 39.98
mrr = 319.84 €
```

**Résultat final** : **MRR = 319.84 €**

Cela signifie que si tous ces abonnements se renouvellent ce mois-ci, vous générerez **319.84 €** de revenus récurrents.

---

## 📈 Calcul de la variation du MRR

Pour afficher le pourcentage d'évolution (↑ 100%), le code compare le MRR actuel avec le MRR d'il y a X jours.

### Étape 1 : Calculer la date de comparaison

```typescript
// Si range = '30d', on compare avec il y a 30 jours
const previousComparisonDate = new Date(startDate)
previousComparisonDate.setDate(previousComparisonDate.getDate() - 30)
// Exemple : Si aujourd'hui = 19/12/2025, previousComparisonDate = 19/11/2025
```

### Étape 2 : Compter les abonnements actifs à cette date

```sql
-- Abonnements active/trialing créés avant cette date
SELECT * FROM user_subscriptions
WHERE status IN ('active', 'trialing')
  AND created_at < '2025-11-19'

-- Abonnements past_due avec grâce valide créés avant cette date
SELECT * FROM user_subscriptions
WHERE status = 'past_due'
  AND grace_until > '2025-11-19'
  AND created_at < '2025-11-19'
```

**Exemple concret** :
- Il y a 30 jours, vous aviez **5 abonnements actifs**
- Aujourd'hui, vous avez **8 abonnements actifs**
- **previousMRR = 5 × 39.98 = 199.90 €**

### Étape 3 : Calculer la variation

```typescript
const calculateVariation = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

variation = ((319.84 - 199.90) / 199.90) * 100
variation = (119.94 / 199.90) * 100
variation = 60.0%
```

**Résultat** : **↑ 60.0%** (augmentation de 60% par rapport à il y a 30 jours)

---

## ⚠️ Limitations actuelles du calcul

### 1. Prix unique par défaut
- **Problème** : Le code utilise un prix fixe de **39.98€** pour tous les abonnements
- **Impact** : Si vous avez plusieurs plans (ex: 19.99€, 39.98€, 79.96€), tous sont comptés à 39.98€
- **Solution idéale** : Utiliser le `price_id` de chaque abonnement pour récupérer le prix réel depuis Stripe

### 2. Approximation du MRR historique
- **Problème** : Le MRR précédent est calculé en comptant les abonnements créés avant une date
- **Impact** : Un abonnement créé il y a 60 jours mais annulé il y a 20 jours sera quand même compté dans le MRR précédent
- **Solution idéale** : Créer une table de snapshots quotidiens du MRR

### 3. Structure de la table `products`
- **Problème** : Le code cherche `price`, `amount` ou `monthly_price` mais la table a `daily_price_ttc`
- **Impact** : Le prix par défaut (39.98€) est toujours utilisé
- **Solution** : Adapter le code pour utiliser `daily_price_ttc * 30` ou créer un champ `monthly_price`

---

## 📝 Exemple complet avec données réelles

### Scénario :
- **Date** : 19 décembre 2025
- **Prix de l'abonnement** : 39.98€ (valeur par défaut)

### Données dans `user_subscriptions` :

| user_id | status    | grace_until  | created_at  |
|---------|-----------|--------------|-------------|
| user-1  | active    | NULL         | 2025-11-01  |
| user-2  | active    | NULL         | 2025-11-15  |
| user-3  | trialing  | NULL         | 2025-12-10  |
| user-4  | past_due  | 2025-12-25   | 2025-10-01  |
| user-5  | past_due  | 2025-12-05   | 2025-09-01  |
| user-6  | canceled  | NULL         | 2025-08-01  |

### Calcul du MRR actuel :

1. **Abonnements active/trialing** :
   - user-1 : `status = 'active'` ✅
   - user-2 : `status = 'active'` ✅
   - user-3 : `status = 'trialing'` ✅
   - **Total A = 3**

2. **Abonnements past_due avec grâce valide** :
   - user-4 : `status = 'past_due'` ET `grace_until = 2025-12-25` > `NOW()` ✅
   - user-5 : `status = 'past_due'` MAIS `grace_until = 2025-12-05` < `NOW()` ❌
   - **Total B = 1**

3. **Total abonnements actifs** : 3 + 1 = **4 abonnements**

4. **MRR** : 4 × 39.98€ = **159.92€**

### Calcul de la variation (il y a 30 jours = 19 novembre 2025) :

1. **Abonnements actifs le 19 novembre** :
   - user-1 : créé le 2025-11-01, donc actif ✅
   - user-2 : créé le 2025-11-15, donc actif ✅
   - user-3 : créé le 2025-12-10, donc **pas encore créé** ❌
   - user-4 : créé le 2025-10-01, donc actif ✅
   - **Total = 3 abonnements**

2. **previousMRR** : 3 × 39.98€ = **119.94€**

3. **Variation** : ((159.92 - 119.94) / 119.94) × 100 = **33.3%**

**Résultat affiché** : **MRR = 159.92€** avec **↑ 33.3%**

---

## ✅ Résumé

Le MRR calcule :
1. **Combien d'abonnements sont actifs** (active + trialing + past_due avec grâce valide)
2. **Multiplie par le prix mensuel** (actuellement 39.98€ par défaut)
3. **Compare avec le MRR d'il y a X jours** pour afficher l'évolution

**Formule** : `MRR = Nombre d'abonnements actifs × Prix mensuel`

**Période** : Instantané (pas de période, c'est l'état actuel)

**Variation** : Comparaison avec la même date il y a X jours (7 ou 30 selon le range sélectionné)

---

## 🎯 Schéma visuel du calcul

```
┌─────────────────────────────────────────────────────────────┐
│                    CALCUL DU MRR                            │
└─────────────────────────────────────────────────────────────┘

ÉTAPE 1 : Récupérer le prix de l'abonnement
┌─────────────────────────────────────────┐
│ Chercher dans products (category='abonnement') │
│ → Si trouvé : utiliser product.price          │
│ → Sinon : utiliser 39.98€ (valeur par défaut)│
└─────────────────────────────────────────┘
                    ↓
            Prix = 39.98€

ÉTAPE 2 : Compter les abonnements actifs
┌─────────────────────────────────────────┐
│ Abonnements 'active' ou 'trialing'      │
│ → Exemple : 3 abonnements              │
└─────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────┐
│ Abonnements 'past_due' avec grâce valide│
│ → grace_until > NOW()                   │
│ → Exemple : 1 abonnement                │
└─────────────────────────────────────────┘
                    ↓
        Total = 3 + 1 = 4 abonnements

ÉTAPE 3 : Calculer le MRR
┌─────────────────────────────────────────┐
│ MRR = 4 abonnements × 39.98€            │
│ MRR = 159.92€                          │
└─────────────────────────────────────────┘

ÉTAPE 4 : Calculer la variation
┌─────────────────────────────────────────┐
│ MRR actuel = 159.92€                    │
│ MRR il y a 30j = 119.94€                │
│ Variation = ((159.92 - 119.94) / 119.94) × 100│
│ Variation = 33.3% ↑                     │
└─────────────────────────────────────────┘
```

---

## 📋 Checklist de vérification

Pour vérifier que votre MRR est correct, vérifiez :

- [ ] **Nombre d'abonnements actifs** : Correspond au nombre réel d'utilisateurs avec accès premium ?
- [ ] **Prix utilisé** : Est-ce le bon prix mensuel (39.98€) ou avez-vous plusieurs plans ?
- [ ] **Abonnements past_due** : Les abonnements avec `grace_until` valide sont-ils bien inclus ?
- [ ] **Variation** : La comparaison avec la période précédente est-elle logique ?

---

## 🔧 Améliorations possibles

1. **Récupérer le prix réel depuis Stripe** : Utiliser le `price_id` de chaque abonnement pour récupérer le prix exact depuis l'API Stripe
2. **Gérer plusieurs plans** : Si vous avez plusieurs plans (ex: 19.99€, 39.98€, 79.96€), calculer le MRR par plan puis additionner
3. **Snapshot quotidien** : Créer une table qui stocke le MRR chaque jour pour avoir un historique précis
4. **Utiliser daily_price_ttc** : Adapter le code pour utiliser `daily_price_ttc * 30` depuis la table `products` si c'est le champ disponible
