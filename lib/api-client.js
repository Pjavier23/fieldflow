'use client'

// Client-side fetch wrapper that passes the Supabase auth token
// so server API routes can authenticate via Authorization header

export async function apiFetch(url, options = {}) {
  const { createClient } = await import('../lib/supabase/client')
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers = {
    ...(options.headers || {}),
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(url, { ...options, headers })
}
