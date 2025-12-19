# Vérification des Revenus sur 30 Jours

## ✅ Résumé de la Vérification

Les revenus sont bien calculés sur les **30 derniers jours** depuis maintenant, en incluant tous les paiements réussis de la table `payments` avec `status = 'success'` et `created_at >= date_debut_30j`.

## 📊 Calcul des Revenus

### Endpoint: `/api/admin/metrics/overview`

**Fichier:** `app/api/admin/metrics/overview/route.ts`

**1. Récupération des paiements:**
```typescript
const startDate = new Date()
startDate.setDate(startDate.getDate() - days) // days = 30 pour range=30d
const startDateISO = startDate.toISOString()

const { data: payments } = await supabaseAdmin
  .from('payments')
  .select('*')
  .eq('status', 'success')           // ✅ Seulement les paiements réussis
  .gte('created_at', startDateISO)   // ✅ Seulement les 30 derniers jours
```

**2. Calcul du revenu total:**
```typescript
const revenueMonth = payments?.reduce((sum: number, p: any) => 
  sum + (parseFloat(p.amount) || 0), 0) || 0
```

**✅ Vérifications:**
- ✅ Les paiements sont filtrés sur les 30 derniers jours avec `.gte('created_at', startDateISO)`
- ✅ Seuls les paiements avec `status = 'success'` sont inclus
- ✅ Tous les montants sont sommés (abonnements, capsules, analyses, etc.)
- ✅ Les montants invalides ou null sont traités comme 0

**Logs ajoutés:**
- Date de début et fin de la période
- Nombre total de paiements
- Nombre de paiements avec montant > 0
- Revenu total calculé
- Répartition par type de paiement (abonnement, capsule, analyse, etc.)
- Détail des 5 premiers paiements pour vérification

---

### Endpoint: `/api/admin/metrics/geo`

**Fichier:** `app/api/admin/metrics/geo/route.ts`

**Récupération des paiements:**
```typescript
const startDate = new Date()
startDate.setDate(startDate.getDate() - days) // days = 30 pour range=30d
const startDateISO = startDate.toISOString()

const { data: payments } = await supabaseAdmin
  .from('payments')
  .select('user_id, amount, created_at')
  .eq('status', 'success')           // ✅ Seulement les paiements réussis
  .gte('created_at', startDateISO)   // ✅ Seulement les 30 derniers jours
```

**Calcul du revenu par utilisateur:**
```typescript
const revenueByUser = new Map<string, number>()
payments?.forEach((p: any) => {
  const current = revenueByUser.get(p.user_id) || 0
  revenueByUser.set(p.user_id, current + (parseFloat(p.amount) || 0))
})
```

**✅ Vérifications:**
- ✅ Même logique de filtrage que l'endpoint overview
- ✅ Revenu calculé par utilisateur pour l'agrégation géographique
- ✅ Utilisé pour calculer `revenue30d` par pays/ville

**Logs ajoutés:**
- Date de début et fin de la période
- Nombre total de paiements
- Revenu total sur 30j
- Nombre d'utilisateurs avec revenu

---

## 🔍 Types de Paiements Inclus

D'après le code, les revenus incluent **tous les types de paiements** présents dans la table `payments`:

1. **Abonnements** (`payment_type = 'abonnement'`)
   - Les paiements mensuels récurrents sont créés à chaque renouvellement
   - Inclus si `created_at` est dans les 30 derniers jours

2. **Capsules** (`payment_type = 'capsule'`)
   - Capsules prédéfinies (capsule1-5)
   - Capsules de la boutique
   - Packs complets

3. **Analyses financières** (`payment_type = 'analysis'` ou `'analyse-financiere'`)
   - Chaque analyse achetée crée un paiement

4. **Ebooks** (`payment_type = 'ebook'`)
   - ✅ Inclus dans les calculs de revenus

5. **Coaching** (`payment_type = 'coaching'`)
   - ✅ Inclus dans les calculs de revenus
   - ✅ Détection corrigée dans webhook/verify-payment/checkout

6. **Masterclass** (`payment_type = 'masterclass'`)
   - ✅ Inclus dans les calculs de revenus
   - ✅ Détection corrigée dans webhook/verify-payment/checkout

7. **Autres produits** (`payment_type = 'other'`)

**✅ Tous ces types sont inclus dans le calcul des revenus sur 30j**

### ⚠️ Correction Appliquée

**Problème identifié:** Les produits de catégorie `coaching` et `masterclass` étaient classés par défaut comme `capsule` au lieu de leur type spécifique.

**Solution:** Ajout de la détection explicite de `coaching` et `masterclass` dans:
- `/api/webhook/route.ts`
- `/api/verify-payment/route.ts`
- `/api/checkout/route.ts`

**Résultat:** Les nouveaux paiements pour coaching et masterclass seront maintenant correctement classés avec `payment_type = 'coaching'` ou `payment_type = 'masterclass'`, et apparaîtront dans les logs de revenus avec leur type correct.

---

## 📅 Période de Calcul

### Pour `range=30d`:
- **Date de début:** `new Date()` moins 30 jours
- **Date de fin:** `new Date()` (maintenant)
- **Filtre SQL:** `.gte('created_at', startDateISO)`

### Exemple concret:
Si aujourd'hui est le **20 décembre 2025**:
- Date de début: **20 novembre 2025**
- Date de fin: **20 décembre 2025**
- Inclut tous les paiements entre ces deux dates

---

## ⚠️ Points d'Attention

### 1. Abonnements récurrents
Les abonnements mensuels créent des entrées dans `payments` à chaque renouvellement. Si un utilisateur a renouvelé son abonnement dans les 30 derniers jours, ce paiement est inclus.

**Vérification:** Les logs affichent le nombre de paiements de type "abonnement" dans la période.

### 2. Statut des paiements
Seuls les paiements avec `status = 'success'` sont inclus. Les paiements en attente (`pending`) ou échoués (`failed`) ne sont **pas** comptés.

### 3. Montants null ou invalides
Les paiements avec `amount = null` ou montant invalide sont traités comme 0 et n'affectent pas le total.

### 4. Comparaison avec période précédente
Pour calculer les variations, le code compare avec la période précédente (30 jours avant la date de début actuelle):
- Période actuelle: 20 nov - 20 déc
- Période précédente: 21 oct - 20 nov

---

## 📋 Logs de Vérification

Quand vous appelez `/api/admin/metrics/overview?range=30d`, vous verrez dans la console:

```
[METRICS OVERVIEW] Calcul des revenus (30j): {
  periode: {
    startDate: '2025-11-20T17:00:00.000Z',
    startDateLocal: '20/11/2025 18:00:00',
    endDate: '2025-12-20T17:00:00.000Z',
    endDateLocal: '20/12/2025 18:00:00',
    jours: 30
  },
  paiements: {
    total: 15,
    avecMontant: 15,
    sansMontant: 0
  },
  revenuTotal: 599.70,
  revenuParType: {
    'abonnement': { count: 7, total: 279.86 },
    'capsule': { count: 5, total: 199.90 },
    'analysis': { count: 3, total: 119.94 }
  },
  detailPaiements: [
    { id: '...', type: 'abonnement', amount: 39.98, status: 'success', date: '2025-12-15...' },
    ...
  ]
}
```

Cela permet de vérifier:
- ✅ La période exacte utilisée
- ✅ Le nombre de paiements inclus
- ✅ Le revenu total calculé
- ✅ La répartition par type de paiement
- ✅ Les détails des premiers paiements

---

## ✅ Conclusion

**Les revenus sont bien calculés sur les 30 derniers jours** depuis maintenant.

- ✅ Filtrage correct avec `.gte('created_at', startDateISO)`
- ✅ Seulement les paiements réussis (`status = 'success'`)
- ✅ Tous les types de paiements inclus
- ✅ Calcul correct de la somme
- ✅ Logs détaillés pour vérification

Les logs permettent de vérifier en temps réel que les revenus correspondent bien aux paiements des 30 derniers jours.
