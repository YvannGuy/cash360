'use client'
import { useState, useMemo } from 'react'
import { createClientBrowser } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Créer une seule instance de Supabase client
  const supabase = useMemo(() => createClientBrowser(), [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // Forcer l'URL locale pour le développement
    const redirectUrl = 'http://localhost:3000/auth/callback'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 border rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <p className="text-sm opacity-80">Entrez votre e-mail pour recevoir un lien magique.</p>
        <input
          className="w-full border rounded-xl p-3"
          type="email"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="w-full rounded-xl p-3 border" disabled={sent}>
          {sent ? 'Lien envoyé ✔' : 'Envoyer le lien'}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  )
}
