import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST() {
  try {
    // Create fresh demo user (trigger auto-creates profile)
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${SR_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `demo${Date.now()}@fieldflow-demo.com`,
        password: 'DemoFlow2026!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo Client',
          role: 'client'
        }
      })
    })

    const createData = await createRes.json()
    if (!createRes.ok) {
      return NextResponse.json({ error: createData.msg || 'Failed to create demo' }, { status: 500 })
    }

    // Update profile with business info (trigger already created it)
    const userId = createData.id
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${SR_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        business_name: 'Demo Construction LLC',
        contact_name: 'Jane Demo',
        phone: '(555) 123-4567'
      })
    })

    // Sign in with fresh credentials
    const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: createData.email,
        password: 'DemoFlow2026!'
      })
    })

    const signInData = await signInRes.json()
    if (!signInRes.ok) {
      return NextResponse.json({ error: 'Sign-in failed' }, { status: 500 })
    }

    return NextResponse.json({
      session: {
        access_token: signInData.access_token,
        refresh_token: signInData.refresh_token,
        user: { id: userId, email: createData.email }
      }
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
