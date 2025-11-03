import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Support des deux formats de variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper pour obtenir le client admin
function getSupabaseAdmin() {
  // Dans Next.js, les variables d'environnement sans NEXT_PUBLIC_ ne sont disponibles que côté serveur
  // Donc on vérifie d'abord la variable avec préfixe, puis sans préfixe
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    // Log seulement côté serveur pour éviter les warnings côté client
    if (typeof window === 'undefined') {
      console.warn('⚠️ Supabase Admin configuration missing', {
        hasUrl: !!url,
        hasServiceKey: !!serviceKey,
        nodeEnv: process.env.NODE_ENV
      })
    }
    return null
  }
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Client serveur avec service role key pour les opérations admin
export const supabaseAdmin = getSupabaseAdmin()

// Log pour debug (uniquement côté serveur)
// Note: Dans Next.js, les variables sans NEXT_PUBLIC_ sont disponibles uniquement côté serveur
// Le warning s'affichera côté serveur si la variable n'est pas chargée
if (!supabaseAdmin && typeof window === 'undefined') {
  // Vérifier si les variables sont vraiment manquantes ou juste pas chargées
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // Debug: afficher plus d'infos seulement si vraiment manquant
  if (!serviceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY non trouvée côté serveur', {
      hasUrl: !!url,
      hasServiceKey: false,
      note: 'Vérifiez que la variable est dans .env.local et redémarrez le serveur de développement'
    })
  } else if (!url) {
    console.warn('⚠️ SUPABASE_URL non trouvée côté serveur', {
      hasUrl: false,
      hasServiceKey: !!serviceKey
    })
  }
}

// Client public pour les opérations côté client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper pour le client browser
export const createClientBrowser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }

  return createBrowserClient(url, anonKey)
}
