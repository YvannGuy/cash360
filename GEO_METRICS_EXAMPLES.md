# Exemples de réponses JSON - Métriques géographiques améliorées

## 📊 Endpoint `/api/admin/metrics/overview`

### Avant
```json
{
  "success": true,
  "metrics": {
    "activeUsers30d": 49
  }
}
```

### Après
```json
{
  "success": true,
  "metrics": {
    "activeUsers30d": 49,        // Active Any (30j) - conservé pour compatibilité
    "activeCoreUsers30d": 12,     // Active Core (30j) - NOUVEAU
    "activeUsers7d": 49,
    "activeCoreUsers7d": 8        // Active Core (7j) - NOUVEAU
  }
}
```

**Logs console :**
```
[METRICS OVERVIEW] Active Core vs Active Any: {
  '7d': { any: 49, core: 8, diff: 41 },
  '30d': { any: 49, core: 12, diff: 37 }
}
```

---

## 🌍 Endpoint `/api/admin/metrics/geo`

### Structure complète de réponse

```json
{
  "success": true,
  "geo": {
    "regionsBreakdown": [
      {
        "region": "Afrique Centrale",
        "users": 120,
        "active30d": 45,              // Compatibilité (alias activeAny30j)
        "activeAny30j": 45,           // Nouveau format
        "activeCore30j": 18,          // NOUVEAU
        "paidUsers": 15,
        "revenue30d": 599.70
      }
    ],
    "countriesTopUsers": [
      {
        "country": "République démocratique du Congo",
        "users": 50,                  // Compatibilité
        "users_total": 50,            // Nouveau format
        "active30d": 35,              // Compatibilité (alias activeAny30j)
        "active_any_30j": 35,         // Nouveau format
        "active_core_30j": 12,        // NOUVEAU
        "paidUsers": 8,               // Compatibilité
        "paid_count": 8,              // Nouveau format
        "revenue30d": 319.84,         // Compatibilité
        "revenue_30j": 319.84,       // Nouveau format
        "conversionRate": 16.0,      // Compatibilité
        "conversion": 16.0,           // Nouveau format
        "activeRate": 70.0,
        "activeCoreRate": 24.0       // NOUVEAU
      },
      {
        "country": "Côte d'Ivoire",
        "users": 30,
        "users_total": 30,
        "active30d": 20,
        "active_any_30j": 20,
        "active_core_30j": 8,
        "paidUsers": 5,
        "paid_count": 5,
        "revenue30d": 199.90,
        "revenue_30j": 199.90,
        "conversionRate": 16.7,
        "conversion": 16.7,
        "activeRate": 66.7,
        "activeCoreRate": 26.7
      }
    ],
    "citiesTopUsers": [
      {
        "city": "Kinshasa",
        "country": "République démocratique du Congo",
        "users": 25,
        "active30d": 18,              // Compatibilité (alias activeAny30j)
        "activeAny30j": 18,          // Nouveau format
        "activeCore30j": 6           // NOUVEAU
      },
      {
        "city": "Abidjan",
        "country": "Côte d'Ivoire",
        "users": 15,
        "active30d": 12,
        "activeAny30j": 12,
        "activeCore30j": 4
      }
    ],
    "unknownShare": {                // Compatibilité dashboard
      "unknownUsers": 45,
      "totalUsers": 229,
      "percent": 19.7
    },
    "dataQuality": {                 // NOUVEAU - Section qualité des données
      "countryUnknown": {
        "count": 45,
        "percent": 19.7
      },
      "cityUnknown": {
        "count": 78,
        "percent": 34.1
      },
      "topRawCountries": [
        { "value": "rdc", "count": 12 },
        { "value": "congo", "count": 8 },
        { "value": "non renseigné", "count": 45 },
        { "value": "drc", "count": 3 }
      ],
      "topRawCities": [
        { "value": "kinshasa", "count": 15 },
        { "value": "kinshasa (autre)", "count": 3 },
        { "value": "non renseigné", "count": 78 }
      ]
    },
    "recommendations": {
      "highPotentialCountries": [    // Exclut "Autres/Inconnu"
        {
          "country": "Côte d'Ivoire",
          "users": 30,                // Compatibilité
          "users_total": 30,          // Nouveau format
          "conversionRate": 16.7,     // Compatibilité
          "conversion": 16.7          // Nouveau format
        }
      ],
      "highPerformanceCountries": [  // Exclut "Autres/Inconnu"
        {
          "country": "République démocratique du Congo",
          "users": 50,
          "users_total": 50,
          "conversionRate": 16.0,
          "conversion": 16.0,
          "activeRate": 70.0,
          "activeCoreRate": 24.0      // NOUVEAU
        }
      ],
      "topCitiesForEvents": [        // Exclut villes avec pays "Inconnu"
        {
          "city": "Kinshasa",
          "country": "République démocratique du Congo",
          "users": 25,
          "active30d": 18,            // Compatibilité (alias activeAny30j)
          "activeAny30j": 18,         // Nouveau format
          "activeCore30j": 6          // NOUVEAU
        }
      ]
    }
  },
  "range": "30d",
  "computedAt": "2025-12-19T20:00:00.000Z"
}
```

---

## 🔍 Différences clés

### 1. Active Any vs Active Core

**Active Any (30j)** = 49 utilisateurs
- Compte n'importe quel événement de tracking
- Inclut : `tool.opened`, `tool.used`, `auth.signup`, `shop.cart_opened`, etc.

**Active Core (30j)** = 12 utilisateurs
- Compte uniquement les core events (actions métier)
- Inclut uniquement : `budget.saved`, `budget.expense_added`, `debt.payment_made`, `debt.added`, `fast.day_logged`, `fast.started`

**Différence** : 37 utilisateurs (75.5%) sont actifs mais n'ont pas fait d'actions core → métrique plus précise pour l'engagement réel

---

### 2. Normalisation améliorée

**Avant :**
- `"rdc"` → `"République démocratique du Congo"`
- `"kinshasa (autre)"` → `"Kinshasa"` avec pays `"Autres"` ❌

**Après :**
- `"rdc"` → `"République démocratique du Congo"` ✅
- `"drc"` → `"République démocratique du Congo"` ✅
- `"kinshasa (autre)"` → `"Kinshasa"` avec pays `"Unknown"` ✅
- `"ci"` → `"Côte d'Ivoire"` ✅
- `"fr"` → `"France"` ✅

---

### 3. Recommandations filtrées

**Avant :**
```json
{
  "highPotentialCountries": [
    { "country": "Autres", "users": 10, ... }  // ❌ Non actionnable
  ]
}
```

**Après :**
```json
{
  "highPotentialCountries": [
    { "country": "Côte d'Ivoire", "users": 30, ... }  // ✅ Actionnable
  ]
}
```

---

### 4. Qualité des données

**Nouvelle section pour identifier les problèmes :**
```json
{
  "dataQuality": {
    "countryUnknown": {
      "count": 45,
      "percent": 19.7  // 19.7% des utilisateurs n'ont pas de pays renseigné
    },
    "topRawCountries": [
      { "value": "rdc", "count": 12 },  // Variante non normalisée détectée
      { "value": "non renseigné", "count": 45 }
    ]
  }
}
```

**Action possible :** Améliorer la collecte de géolocalisation pour réduire le % d'inconnu

---

## ✅ Compatibilité garantie

Tous les champs existants sont conservés avec des alias :
- `active30d` → alias de `active_any_30j`
- `users` → alias de `users_total`
- `paidUsers` → alias de `paid_count`
- `revenue30d` → alias de `revenue_30j`
- `conversionRate` → alias de `conversion`
- `unknownShare` → conservé pour compatibilité

Le dashboard existant continue de fonctionner sans modification.
