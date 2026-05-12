'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Nav from '../../components/Nav'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

export default function MessagesPage() {
  const [profile, setProfile] = useState(null)
  const [userId, setUserId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
      loadMessages()
    })
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadMessages() {
    const r = await fetch('/api/messages')
    const data = await r.json()
    setMessages(Array.isArray(data) ? data : [])
  }

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: input }) })
      setInput('')
      loadMessages()
    } finally { setSending(false) }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav user={profile} />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '1rem' }}>Messages with your preparer</div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px', paddingBottom: '1rem' }}>
            {!messages.length && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)', fontSize: '13px' }}>
                No messages yet. Send one below!
              </div>
            )}
            {messages.map(m => {
              const isMe = m.from_id === userId
              return (
                <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '4px', textAlign: isMe ? 'right' : 'left' }}>
                    {isMe ? 'You' : (m.from_name || 'Your preparer')}
                  </div>
                  <div style={{
                    padding: '12px 14px', borderRadius: isMe ? 'var(--r-md) 4px var(--r-md) var(--r-md)' : '4px var(--r-md) var(--r-md) var(--r-md)',
                    background: isMe ? 'var(--white)' : 'var(--green)', color: isMe ? 'var(--gray-900)' : 'white',
                    border: isMe ? '1px solid var(--gray-100)' : 'none', fontSize: '13px', lineHeight: 1.6
                  }}>{m.body}</div>
                  <div style={{ fontSize: '10px', color: 'var(--gray-500)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>{fmtDate(m.created_at)}</div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '8px', padding: '1rem' }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message to your preparer..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'var(--font)', color: 'var(--gray-900)', background: 'none' }}
          />
          <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ width: '36px', height: '36px', background: 'var(--green)', border: 'none', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
