# Améliorations des métriques géographiques

## ✅ Modifications apportées

### 1. Ajout de la métrique "Active Core (30j)" dans `/api/admin/metrics/overview`

**Nouvelles métriques ajoutées :**
- `activeCoreUsers7d` : Utilisateurs avec au moins 1 core event dans les 7 derniers jours
- `activeCoreUsers30d` : Utilisateurs avec au moins 1 core event dans les 30 derniers jours

**Core events définis :**
- `budget.saved`, `budget.expense_added`
- `debt.payment_made`, `debt.added`
- `fast.day_logged`, `fast.started`

**Métriques existantes conservées :**
- `activeUsers7d` → renommé en `activeUsers7d` (Active Any)
- `activeUsers30d` → renommé en `activeUsers30d` (Active Any)

**Exemple de réponse JSON :**
```json
{
  "success": true,
  "metrics": {
    "totalUsers": 229,
    "activeUsers30d": 49,        // Active Any (30j)
    "activeCoreUsers30d": 12,     // Active Core (30j) - NOUVEAU
    "activeUsers7d": 49,
    "activeCoreUsers7d": 8,        // Active Core (7j) - NOUVEAU
    ...
  }
}
```

---

### 2. Amélioration de la normalisation des pays/villes

**Améliorations :**
- Mapping exhaustif des variantes (RDC, DRC, Congo-Kinshasa → "République démocratique du Congo")
- Support des codes ISO2 (FR, CD, CI, etc.) → noms canoniques
- Gestion cohérente des villes avec pays inconnu (ex: "Kinshasa (Unknown)" au lieu de "Kinshasa(Autre)")

**Exemples de normalisation :**
- `"rdc"` → `"République démocratique du Congo"`
- `"drc"` → `"République démocratique du Congo"`
- `"congo-kinshasa"` → `"République démocratique du Congo"`
- `"ci"` → `"Côte d'Ivoire"`
- `"fr"` → `"France"`
- `"kinshasa (autre)"` → `"Kinshasa"` avec pays `"Unknown"`

---

### 3. Mise à jour de `/api/admin/metrics/geo`

#### Nouvelles métriques par pays

**Structure mise à jour :**
```json
{
  "country": "France",
  "users_total": 50,              // Nombre total d'utilisateurs
  "active_any_30j": 35,           // Active Any (30j) - n'importe quel event
  "active_core_30j": 12,          // Active Core (30j) - core events uniquement - NOUVEAU
  "paid_count": 8,                // Nombre d'utilisateurs payants
  "revenue_30j": 319.84,          // Revenus sur 30j
  "conversion": 16.0,              // Taux de conversion (%)
  "activeRate": 70.0,              // Taux d'activité Any (%)
  "activeCoreRate": 24.0           // Taux d'activité Core (%) - NOUVEAU
}
```

#### Exclusion de "Autres/Inconnu" des recommandations

Les recommandations excluent maintenant explicitement :
- Pays : `"Autres"`, `"Inconnu"`, `"Unknown"`
- Villes : avec pays `"Autres"`, `"Inconnu"`, `"Unknown"`

**Avant :**
```json
{
  "recommendations": {
    "highPotentialCountries": [
      { "country": "Autres", "users": 10, ... }  // ❌ Non actionnable
    ]
  }
}
```

**Après :**
```json
{
  "recommendations": {
    "highPotentialCountries": [
      { "country": "Côte d'Ivoire", "users": 15, ... }  // ✅ Actionnable
    ]
  }
}
```

#### Nouvelle section "Qualité des données"

**Structure :**
```json
{
  "dataQuality": {
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
      { "value": "non renseigné", "count": 45 }
    ],
    "topRawCities": [
      { "value": "kinshasa", "count": 15 },
      { "value": "kinshasa (autre)", "count": 3 },
      { "value": "non renseigné", "count": 78 }
    ]
  }
}
```

---

### 4. Exemple complet de réponse GEO

```json
{
  "success": true,
  "geo": {
    "regionsBreakdown": [
      {
        "region": "Afrique Centrale",
        "users": 120,
        "activeAny30j": 45,
        "activeCore30j": 18,
        "paidUsers": 15,
        "revenue30d": 599.70
      }
    ],
    "countriesTopUsers": [
      {
        "country": "République démocratique du Congo",
        "users_total": 50,
        "active_any_30j": 35,
        "active_core_30j": 12,
        "paid_count": 8,
        "revenue_30j": 319.84,
        "conversion": 16.0,
        "activeRate": 70.0,
        "activeCoreRate": 24.0
      },
      {
        "country": "Côte d'Ivoire",
        "users_total": 30,
        "active_any_30j": 20,
        "active_core_30j": 8,
        "paid_count": 5,
        "revenue_30j": 199.90,
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
        "activeAny30j": 18,
        "activeCore30j": 6
      }
    ],
    "dataQuality": {
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
        { "value": "non renseigné", "count": 45 }
      ],
      "topRawCities": [
        { "value": "kinshasa", "count": 15 },
        { "value": "non renseigné", "count": 78 }
      ]
    },
    "recommendations": {
      "highPotentialCountries": [
        {
          "country": "Côte d'Ivoire",
          "users_total": 30,
          "conversion": 16.7
        }
      ],
      "highPerformanceCountries": [
        {
          "country": "République démocratique du Congo",
          "users_total": 50,
          "conversion": 16.0,
          "activeCoreRate": 24.0
        }
      ],
      "topCitiesForEvents": [
        {
          "city": "Kinshasa",
          "country": "République démocratique du Congo",
          "users": 25,
          "activeCore30j": 6
        }
      ]
    }
  },
  "range": "30d",
  "computedAt": "2025-12-19T20:00:00.000Z"
}
```

---

### 5. Logs de vérification

Les endpoints loggent maintenant la différence entre Active Core et Active Any :

**Dans `/api/admin/metrics/overview` :**
```
[METRICS OVERVIEW] Active Core vs Active Any: {
  '7d': { any: 49, core: 8, diff: 41 },
  '30d': { any: 49, core: 12, diff: 37 }
}
```

**Dans `/api/admin/metrics/geo` :**
```
[METRICS GEO] Active Core vs Active Any: {
  activeAny: 49,
  activeCore: 12,
  diff: 37
}
```

---

### 6. Compatibilité avec le dashboard existant

**✅ Aucun breaking change :**
- Les clés existantes sont conservées (`activeUsers30d`, `countriesTopUsers`, etc.)
- Nouvelles clés ajoutées en plus (`activeCoreUsers30d`, `active_core_30j`, etc.)
- Le dashboard existant continue de fonctionner

**Champs conservés pour compatibilité :**
- `active30d` → maintenant `activeAny30j` (mais logique identique)
- `unknownShare` → maintenant dans `dataQuality.countryUnknown`
- Structure `recommendations` identique (mais filtrée)

---

## 📊 Impact attendu

1. **Métriques plus fiables** : Active Core reflète mieux l'engagement réel (actions clés vs événements techniques)
2. **Recommandations actionnables** : Exclusion de "Autres/Inconnu" permet des actions concrètes
3. **Meilleure qualité des données** : Section dédiée pour identifier les problèmes de géolocalisation
4. **Normalisation améliorée** : Réduction des doublons (Kinshasa(Autre) → Kinshasa)

---

## 🧪 Tests recommandés

1. Vérifier que `activeCoreUsers30d < activeUsers30d` (normalement toujours vrai)
2. Vérifier que les recommandations n'incluent plus "Autres/Inconnu"
3. Vérifier que `dataQuality` contient des données utiles
4. Vérifier que le dashboard affiche correctement les nouvelles métriques
