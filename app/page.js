'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleDemo() {
    setError('')
    setDemoLoading(true)
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setDemoLoading(false)
        return
      }
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
      router.push('/dashboard')
    } catch (e) {
      setError('Demo login unavailable. Please sign in normally.')
      setDemoLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F6E56, #1D9E75 60%, #5DCAA5)', padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--r-xl)',
        padding: '2.5rem', width: '100%', maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <div style={{
            width: '40px', height: '40px', background: 'var(--green)',
            borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '600' }}>FieldFlow</span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '6px' }}>Welcome back</h1>
        <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '2rem' }}>
          Sign in to your client portal
        </p>

        {error && (
          <div style={{
            background: 'var(--red-light)', color: 'var(--red)',
            padding: '10px 14px', borderRadius: 'var(--r-sm)',
            fontSize: '13px', marginBottom: '1rem'
          }}>{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '6px' }}>
              Email address
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              style={{
                width: '100%', padding: '11px 14px', border: '1px solid var(--gray-200)',
                borderRadius: 'var(--r-sm)', fontSize: '14px', outline: 'none',
                background: 'var(--gray-50)', color: 'var(--gray-900)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Your password"
              style={{
                width: '100%', padding: '11px 14px', border: '1px solid var(--gray-200)',
                borderRadius: 'var(--r-sm)', fontSize: '14px', outline: 'none',
                background: 'var(--gray-50)', color: 'var(--gray-900)'
              }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? 'var(--gray-300)' : 'var(--green)',
              color: 'white', border: 'none', borderRadius: 'var(--r-sm)',
              fontSize: '15px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '12px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in to portal'}
          </button>
        </form>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
          <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
        </div>

        <button
          onClick={handleDemo} disabled={demoLoading}
          style={{
            width: '100%', padding: '12px',
            background: demoLoading ? 'var(--gray-100)' : '#f0fdf4',
            color: demoLoading ? 'var(--gray-500)' : 'var(--green)',
            border: '1px solid',
            borderColor: demoLoading ? 'var(--gray-200)' : '#bbf7d0',
            borderRadius: 'var(--r-sm)',
            fontSize: '14px', fontWeight: '500',
            cursor: demoLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {demoLoading ? 'Setting up demo...' : '🚀 Try Demo Account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--gray-500)', marginTop: '1.5rem' }}>
          No account? <span style={{ color: 'var(--green)', fontWeight: '500' }}>Contact your tax preparer</span>
        </p>
      </div>
    </div>
  )
}
