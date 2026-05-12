'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { apiFetch } from '../../lib/api-client'
import Nav from '../../components/Nav'

export default function AdminPage() {
  const [profile, setProfile] = useState(null)
  const [clients, setClients] = useState([])
  const [newClient, setNewClient] = useState({ email: '', password: '', businessName: '', contactName: '', phone: '' })
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(p)
      loadClients()
    })
  }, [])

  async function loadClients() {
    const { data } = await supabase.from('profiles').select('*, documents(count)').eq('role', 'client').order('created_at', { ascending: false })
    setClients(data || [])
  }

  async function createClient_() {
    setCreating(true)
    setMsg('')
    try {
      const r = await apiFetch('/api/auth/create-client', { method: 'POST', body: JSON.stringify(newClient) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setMsg('Client created successfully!')
      setNewClient({ email: '', password: '', businessName: '', contactName: '', phone: '' })
      setShowForm(false)
      loadClients()
    } catch (e) { setMsg('Error: ' + e.message) }
    finally { setCreating(false) }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav user={profile} />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Client management</div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add client
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '1rem' }}>Create new client account</div>
            {msg && <div style={{ padding: '10px', borderRadius: 'var(--r-sm)', background: msg.startsWith('Error') ? 'var(--red-light)' : 'var(--green-light)', color: msg.startsWith('Error') ? 'var(--red)' : 'var(--green-dark)', fontSize: '13px', marginBottom: '1rem' }}>{msg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { key: 'businessName', label: 'Business name *', placeholder: "Murillo's Renovation LLC" },
                { key: 'contactName', label: 'Contact name', placeholder: 'Jose Murillo' },
                { key: 'email', label: 'Email *', placeholder: 'client@email.com', type: 'email' },
                { key: 'password', label: 'Password *', placeholder: 'Temporary password', type: 'password' },
                { key: 'phone', label: 'Phone', placeholder: '(301) 555-0100' }
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '6px' }}>{f.label}</label>
                  <input type={f.type || 'text'} value={newClient[f.key]} onChange={e => setNewClient(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--r-sm)', fontSize: '13px', outline: 'none', fontFamily: 'var(--font)' }} />
                </div>
              ))}
            </div>
            <button onClick={createClient_} disabled={creating} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              {creating ? 'Creating...' : 'Create client account'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!clients.length && <div className="card" style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '13px' }}>No clients yet — add your first client above</div>}
          {clients.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--green-dark)', flexShrink: 0 }}>
                {(c.business_name || c.email).slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{c.business_name || c.email}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{c.email} {c.phone ? '· ' + c.phone : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{c.documents?.[0]?.count || 0} docs</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{new Date(c.created_at).toLocaleDateString()}</div>
              </div>
              <a href={`/messages?clientId=${c.id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>Message</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
