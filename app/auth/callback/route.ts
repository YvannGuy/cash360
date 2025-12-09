import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Gérer les codes de confirmation (OAuth, email confirmation, ou réinitialisation)
  if (code) {
    const recoveryType = searchParams.get('type')
    
    // Si c'est une réinitialisation de mot de passe, échanger le code et rediriger vers la page de réinitialisation
    if (recoveryType === 'recovery') {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && session) {
        // Rediriger vers la page de réinitialisation
        // La session est maintenant établie, l'utilisateur pourra changer son mot de passe
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      } else {
        // En cas d'erreur, rediriger vers la page de réinitialisation avec un message d'erreur
        return NextResponse.redirect(`${origin}/auth/reset-password?error=invalid-link`)
      }
    }
    
    // Pour les autres types (OAuth, confirmation email)
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // L'email de bienvenue sera envoyé lors de la première connexion au dashboard
      // via l'API /api/welcome-email
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Gérer les tokens de confirmation email (format alternatif)
  if (token && type === 'signup') {
    try {
      // Vérifier le token et confirmer l'email
      const { data: { user }, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })
      
      if (!error && user) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error)
    }
  }

  // Gérer les tokens de réinitialisation de mot de passe (format token au lieu de code)
  if (token && type === 'recovery') {
    // Rediriger vers la page de réinitialisation avec le token
    return NextResponse.redirect(`${origin}/auth/reset-password?token=${token}&type=recovery`)
  }

  // Retourner à la page d'accueil en cas d'erreur
  return NextResponse.redirect(`${origin}/`)
}