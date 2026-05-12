import { createClient, createAdminClient } from '../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()

  let otherUserId
  if (profile?.role === 'admin') {
    return NextResponse.json([]) // Admin uses /api/messages/threads
  } else {
    const { data: adminUser } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1).single()
    otherUserId = adminUser?.id
  }

  if (!otherUserId) return NextResponse.json([])

  const { data: msgs } = await admin.from('messages')
    .select('*, profiles!messages_from_id_fkey(business_name, role)')
    .or(`and(from_id.eq.${user.id},to_id.eq.${otherUserId}),and(from_id.eq.${otherUserId},to_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  // Mark as read
  await admin.from('messages').update({ read: true }).eq('to_id', user.id).eq('read', false)

  return NextResponse.json(msgs?.map(m => ({
    ...m,
    from_name: m.profiles?.business_name || 'Your preparer'
  })) || [])
}

export async function POST(req) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body, toId } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

  const admin = createAdminClient()
  let recipientId = toId

  if (!recipientId) {
    const { data: adminUser } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1).single()
    recipientId = adminUser?.id
  }

  if (!recipientId) return NextResponse.json({ error: 'No recipient found' }, { status: 400 })

  const { data } = await admin.from('messages').insert({
    from_id: user.id, to_id: recipientId, body: body.trim()
  }).select().single()

  return NextResponse.json(data)
}
