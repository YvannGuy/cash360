'use client'

import { useState } from 'react'
import { createClientBrowser } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClientBrowser()

  const testSignUp = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(`Erreur: ${error.message}`)
      } else {
        setMessage(`Inscription réussie ! Vérifiez votre email: ${data.user?.email}`)
        console.log('User data:', data)
      }
    } catch (err: any) {
      setError(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSignIn = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(`Erreur: ${error.message}`)
      } else {
        setMessage(`Connexion réussie ! Utilisateur: ${data.user?.email}`)
        console.log('User data:', data)
      }
    } catch (err: any) {
      setError(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testConfig = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setMessage(`URL: ${url ? '✅ Configurée' : '❌ Manquante'}\nKey: ${key ? '✅ Configurée' : '❌ Manquante'}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Supabase Configuration</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="••••••••"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={testConfig}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Tester la config
            </button>
            
            <button
              onClick={testSignUp}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Test Sign Up'}
            </button>
            
            <button
              onClick={testSignIn}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Test Sign In'}
            </button>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <pre className="whitespace-pre-wrap">{message}</pre>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Configuration requise dans Supabase :</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>1. Aller dans Authentication → Settings</li>
            <li>2. Configurer "Site URL" : <code>https://cash360.finance</code></li>
            <li>3. Ajouter "Redirect URLs" : <code>https://cash360.finance/auth/callback</code></li>
            <li>4. Configurer les templates d'email</li>
            <li>5. Vérifier que l'authentification par email est activée</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
