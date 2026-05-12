import { createAdminClient } from './supabase/server'

export async function getUserId(req) {
  // Read access token from Authorization header (set by client-side apiFetch)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const admin = createAdminClient()
  const { data: { user } } = await admin.auth.getUser(token)
  return user?.id || null
}
