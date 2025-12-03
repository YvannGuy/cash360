# Architecture Financière - Cash360

## Vue d'ensemble

Ce document décrit l'architecture des modules financiers de Cash360, notamment :
- **Budget & Suivi** : Planification et suivi des revenus/dépenses mensuels
- **Jeûne financier** : Module de discipline financière sur 30 jours
- **DebtFree** : Plan de remboursement de dettes (nouveau module)

---

## Tables Supabase

### 1. Table `budgets`

Stocke les budgets mensuels par utilisateur.

**Structure :**
```sql
budgets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  month DATE, -- Format: YYYY-MM-01 (premier jour du mois)
  monthly_income DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, month)
)
```

**Relations :**
- `budget_expenses` : Une ligne par catégorie de dépense

**Usage :**
- Un budget par utilisateur et par mois
- Le `month` est stocké au format `YYYY-MM-01` (premier jour du mois)
- `monthly_income` : revenu mensuel total

---

### 2. Table `budget_expenses`

Stocke les dépenses planifiées par catégorie pour chaque budget.

**Structure :**
```sql
budget_expenses (
  id UUID PRIMARY KEY,
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  category TEXT, -- Ex: "Logement", "Transport", "Crédit", "Dette", etc.
  amount DECIMAL,
  created_at TIMESTAMP
)
```

**Catégories courantes :**
- Logement
- Transport
- Nourriture
- Église (dîme/offrandes)
- Loisirs
- Santé
- Éducation
- Crédit / Dette (à identifier pour DebtFree)
- Autres

**Identification des dettes :**
Pour DebtFree, on identifie les dépenses de type "dette" via les catégories contenant :
- "dette", "dettes", "debt"
- "crédit", "credit", "crédits"
- "remboursement", "repayment"
- "prêt", "loan", "prêts"
- "mensualité", "monthly payment"

---

### 3. Table `financial_fasts`

Stocke les jeûnes financiers actifs ou terminés.

**Structure :**
```sql
financial_fasts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  categories TEXT[], -- Catégories de dépenses à éviter
  intention TEXT,
  additional_notes TEXT,
  habit_name TEXT,
  habit_reminder TEXT,
  meta_categories JSONB, -- Budgets par catégorie (optionnel)
  estimated_monthly_spend DECIMAL, -- Dépense mensuelle estimée sur ces catégories
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Relations :**
- `financial_fast_days` : Une ligne par jour (30 jours)

**Calcul des économies :**
- `estimated_monthly_spend` : Montant mensuel estimé économisé
- Pour un jeûne de 30 jours : économies = `estimated_monthly_spend`
- Pour un jeûne partiel : économies = `(estimated_monthly_spend / 30) * jours_respectés`

---

### 4. Table `financial_fast_days`

Suivi quotidien du jeûne financier.

**Structure :**
```sql
financial_fast_days (
  id UUID PRIMARY KEY,
  fast_id UUID REFERENCES financial_fasts(id) ON DELETE CASCADE,
  day_index INTEGER, -- 1 à 30
  date DATE,
  respected BOOLEAN, -- Le jeûne a-t-il été respecté ce jour ?
  reflection TEXT, -- Réflexion optionnelle de l'utilisateur
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Calcul des économies réelles :**
- Jours respectés : `COUNT(*) WHERE respected = true`
- Économies totales : `(estimated_monthly_spend / 30) * jours_respectés`

---

## Flows Principaux

### Flow 1 : Création et mise à jour d'un budget

1. **Frontend** (`BudgetTracker.tsx`) :
   - Utilisateur saisit revenu mensuel et dépenses par catégorie
   - Appel `POST /api/budget` avec `{ month, monthlyIncome, expenses: [{ category, amount }] }`

2. **Backend** (`app/api/budget/route.ts`) :
   - Vérifie l'authentification et l'abonnement premium
   - Upsert dans `budgets` (user_id, month)
   - Supprime les anciennes `budget_expenses` du budget
   - Insère les nouvelles `budget_expenses`

3. **Récupération** :
   - `GET /api/budget?month=YYYY-MM` retourne le budget avec ses dépenses

---

### Flow 2 : Lancement d'un jeûne financier

1. **Frontend** (`FinancialFast.tsx`) :
   - Utilisateur sélectionne des catégories à éviter
   - Saisit intention, dépense mensuelle estimée
   - Appel `POST /api/financial-fast`

2. **Backend** (`app/api/financial-fast/route.ts`) :
   - Vérifie qu'il n'y a pas déjà un jeûne actif
   - Crée une entrée dans `financial_fasts` (is_active = true)
   - Crée 30 entrées dans `financial_fast_days` (respected = false par défaut)

3. **Suivi quotidien** :
   - `PATCH /api/financial-fast/day` pour mettre à jour `respected` chaque jour

---

### Flow 3 : Calcul du résumé de dettes (DebtFree)

**Nouveau flow** pour le module DebtFree :

1. **Identification des dettes** :
   - Requête sur `budget_expenses` avec filtres sur catégories contenant "dette", "crédit", etc.
   - Somme des montants = `totalDebtMonthlyPayments`

2. **Calcul de la marge disponible** :
   - Récupère le budget du mois courant (`budgets.monthly_income`)
   - Somme toutes les dépenses (`SUM(budget_expenses.amount)`)
   - Marge = `monthly_income - total_expenses`

3. **Calcul des économies du jeûne** :
   - Si jeûne actif : récupère `financial_fasts.estimated_monthly_spend`
   - Compte les jours respectés dans `financial_fast_days`
   - Économies mensuelles = `(estimated_monthly_spend / 30) * jours_respectés`

4. **Projection de remboursement** :
   - Montant total de dettes estimé (si disponible) ou projection basée sur paiements mensuels
   - Temps estimé = `total_debt / (totalDebtMonthlyPayments + availableMargin + fastSavings)`

---

## API Endpoints Existants

### Budget
- `GET /api/budget?month=YYYY-MM` : Récupère le budget d'un mois
- `POST /api/budget` : Crée ou met à jour un budget

### Jeûne financier
- `GET /api/financial-fast` : Récupère le jeûne actif
- `POST /api/financial-fast` : Crée un nouveau jeûne
- `PATCH /api/financial-fast/day` : Met à jour le statut d'un jour
- `PATCH /api/financial-fast` : Ferme un jeûne (is_active = false)

---

## Nouveau Module : DebtFree

### API à créer

**`GET /api/debt-free/summary`**

Retourne un résumé des dettes et projections.

**Réponse :**
```typescript
{
  totalDebtMonthlyPayments: number, // Somme des paiements mensuels de dettes
  estimatedTotalDebtAmount?: number, // Optionnel, si l'utilisateur l'a saisi
  availableMarginMonthly: number, // Revenu - dépenses (hors dettes)
  fastSavingsMonthly: number, // Économies mensuelles du jeûne
  estimatedMonthsToFreedom: number, // Projection simple
  estimatedMonthsToFreedomWithFast: number // Projection avec économies du jeûne
}
```

**Logique :**
1. Récupère le budget du mois courant
2. Identifie les dépenses de type "dette" (catégories contenant "dette", "crédit", etc.)
3. Calcule la marge disponible (revenu - toutes dépenses)
4. Récupère le jeûne actif et calcule les économies mensuelles
5. Projette le temps de remboursement

---

## Extensions Futures

### Améliorations possibles pour DebtFree

1. **Table `debts` dédiée** (optionnel) :
   ```sql
   debts (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     name TEXT, -- Nom de la dette (ex: "Crédit auto")
     total_amount DECIMAL, -- Montant total à rembourser
     monthly_payment DECIMAL, -- Mensualité
     interest_rate DECIMAL, -- Taux d'intérêt (optionnel)
     start_date DATE,
     end_date DATE, -- Date prévue de fin
     category_id UUID REFERENCES budget_expenses(id), -- Lien avec budget_expenses
     created_at TIMESTAMP
   )
   ```

2. **Stratégies de remboursement** :
   - Avalanche (priorité aux dettes à taux élevé)
   - Boule de neige (priorité aux petites dettes)
   - Personnalisée

3. **Intégration avec transactions réelles** :
   - Si une table `transactions` existe, lier les paiements réels aux dettes

---

## Notes Techniques

### Sécurité
- Toutes les requêtes utilisent Row Level Security (RLS)
- Vérification de l'abonnement premium pour Budget et Jeûne
- DebtFree nécessitera aussi l'abonnement premium

### Performance
- Index sur `user_id` et `month` pour `budgets`
- Index sur `fast_id` et `day_index` pour `financial_fast_days`
- Requêtes optimisées avec `maybeSingle()` pour éviter les erreurs 404

### Internationalisation
- Les catégories sont traduites via `lib/translations.ts`
- Les montants sont formatés selon la devise de l'utilisateur (`CurrencyContext`)

