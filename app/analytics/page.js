'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Nav from '../../components/Nav'

const fmt = n => n != null ? '$' + Number(n).toLocaleString() : '—'
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CAT_COLORS = ['#1D9E75','#378ADD','#EF9F27','#D4537E','#7F77DD','#E24B4A']

export default function AnalyticsPage() {
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('year')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
      fetch('/api/analytics').then(r => r.json()).then(setData)
    })
  }, [])

  function getIncome() {
    if (!data) return 0
    if (period === 'year') return data.summary.totalIncome
    const map = { q1:[0,2], q2:[3,5], q3:[6,8], q4:[9,11] }
    const [s,e] = map[period]
    return data.monthly.income.slice(s, e+1).reduce((a,b)=>a+b,0)
  }

  function getExpenses() {
    if (!data) return 0
    if (period === 'year') return data.summary.totalExpenses
    const map = { q1:[0,2], q2:[3,5], q3:[6,8], q4:[9,11] }
    const [s,e] = map[period]
    return data.monthly.expenses.slice(s, e+1).reduce((a,b)=>a+b,0)
  }

  function getMonthlyIncome() {
    if (!data) return []
    if (period === 'year') return data.monthly.income
    const map = { q1:[0,2], q2:[3,5], q3:[6,8], q4:[9,11] }
    const [s,e] = map[period]
    return data.monthly.income.slice(s, e+1)
  }

  function getLabels() {
    if (period === 'year') return MONTHS
    const map = { q1:[0,2], q2:[3,5], q3:[6,8], q4:[9,11] }
    const [s,e] = map[period]
    return MONTHS.slice(s, e+1)
  }

  const income = getIncome()
  const expenses = getExpenses()
  const profit = income - expenses
  const margin = income > 0 ? (profit/income*100).toFixed(1) : '0.0'
  const tax = Math.round(profit * 0.22)
  const monthlyIncome = getMonthlyIncome()
  const maxBar = Math.max(...monthlyIncome, 1)
  const maxCat = data?.categories?.length ? Math.max(...data.categories.map(c=>c.amount), 1) : 1

  const periods = [
    { id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' },
    { id: 'q3', label: 'Q3' }, { id: 'q4', label: 'Q4' },
    { id: 'year', label: 'Full year' }
  ]

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav user={profile} />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--white)', border: '1px solid var(--gray-100)', borderRadius: 'var(--r-sm)', padding: '4px', width: 'fit-content', marginBottom: '1.25rem' }}>
          {periods.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
              background: period === p.id ? 'var(--green)' : 'none',
              color: period === p.id ? 'white' : 'var(--gray-500)'
            }}>{p.label}</button>
          ))}
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total income', val: fmt(income), color: 'var(--green)' },
            { label: 'Total expenses', val: fmt(expenses), color: 'var(--red)' },
            { label: 'Net profit', val: fmt(profit), color: 'var(--blue)' },
            { label: 'Profit margin', val: margin + '%', color: 'var(--green)' }
          ].map(m => (
            <div key={m.label} className="card">
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: m.color }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Tax estimate */}
        <div style={{ background: 'var(--amber-light)', border: '1px solid #FAC775', borderRadius: 'var(--r-lg)', padding: '1.25rem', display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ fontSize: '28px' }}>⚠️</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#633806', marginBottom: '4px' }}>Estimated tax owed</div>
            <div style={{ fontSize: '22px', fontWeight: '600', color: '#854F0B', marginBottom: '4px' }}>{fmt(tax)}</div>
            <div style={{ fontSize: '11px', color: '#854F0B', opacity: 0.8 }}>Based on self-employment income at ~22% effective rate. Your preparer will confirm the final amount.</div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '1.25rem' }}>Monthly income</div>
          {!data ? <div className="loading-center"><div className="spinner" /></div> : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
              {monthlyIncome.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', borderRadius: '4px 4px 0 0', minHeight: '4px', height: `${Math.max(4, (v/maxBar)*100)}%`, background: 'var(--green)' }} />
                  <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>{getLabels()[i]}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '1.25rem' }}>Expense breakdown</div>
          {!data?.categories?.length ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '13px', textAlign: 'center', padding: '1rem' }}>
              Upload documents to see expense breakdown
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.categories.map((cat, i) => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
                  <div style={{ fontSize: '13px', flex: 1 }}>{cat.name}</div>
                  <div style={{ flex: 1, height: '5px', background: 'var(--gray-100)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', width: `${(cat.amount/maxCat)*100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--gray-700)', minWidth: '60px', textAlign: 'right', fontFamily: 'var(--mono)' }}>${Number(cat.amount).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
