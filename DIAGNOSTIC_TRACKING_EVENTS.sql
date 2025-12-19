-- ============================================
-- DIAGNOSTIC COMPLET : tracking_events
-- ============================================

-- 1) Trouve la table, peu importe son schéma
-- Liste toutes les tables/vues dont le nom ressemble à tracking_events dans tous les schémas
SELECT 
    table_schema,
    table_name,
    table_type,
    CASE 
        WHEN table_type = 'BASE TABLE' THEN 'Table'
        WHEN table_type = 'VIEW' THEN 'Vue'
        WHEN table_type = 'FOREIGN TABLE' THEN 'Table externe'
        ELSE table_type
    END as type_objet
FROM information_schema.tables
WHERE table_name ILIKE '%tracking%'
   OR table_name ILIKE '%event%'
ORDER BY table_schema, table_name;

-- Version plus spécifique pour tracking_events exactement
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE LOWER(table_name) = 'tracking_events'
ORDER BY table_schema;

-- ============================================

-- 2) Dis-moi si elle a été créée avec des guillemets / majuscules
-- Trouve les objets avec nom case-sensitive (ex: "Tracking_Events")
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename != LOWER(tablename) THEN 'MAJUSCULES détectées'
        ELSE 'minuscules uniquement'
    END as case_status,
    quote_ident(tablename) as nom_avec_guillemets
FROM pg_tables
WHERE tablename ILIKE '%tracking%'
ORDER BY schemaname, tablename;

-- Vérifier spécifiquement tracking_events avec différentes variantes
SELECT 
    'tracking_events' as recherche,
    to_regclass('public.tracking_events') as existe_sans_guillemets,
    to_regclass('public."tracking_events"') as existe_avec_guillemets,
    to_regclass('public."Tracking_Events"') as existe_majuscules,
    to_regclass('public.Tracking_Events') as existe_majuscules_sans_guillemets;

-- ============================================

-- 3) Trouve la relation exacte via pg_catalog
-- Utilise pg_class, pg_namespace (pg_catalog) pour trouver tout objet contenant tracking
SELECT 
    n.nspname as schema,
    c.relname as nom,
    CASE c.relkind
        WHEN 'r' THEN 'Table'
        WHEN 'v' THEN 'Vue'
        WHEN 'm' THEN 'Materialized View'
        WHEN 'S' THEN 'Sequence'
        WHEN 'f' THEN 'Foreign Table'
        ELSE 'Autre (' || c.relkind || ')'
    END as relkind,
    c.oid,
    c.relkind as relkind_code
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname ILIKE '%tracking%'
   OR c.relname ILIKE '%event%'
ORDER BY n.nspname, c.relname;

-- Version spécifique pour tracking_events
SELECT 
    n.nspname as schema,
    c.relname as nom,
    CASE c.relkind
        WHEN 'r' THEN 'Table'
        WHEN 'v' THEN 'Vue'
        WHEN 'm' THEN 'Materialized View'
        ELSE 'Autre'
    END as type,
    c.oid,
    pg_size_pretty(pg_total_relation_size(c.oid)) as taille
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE LOWER(c.relname) = 'tracking_events'
ORDER BY n.nspname;

-- ============================================

-- 4) Vérifie si tracking_events existe dans public
-- Confirme l'existence avec to_regclass
SELECT 
    'public.tracking_events' as nom_complet,
    to_regclass('public.tracking_events') as existe,
    CASE 
        WHEN to_regclass('public.tracking_events') IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ N''EXISTE PAS'
    END as statut;

-- Affiche l'OID si elle existe
SELECT 
    c.oid,
    n.nspname || '.' || c.relname as nom_complet,
    c.relkind,
    pg_size_pretty(pg_total_relation_size(c.oid)) as taille,
    (SELECT COUNT(*) FROM pg_attribute WHERE attrelid = c.oid AND attnum > 0) as nombre_colonnes
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'tracking_events';

-- Vérifier les colonnes de la table si elle existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tracking_events'
ORDER BY ordinal_position;

-- ============================================

-- 5) Détecte si je suis sur la bonne base/projet
-- Affiche les informations de connexion
SELECT 
    current_database() as base_de_donnees,
    current_schema() as schema_courant,
    current_user as utilisateur_courant,
    session_user as utilisateur_session,
    inet_server_addr() as adresse_serveur,
    inet_server_port() as port_serveur,
    version() as version_postgres;

-- Vérifier le schéma public et ses tables
SELECT 
    schemaname,
    COUNT(*) as nombre_tables
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;

-- Lister toutes les bases de données (pour vérifier qu'on est sur la bonne)
SELECT 
    datname as nom_base,
    pg_size_pretty(pg_database_size(datname)) as taille
FROM pg_database
WHERE datistemplate = false
ORDER BY datname;

-- ============================================

-- BONUS: Vérifier les permissions RLS sur tracking_events
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_active,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tracking_events') as nombre_policies
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'tracking_events';

-- Lister les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tracking_events';

-- ============================================

-- BONUS: Vérifier si PostgREST peut voir la table (via les permissions)
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'tracking_events';

-- Vérifier les permissions pour anon et authenticated (rôles PostgREST)
SELECT 
    grantee,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'tracking_events'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
GROUP BY grantee;
