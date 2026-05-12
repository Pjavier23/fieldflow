import { createClient, createAdminClient } from '../../../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { email, password, businessName, contactName, phone } = await req.json()
  if (!email || !password || !businessName) {
    return NextResponse.json({ error: 'Email, password and business name required' }, { status: 400 })
  }

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { role: 'client' }
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await admin.from('profiles').update({
    business_name: businessName, contact_name: contactName || '',
    phone: phone || '', role: 'client'
  }).eq('id', newUser.user.id)

  return NextResponse.json({ success: true, clientId: newUser.user.id })
}
