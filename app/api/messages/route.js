import { createAdminClient } from '../../../../lib/supabase/server'
import { getUserId } from '../../../../lib/auth-helper'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: threads } = await admin.rpc('get_message_threads', { p_user_id: userId })
    return NextResponse.json(threads || [])
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { to_id, body } = await req.json()
    if (!to_id || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: msg, error } = await admin.from('messages').insert({
      from_id: userId,
      to_id,
      body
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(msg)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
