# 🔄 Guide pour rafraîchir le cache PostgREST

## Problème

L'erreur `PGRST205` indique que PostgREST (l'API REST de Supabase) n'a pas encore rafraîchi son cache de schéma après la création de la table `tracking_events`.

## Solutions

### ✅ Méthode 1: Utiliser le script automatique (Recommandé)

```bash
npm run refresh-cache
```

Ce script va :
1. Appeler la fonction SQL `refresh_postgrest_schema()`
2. Attendre quelques secondes
3. Tester si la table est maintenant accessible
4. Vous donner un retour sur le statut

### ✅ Méthode 2: Utiliser l'API route

Si votre serveur de développement est démarré (`npm run dev`), vous pouvez appeler :

```bash
curl -X POST http://localhost:3000/api/admin/refresh-schema-cache
```

Ou depuis votre navigateur, allez sur :
```
http://localhost:3000/api/admin/refresh-schema-cache
```

### ✅ Méthode 3: Redémarrer le projet Supabase (Le plus fiable)

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **General**
4. Cliquez sur **"Restart project"**
5. Attendez 1-2 minutes que le projet redémarre

Le cache PostgREST sera automatiquement rafraîchi après le redémarrage.

### ✅ Méthode 4: Attendre (Solution automatique)

Le cache PostgREST se rafraîchit automatiquement toutes les quelques minutes. Si vous pouvez attendre, le problème se résoudra de lui-même dans 2-5 minutes.

## Vérification

Pour vérifier si le problème est résolu, regardez les logs de votre application. L'erreur `PGRST205` ne devrait plus apparaître.

Vous pouvez aussi tester manuellement en appelant l'API des métriques :
```bash
curl http://localhost:3000/api/admin/metrics/usage?range=7d
```

## Notes

- La table `tracking_events` existe bien dans la base de données
- Le problème vient uniquement du cache PostgREST qui n'a pas été rafraîchi
- Une fois le cache rafraîchi, tout fonctionnera normalement
- Le code gère maintenant cette erreur gracieusement, donc l'application ne plantera pas même si le cache n'est pas encore rafraîchi
