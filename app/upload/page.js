'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Nav from '../../components/Nav'

const DOC_TYPES = [
  { id: 'bank_statement', name: 'Bank statement', desc: 'Chase, BofA, Wells Fargo — AI reads every transaction', formats: 'PDF · CSV', bg: 'var(--blue-light)', stroke: 'var(--blue)', accept: '.pdf,.csv' },
  { id: 'invoice', name: 'Invoice', desc: 'Customer invoices or vendor bills — AI extracts amounts and vendors', formats: 'PDF · JPG · PNG', bg: 'var(--green-light)', stroke: 'var(--green-dark)', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'receipt', name: 'Receipt', desc: 'Gas, supplies, tools, meals — AI categorizes and checks deductibility', formats: 'PDF · JPG · PNG', bg: 'var(--amber-light)', stroke: 'var(--amber)', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'contract', name: 'Contract / Agreement', desc: 'Subcontractor agreements, client contracts — stored securely', formats: 'PDF · DOCX', bg: 'var(--red-light)', stroke: 'var(--red)', accept: '.pdf,.docx' },
  { id: 'w2_1099', name: 'W-2 / 1099', desc: 'Tax forms from employers or clients — AI reads box amounts', formats: 'PDF', bg: 'var(--blue-light)', stroke: 'var(--blue)', accept: '.pdf' },
  { id: 'other', name: 'Other document', desc: 'Mileage logs, insurance, business licenses, anything else', formats: 'PDF · JPG · PNG · DOCX', bg: 'var(--gray-100)', stroke: 'var(--gray-500)', accept: '*' }
]

export default function UploadPage() {
  const [profile, setProfile] = useState(null)
  const [queue, setQueue] = useState([])
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [])

  function addFiles(e, type) {
    e.stopPropagation()
    const files = Array.from(e.target.files)
    setQueue(prev => [...prev, ...files.map(f => ({ file: f, type, id: Math.random() }))])
    e.target.value = ''
  }

  function removeFile(id) { setQueue(prev => prev.filter(f => f.id !== id)) }

  function showToast(msg, err) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3500)
  }

  async function submitQueue() {
    if (!queue.length) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const formData = new FormData()
      queue.forEach(({ file, type }) => {
        formData.append('files', file)
        formData.append('types', type)
      })
      const r = await fetch('/api/docs/upload', { method: 'POST', body: formData })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setQueue([])
      showToast('Documents sent! DeepSeek AI is analyzing them now.')
    } catch (e) {
      showToast(e.message, true)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav user={profile} />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Upload your documents</div>
        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
          DeepSeek AI will read, categorize, and summarize everything for your tax preparer automatically.
        </p>

        {/* Upload grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {DOC_TYPES.map(type => (
            <label key={type.id} style={{
              background: 'var(--white)', border: '1.5px dashed var(--gray-200)',
              borderRadius: 'var(--r-lg)', padding: '1.5rem', textAlign: 'center',
              cursor: 'pointer', display: 'block', position: 'relative',
              transition: 'border-color 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-200)'}
            >
              <input type="file" accept={type.accept} multiple onChange={e => addFiles(e, type.id)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              <div style={{ width: '52px', height: '52px', borderRadius: 'var(--r-md)', background: type.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={type.stroke} strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                </svg>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{type.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', lineHeight: 1.5 }}>{type.desc}</div>
              <div style={{ fontSize: '10px', color: 'var(--gray-300)', marginTop: '8px', fontFamily: 'var(--mono)' }}>{type.formats}</div>
            </label>
          ))}
        </div>

        {/* Queue */}
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '1rem' }}>
            Upload queue ({queue.length} files)
          </div>
          {!queue.length && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-300)', fontSize: '13px' }}>
              No files selected — tap a category above
            </div>
          )}
          {queue.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < queue.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: 'var(--r-sm)', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.file.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{item.type.replace('_', ' ')} · {(item.file.size / 1024).toFixed(0)} KB</div>
              </div>
              <div onClick={() => removeFile(item.id)} style={{ fontSize: '20px', color: 'var(--gray-300)', cursor: 'pointer', padding: '4px' }}>×</div>
            </div>
          ))}

          {queue.length > 0 && (
            <button onClick={submitQueue} disabled={uploading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '13px' }}>
              {uploading ? <><div className="spinner" style={{ width: '16px', height: '16px' }} />Sending to AI...</> : <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Send to DeepSeek AI for analysis
              </>}
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          background: 'var(--gray-900)', color: 'white', padding: '12px 18px',
          borderRadius: 'var(--r-md)', fontSize: '13px', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '320px', zIndex: 999
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={toast.err ? 'var(--red)' : 'var(--green-mid)'} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
