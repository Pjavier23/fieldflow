import { createClient } from './supabase/server'

export async function getUserId(req) {
  // Try cookie-based auth first
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id) return user.id

  // Fallback: read Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const { data: { user: tokenUser } } = await supabase.auth.getUser(token)
  return tokenUser?.id || null
}
