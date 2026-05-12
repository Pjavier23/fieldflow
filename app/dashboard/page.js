'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { apiFetch } from '../../lib/api-client'
import Nav from '../../components/Nav'

const fmt = n => n != null ? '$' + Number(n).toLocaleString() : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

const statusBadge = {
  done: <span className="badge badge-green">Done</span>,
  uploaded: <span className="badge badge-amber">Queued</span>,
  processing: <span className="badge badge-blue">Processing</span>,
  error: <span className="badge badge-red">Error</span>
}

const docIcons = {
  bank_statement: { bg: 'var(--blue-light)', stroke: 'var(--blue)' },
  invoice: { bg: 'var(--green-light)', stroke: 'var(--green-dark)' },
  receipt: { bg: 'var(--amber-light)', stroke: 'var(--amber)' },
  contract: { bg: 'var(--red-light)', stroke: 'var(--red)' },
  w2_1099: { bg: 'var(--blue-light)', stroke: 'var(--blue)' },
  other: { bg: 'var(--gray-100)', stroke: 'var(--gray-500)' }
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [docs, setDocs] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const [profileRes, docsRes, analyticsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('documents').select('*').eq('client_id', user.id).order('uploaded_at', { ascending: false }).limit(6),
        apiFetch('/api/analytics').then(r => r.json())
      ])

      setProfile(profileRes.data)
      setDocs(docsRes.data || [])
      setAnalytics(analyticsRes)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh' }}>
      <div className="loading-center"><div className="spinner" /></div>
    </div>
  )

  const an = analytics?.summary || {}

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav user={profile} />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>

        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
          borderRadius: 'var(--r-lg)', padding: '1.75rem', color: 'white',
          marginBottom: '1.25rem', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>{profile?.business_name || user?.email}</div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '1.25rem' }}>Your FieldFlow portal — {new Date().getFullYear()} tax year</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { val: fmt(an.netProfit), label: 'Net income' },
              { val: an.docCount || 0, label: 'Documents' },
              { val: 'Active', label: 'Status' }
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '22px', fontWeight: '600' }}>{s.val}</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total income', val: fmt(an.totalIncome), color: 'var(--green)' },
            { label: 'Total expenses', val: fmt(an.totalExpenses), color: 'var(--red)' },
            { label: 'Est. tax owed', val: fmt(an.estimatedTax), color: 'var(--amber)' },
            { label: 'Docs uploaded', val: an.docCount || 0, color: 'var(--blue)', sub: an.pendingCount > 0 ? `${an.pendingCount} processing` : 'All processed' }
          ].map(m => (
            <div key={m.label} className="card">
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: m.color }}>{m.val}</div>
              {m.sub && <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '3px' }}>{m.sub}</div>}
            </div>
          ))}
        </div>

        {/* Recent docs */}
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '1rem' }}>Recent documents</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!docs.length && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '13px' }}>
              No documents yet — <a href="/upload" style={{ color: 'var(--green)' }}>upload your first document</a>
            </div>
          )}
          {docs.map(doc => {
            const icon = docIcons[doc.doc_type] || docIcons.other
            return (
              <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--r-sm)', background: icon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={icon.stroke} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{doc.original_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>{doc.ai_summary || doc.doc_type.replace('_', ' ')}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{fmtDate(doc.uploaded_at)}</div>
                  <div style={{ marginTop: '4px' }}>{statusBadge[doc.status] || statusBadge.uploaded}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
