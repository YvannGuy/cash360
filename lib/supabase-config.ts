// Vérification de la configuration Supabase
export function validateSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  }

  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')
  }

  return { url, anonKey }
}
