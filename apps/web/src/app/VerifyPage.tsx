import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  card: { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,.1)', width: '100%', maxWidth: '360px' },
  title: { margin: '0 0 .5rem', fontSize: '1.5rem', fontWeight: 700 },
  subtitle: { margin: '0 0 1.5rem', color: '#666', fontSize: '.875rem' },
  label: { display: 'block', marginBottom: '.4rem', fontSize: '.875rem', color: '#444' },
  input: { width: '100%', padding: '.6rem .75rem', fontSize: '1.25rem', letterSpacing: '.2em', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', textAlign: 'center' },
  error: { color: '#c00', fontSize: '.875rem', margin: '.5rem 0 0' },
  button: { marginTop: '1.25rem', width: '100%', padding: '.75rem', fontSize: '1rem', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  back: { marginTop: '.75rem', width: '100%', padding: '.6rem', fontSize: '.875rem', background: 'transparent', color: '#555', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' },
}

export function VerifyPage() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'email',
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Sprawdź skrzynkę</h1>
        <p style={s.subtitle}>
          Wysłaliśmy 6-cyfrowy kod na{' '}
          <strong>{email || 'Twój adres e-mail'}</strong>.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Kod jednorazowy</label>
          <input
            type="text"
            inputMode="numeric"
            value={token}
            onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            style={s.input}
            placeholder="000000"
            autoComplete="one-time-code"
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading || token.length < 6} style={s.button}>
            {loading ? 'Weryfikowanie…' : 'Zaloguj się'}
          </button>
          <button type="button" onClick={() => navigate('/login')} style={s.back}>
            ← Wróć
          </button>
        </form>
      </div>
    </div>
  )
}
