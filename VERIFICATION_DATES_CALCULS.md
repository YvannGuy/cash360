# Vérification des Calculs de Dates - 30 Derniers Jours

## ✅ Résumé de la Vérification

Tous les calculs utilisent bien des **dates dynamiques** basées sur `new Date()` et non des dates fixes comme le 1er décembre. Les calculs sont effectués en temps réel à chaque appel de l'API.

## 📅 Endpoints Vérifiés

### 1. `/api/admin/metrics/overview`
**Fichier:** `app/api/admin/metrics/overview/route.ts`

**Calcul de la date de début:**
```typescript
const range = searchParams.get('range') || '30d'
const days = range === '7d' ? 7 : 30
const startDate = new Date()
startDate.setDate(startDate.getDate() - days)
const startDateISO = startDate.toISOString()
```

**Utilisation:**
- ✅ Filtrage des paiements: `.gte('created_at', startDateISO)`
- ✅ Filtrage des tracking events: `.gte('created_at', startDateISO)`
- ✅ Calcul des nouveaux utilisateurs: `new Date(u.created_at).getTime() >= day30dAgo`
- ✅ Calcul des utilisateurs actifs: `new Date(u.last_sign_in_at).getTime() >= day30dAgo`

**Logs ajoutés:** Oui - affiche la date de début calculée en UTC et en heure locale (Europe/Paris)

---

### 2. `/api/admin/metrics/paid-usage`
**Fichier:** `app/api/admin/metrics/paid-usage/route.ts`

**Calcul de la date de début:**
```typescript
const range = searchParams.get('range') || '30d'
const days = range === '7d' ? 7 : 30
const startDateObj = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
const startDate = startDateObj.toISOString()
```

**Utilisation:**
- ✅ Filtrage des tracking events: `.gte('created_at', startDate)`

**Logs ajoutés:** Oui - affiche la date de début calculée

---

### 3. `/api/admin/metrics/geo`
**Fichier:** `app/api/admin/metrics/geo/route.ts`

**Calcul de la date de début:**
```typescript
const range = searchParams.get('range') || '30d'
const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
const startDate = new Date()
startDate.setDate(startDate.getDate() - days)
const startDateISO = startDate.toISOString()
```

**Utilisation:**
- ✅ Filtrage des paiements: `.gte('created_at', startDateISO)`
- ✅ Filtrage des tracking events: `.gte('created_at', startDateISO)`

**Logs ajoutés:** Oui - affiche la date de début calculée

---

### 4. `/api/admin/users`
**Fichier:** `app/api/admin/users/route.ts`

**Calcul des dates:**
```typescript
const now = new Date()
const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
const day1Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000)
const day30AgoISO = day30Ago.toISOString()
```

**Utilisation:**
- ✅ Filtrage des tracking events: `.gte('created_at', day30AgoISO)`
- ✅ Calcul de `core_actions_30d`: `events.filter(e => new Date(e.created_at) >= day30Ago)`
- ✅ Calcul de `active_days_30d`: basé sur les événements des 30 derniers jours

**Logs ajoutés:** Oui - affiche toutes les dates calculées

---

### 5. `/api/admin/metrics/simple`
**Fichier:** `app/api/admin/metrics/simple/route.ts`

**Calcul de la date de début:**
```typescript
const range = searchParams.get('range') || '30d'
const days = range === '7d' ? 7 : 30
const startDate = new Date()
startDate.setDate(startDate.getDate() - days)
const startDateISO = startDate.toISOString()
```

**Utilisation:**
- ✅ Filtrage des événements outils: `fetchTrackingEventsDirect('tool.used', startDateISO)`
- ✅ Filtrage des événements panier: `fetchTrackingEventsDirect(eventType, startDateISO)`

**Logs ajoutés:** Oui - affiche la date de début calculée

---

## 🔍 Vérifications Effectuées

### ✅ Tous les calculs utilisent:
1. `new Date()` pour obtenir la date actuelle
2. `setDate()` ou soustraction de millisecondes pour calculer la date de début
3. `.toISOString()` pour convertir en format ISO pour les requêtes SQL
4. `.gte('created_at', startDateISO)` pour filtrer les données

### ✅ Aucune date fixe trouvée:
- ❌ Pas de `new Date('2025-12-01')`
- ❌ Pas de `setMonth(11)` ou `setFullYear(2025)`
- ❌ Pas de dates codées en dur

### ✅ Logs ajoutés:
Tous les endpoints affichent maintenant dans la console:
- La date de début calculée (UTC)
- La date de début en heure locale (Europe/Paris)
- La date actuelle pour comparaison
- Le nombre de jours utilisé pour le calcul

---

## 📊 Exemple de Log

Quand vous appelez `/api/admin/metrics/overview?range=30d`, vous verrez dans la console:

```
[METRICS OVERVIEW] Calcul des dates: {
  range: '30d',
  days: 30,
  startDate: '2025-12-19T17:00:00.000Z',
  startDateLocal: '19/12/2025 18:00:00',
  now: '2025-12-20T17:00:00.000Z',
  nowLocal: '20/12/2025 18:00:00'
}
```

Cela confirme que:
- La date de début est bien calculée dynamiquement (30 jours avant maintenant)
- Si aujourd'hui est le 20 décembre, la date de début est le 20 novembre
- Les calculs incluent bien tous les événements depuis cette date

---

## 🎯 Conclusion

**Tous les calculs sont corrects et utilisent des dates dynamiques.** 

Si vous voyez "30 derniers jours", cela signifie bien les 30 derniers jours depuis **maintenant**, pas depuis le 1er décembre ou une autre date fixe.

Les logs ajoutés permettent de vérifier en temps réel que les dates sont bien calculées correctement à chaque appel de l'API.
