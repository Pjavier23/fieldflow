import { createAdminClient } from '../../../../lib/supabase/server'
import { getUserId } from '../../../../lib/auth-helper'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const admin = createAdminClient()

    // Check if creator is admin
    const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Create user via admin API
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${srKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password || 'Client2026!',
        email_confirm: true,
        user_metadata: {
          role: 'client',
          business_name: body.business_name || '',
          contact_name: body.contact_name || ''
        }
      })
    })

    const createData = await createRes.json()
    if (!createRes.ok) {
      return NextResponse.json({ error: createData.msg || 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json({ user: createData })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
