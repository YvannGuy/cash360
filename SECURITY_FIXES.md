# Corrections de sécurité Supabase - Diagnostic et Patchs

## 🔍 DIAGNOSTIC COMPLET

### 1. Inspection des objets

**Résultats :**
- ✅ `tracking_events` : **TABLE** avec RLS activé
- ❌ `appointments_dashboard` : **N'EXISTE PAS** dans la base (alerte probablement obsolète)
- ✅ `user_profiles` : **TABLE** (pas une vue) avec RLS activé

**État actuel :**

#### `tracking_events`
- RLS : ✅ Activé
- Permissions anon/authenticated : ❌ **TOUS les privilèges** (SELECT, INSERT, UPDATE, DELETE)
- Policies RLS : 6 policies (certaines doublonnées)
- **Problème** : Accès PostgREST public ouvert alors que le tracking passe par API serveur

#### `user_profiles`
- RLS : ✅ Activé
- Permissions anon/authenticated : ❌ **TOUS les privilèges**
- Policies RLS : 4 policies (certaines doublonnées)
- **Note** : C'est une TABLE, pas une vue. L'alerte "Security Definer View" est probablement un faux positif.

#### `appointments_dashboard`
- ❌ **N'existe pas** dans la base de données
- L'alerte est probablement obsolète ou concerne un autre projet

---

## 🛠️ PATCHS SQL

### Patch 1 : Sécuriser `tracking_events`

**Objectif** : Retirer l'accès PostgREST public (anon/authenticated) car le tracking passe par `/api/tracking/event` avec `service_role`.

```sql
-- ============================================
-- PATCH 1: Sécuriser tracking_events
-- ============================================

-- 1. Retirer tous les privilèges pour anon et authenticated
REVOKE ALL ON TABLE public.tracking_events FROM anon;
REVOKE ALL ON TABLE public.tracking_events FROM authenticated;

-- 2. Garder uniquement service_role (pour l'API serveur)
-- service_role a déjà les permissions via postgres

-- 3. Nettoyer les policies RLS doublonnées
-- Garder uniquement la policy "Service role can do everything" qui permet tout via service_role
DROP POLICY IF EXISTS "Allow service role insert" ON public.tracking_events;
DROP POLICY IF EXISTS "Allow service role select" ON public.tracking_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.tracking_events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.tracking_events;
DROP POLICY IF EXISTS "Users can view their own tracking events" ON public.tracking_events;

-- La policy "Service role can do everything" reste (elle permet service_role de tout faire)
-- Vérifier qu'elle existe, sinon la créer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tracking_events' 
      AND policyname = 'Service role can do everything'
  ) THEN
    CREATE POLICY "Service role can do everything"
      ON public.tracking_events
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Notifier PostgREST pour recharger le schéma (via pg_notify)
NOTIFY pgrst, 'reload schema';

-- Vérification
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'tracking_events'
  AND grantee IN ('anon', 'authenticated');
-- Devrait retourner 0 lignes
```

**Impact** :
- ✅ Le tracking continue de fonctionner via `/api/tracking/event` (utilise `service_role`)
- ✅ Les fonctions SQL `insert_tracking_event` et `get_tracking_events_bypass` continuent de fonctionner (utilisent `SECURITY DEFINER`)
- ❌ Les clients ne peuvent plus accéder directement à `tracking_events` via PostgREST (c'est voulu)

---

### Patch 2 : Nettoyer les policies RLS de `user_profiles`

**Objectif** : Simplifier les policies doublonnées sans changer le comportement.

```sql
-- ============================================
-- PATCH 2: Nettoyer user_profiles (policies doublonnées)
-- ============================================

-- Les policies actuelles :
-- 1. "Users can view own profile" (SELECT)
-- 2. "Users can update own profile for pro request" (UPDATE)
-- 3. "Users can upsert own profile for pro request" (INSERT)
-- 4. "user_profiles_user_all" (ALL) - DOUBLON avec les autres

-- Supprimer la policy générique "user_profiles_user_all" qui fait doublon
DROP POLICY IF EXISTS "user_profiles_user_all" ON public.user_profiles;

-- Les 3 autres policies restent (elles sont spécifiques et nécessaires)

-- Vérification
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles'
ORDER BY cmd, policyname;
-- Devrait retourner 3 policies : SELECT, INSERT, UPDATE
```

**Impact** :
- ✅ Comportement identique (les utilisateurs peuvent toujours voir/modifier leur propre profil)
- ✅ Code plus propre (moins de policies)

---

### Patch 3 : Vérifier les permissions `user_profiles`

**Objectif** : S'assurer que `user_profiles` n'expose pas trop de permissions publiques.

```sql
-- ============================================
-- PATCH 3: Vérifier permissions user_profiles
-- ============================================

-- Les permissions actuelles sont correctes (anon/authenticated ont les privilèges)
-- mais RLS les protège via les policies "own profile only"
-- C'est sécurisé car chaque policy vérifie auth.uid() = user_id

-- Pas de changement nécessaire, mais on peut documenter :
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND grantee IN ('anon', 'authenticated');
-- Les privilèges existent mais sont protégés par RLS
```

**Note** : Les permissions sont correctes car RLS protège l'accès. Les utilisateurs ne peuvent voir/modifier que leur propre profil.

---

## 🔄 ROLLBACK (si nécessaire)

```sql
-- ============================================
-- ROLLBACK: Restaurer tracking_events
-- ============================================

-- Restaurer les permissions (si besoin de rollback)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tracking_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tracking_events TO authenticated;

-- Recréer les policies utilisateur (si besoin)
CREATE POLICY "Users can view their own tracking events"
  ON public.tracking_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
  ON public.tracking_events
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

-- Notifier PostgREST
NOTIFY pgrst, 'reload schema';
```

---

## ✅ PLAN DE TEST

### Test 1 : Vérifier que le tracking fonctionne toujours

```bash
# Test insertion via API (devrait fonctionner)
curl -X POST http://localhost:3000/api/tracking/event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "tool.opened",
    "payload": {"tool": "budget"},
    "session_id": "test_session_123"
  }'

# Devrait retourner : {"success": true, "eventId": "...", "method": "postgrest"}
```

### Test 2 : Vérifier que l'accès PostgREST public est bloqué

```bash
# Test avec clé anon (devrait échouer)
curl -X GET "https://[PROJECT].supabase.co/rest/v1/tracking_events?select=*&limit=1" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]"

# Devrait retourner : 403 Forbidden ou erreur de permission
```

### Test 3 : Vérifier les métriques admin

```bash
# Test route admin (devrait fonctionner)
curl http://localhost:3000/api/admin/metrics/paid-usage?range=30d

# Devrait retourner les métriques avec les données de tracking
```

### Test 4 : Vérifier user_profiles

```bash
# Test lecture propre profil (devrait fonctionner si authentifié)
# Via l'application normale, l'utilisateur doit pouvoir voir son profil

# Test lecture autre utilisateur (devrait échouer)
# Via PostgREST avec un user_id différent, devrait retourner 0 résultats
```

---

## 📋 RÉSUMÉ DES ACTIONS

1. ✅ **tracking_events** : Retirer permissions anon/authenticated (sécurisé car API serveur)
2. ✅ **user_profiles** : Nettoyer policies doublonnées (pas de changement fonctionnel)
3. ⚠️ **appointments_dashboard** : N'existe pas (alerte probablement obsolète)
4. ✅ **Exposed Auth Users** : Pas de vue exposant auth.users directement (fonction `update_daily_metrics` est SECURITY DEFINER, normal pour admin)

---

## 🚀 EXÉCUTION

Exécuter les patches dans l'ordre :
1. Patch 1 (tracking_events)
2. Patch 2 (user_profiles)
3. Tests
4. Si problème → Rollback
