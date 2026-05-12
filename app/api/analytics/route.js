import { createClient } from '../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId') || user.id

  const { data: docs } = await supabase
    .from('documents').select('*')
    .eq('client_id', clientId).eq('status', 'done')

  let totalIncome = 0, totalExpenses = 0
  const categoryTotals = {}
  const monthlyIncome = Array(12).fill(0)
  const monthlyExpenses = Array(12).fill(0)

  for (const doc of docs || []) {
    const amounts = doc.ai_amounts || {}
    const categories = doc.ai_categories || []
    const month = new Date(doc.uploaded_at).getMonth()

    if (amounts.income) { const v = parseFloat(amounts.income) || 0; totalIncome += v; monthlyIncome[month] += v }
    if (amounts.expenses) { const v = parseFloat(amounts.expenses) || 0; totalExpenses += v; monthlyExpenses[month] += v }

    for (const cat of categories) {
      if (cat.name && cat.amount) {
        const key = cat.name.toLowerCase()
        categoryTotals[key] = (categoryTotals[key] || 0) + (parseFloat(cat.amount) || 0)
      }
    }
  }

  const netProfit = totalIncome - totalExpenses
  const estimatedTax = Math.round(netProfit * 0.22)
  const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('client_id', clientId)
  const { count: pendingCount } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['uploaded', 'processing'])

  return NextResponse.json({
    summary: {
      totalIncome: Math.round(totalIncome), totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit), estimatedTax, docCount, pendingCount,
      profitMargin: totalIncome > 0 ? parseFloat((netProfit / totalIncome * 100).toFixed(1)) : 0
    },
    monthly: {
      income: monthlyIncome.map(v => Math.round(v)),
      expenses: monthlyExpenses.map(v => Math.round(v))
    },
    categories: Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 6),
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  })
}
