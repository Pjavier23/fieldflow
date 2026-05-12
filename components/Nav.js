'use client'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '../lib/supabase/client'

export default function Nav({ user }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = (user?.business_name || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const tabs = [
    { href: '/dashboard', label: 'Home', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { href: '/upload', label: 'Upload Docs', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
    { href: '/analytics', label: 'Analytics', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { href: '/messages', label: 'Messages', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> }] : [])
  ]

  return (
    <>
      {/* Top nav */}
      <nav style={{
        background: 'var(--white)', borderBottom: '1px solid var(--gray-100)',
        padding: '0 1.5rem', height: '60px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--green)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>FieldFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--gray-700)' }}>
            {user?.business_name || user?.email}
          </span>
          <div style={{
            width: '34px', height: '34px', background: 'var(--green-light)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '600', color: 'var(--green-dark)'
          }}>{initials}</div>
          <button onClick={logout} style={{
            fontSize: '12px', color: 'var(--gray-500)', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 'var(--r-sm)', border: 'none',
            background: 'none'
          }}>Sign out</button>
        </div>
      </nav>

      {/* Tab nav */}
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--gray-100)',
        display: 'flex', padding: '0 1.5rem', overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <a key={tab.href} href={tab.href} style={{
            padding: '14px 18px', fontSize: '13px', fontWeight: '500',
            color: pathname === tab.href ? 'var(--green)' : 'var(--gray-500)',
            borderBottom: pathname === tab.href ? '2px solid var(--green)' : '2px solid transparent',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
            textDecoration: 'none', transition: 'color 0.15s'
          }}>
            {tab.icon}{tab.label}
          </a>
        ))}
      </div>
    </>
  )
}
