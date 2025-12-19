# Script de Test - Corrections Sécurité

## ✅ Vérifications Post-Patch

### 1. Vérifier que tracking_events est sécurisé

```sql
-- Vérifier qu'anon/authenticated n'ont plus de permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'tracking_events'
  AND grantee IN ('anon', 'authenticated');
-- Résultat attendu : 0 lignes ✅
```

### 2. Vérifier que service_role peut toujours accéder

```sql
-- Vérifier que service_role a les permissions (via postgres)
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'tracking_events'
  AND grantee = 'service_role';
-- Résultat attendu : Tous les privilèges ✅
```

### 3. Vérifier les policies RLS

```sql
-- tracking_events devrait avoir 1 seule policy (service_role)
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'tracking_events';
-- Résultat attendu : 1 policy "Service role can do everything" ✅

-- user_profiles devrait avoir 3 policies (SELECT, INSERT, UPDATE)
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles'
ORDER BY cmd;
-- Résultat attendu : 3 policies (SELECT, INSERT, UPDATE) ✅
```

---

## 🧪 Tests Fonctionnels

### Test 1 : Tracking via API (devrait fonctionner)

```bash
# Test insertion via API route (utilise service_role)
curl -X POST http://localhost:3000/api/tracking/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [USER_TOKEN]" \
  -d '{
    "event_type": "tool.opened",
    "payload": {"tool": "budget"},
    "session_id": "test_security_123"
  }'

# Résultat attendu : {"success": true, "eventId": "...", "method": "postgrest"}
```

### Test 2 : Accès PostgREST public bloqué (devrait échouer)

```bash
# Test avec clé anon (devrait retourner 403 ou erreur)
curl -X GET "https://[PROJECT].supabase.co/rest/v1/tracking_events?select=*&limit=1" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]"

# Résultat attendu : 403 Forbidden ou erreur de permission ✅
```

### Test 3 : Métriques admin (devrait fonctionner)

```bash
# Test route admin (utilise service_role)
curl http://localhost:3000/api/admin/metrics/paid-usage?range=30d

# Résultat attendu : JSON avec métriques ✅
```

### Test 4 : Fonctions SQL bypass (devrait fonctionner)

```bash
# Test fonction insert_tracking_event (SECURITY DEFINER)
curl -X POST http://localhost:3000/api/tracking/event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test.security_test",
    "payload": {"test": true}
  }'

# Résultat attendu : {"success": true, "eventId": "...", "method": "sql_function" ou "postgrest"}
```

---

## 📊 Résumé des Corrections

| Objet | Problème | Solution | Statut |
|-------|----------|----------|--------|
| `tracking_events` | Permissions anon/authenticated | REVOKE ALL | ✅ Appliqué |
| `tracking_events` | Policies doublonnées | Nettoyage (6 → 1) | ✅ Appliqué |
| `user_profiles` | Policy doublonnée | Suppression "user_profiles_user_all" | ✅ Appliqué |
| `appointments_dashboard` | N'existe pas | Aucune action | ⚠️ Alerte obsolète |

---

## 🔄 Rollback (si nécessaire)

Voir `SECURITY_FIXES.md` section "ROLLBACK"
