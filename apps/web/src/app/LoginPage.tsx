import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  card: { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,.1)', width: '100%', maxWidth: '360px' },
  title: { margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: 700 },
  label: { display: 'block', marginBottom: '.4rem', fontSize: '.875rem', color: '#444' },
  input: { width: '100%', padding: '.6rem .75rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' },
  error: { color: '#c00', fontSize: '.875rem', margin: '.5rem 0 0' },
  button: { marginTop: '1.25rem', width: '100%', padding: '.75rem', fontSize: '1rem', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({ email })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/verify', { state: { email } })
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Szepter</h1>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Adres e-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={s.input}
            placeholder="ty@example.com"
            autoComplete="email"
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.button}>
            {loading ? 'Wysyłanie…' : 'Wyślij kod'}
          </button>
        </form>
      </div>
    </div>
  )
}
