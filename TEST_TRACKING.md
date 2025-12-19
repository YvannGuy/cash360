# Guide de test du tracking

## Problème actuel

La table `tracking_events` existe mais ne contient pas de données réelles. Il faut vérifier si le tracking fonctionne.

## Test 1: Vérifier PostgREST

Appelez cette route pour tester si PostgREST fonctionne :

```
GET http://localhost:3000/api/admin/test-tracking
```

Cela va tester :
- ✅ Lecture de la table
- ✅ Insertion dans la table
- ✅ Récupération des événements récents

## Test 2: Tester le tracking manuellement

### Test depuis le navigateur (Console)

Ouvrez la console du navigateur et exécutez :

```javascript
// Tester l'envoi d'un événement
fetch('/api/tracking/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'tool.used',
    payload: { toolKey: 'budget_tracker', test: true },
    session_id: 'test_session_' + Date.now()
  })
}).then(r => r.json()).then(console.log)
```

Si ça retourne `{success: true}`, le tracking fonctionne !

## Test 3: Utiliser les outils

1. **Budget Tracker** : Allez sur `/dashboard?tab=budget`
   - L'événement `tool.used` avec `toolKey: 'budget_tracker'` devrait être envoyé

2. **Debt Free** : Allez sur `/dashboard?tab=debtfree`
   - L'événement `tool.used` avec `toolKey: 'debt_free'` devrait être envoyé

3. **Jeûne Financier** : Allez sur `/dashboard?tab=fast`
   - L'événement `tool.used` avec `toolKey: 'financial_fast'` devrait être envoyé

4. **Panier** : Ajoutez un produit au panier puis cliquez sur l'icône panier
   - L'événement `shop.cart_opened` devrait être envoyé

## Vérifier les logs

Regardez les logs du serveur Next.js. Vous devriez voir :

```
[TRACKING API] ✅ Event tracked: tool.used
[TRACKING API] ✅ Event tracked: shop.cart_opened
```

Si vous voyez des erreurs `PGRST205` ou `PGRST202`, PostgREST ne voit toujours pas la table.

## Solution si PostgREST ne fonctionne toujours pas

1. Allez sur https://supabase.com/dashboard
2. Votre projet > Settings > General
3. **Restart project**
4. Attendez 3-5 minutes (pas juste 2 minutes)
5. Testez à nouveau

## Vérifier les données

Après avoir utilisé les outils, vérifiez les données :

```sql
SELECT * FROM public.tracking_events 
WHERE event_type IN ('tool.used', 'shop.cart_opened', 'shop.checkout_started')
ORDER BY created_at DESC
LIMIT 20;
```

Si vous voyez des données, le tracking fonctionne ! 🎉
