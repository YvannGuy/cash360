#!/bin/bash
cd "/Users/yvannguyonnet/Downloads/Readdy (1)"

# Lire les variables d'environnement
source .env.local 2>/dev/null || true

SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ Configuration Supabase manquante dans .env.local"
  exit 1
fi

echo "📝 Application de la migration add_product_type..."

# Lire le fichier SQL
SQL=$(cat supabase/migration_add_product_type.sql)

# Utiliser curl pour exécuter via l'API Supabase
curl -X POST "https://$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$SQL\"}" 2>/dev/null || echo "Note: RPC exec_sql non disponible, veuillez appliquer manuellement"

echo ""
echo "✅ Si l'erreur ci-dessus apparaît, veuillez appliquer la migration manuellement dans l'éditeur SQL de Supabase"
echo "📄 Fichier: supabase/migration_add_product_type.sql"
