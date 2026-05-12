import { createAdminClient } from '../../../lib/supabase/server'
import { getUserId } from '../../../lib/auth-helper'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    
    const { data: totalDocs } = await admin.from('documents').select('id', { count: 'exact', head: true })
    const { data: recentDocs } = await admin.from('documents')
      .select('id, original_name, doc_type, status, uploaded_at')
      .order('uploaded_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      total_documents: totalDocs?.length || 0,
      recent_documents: recentDocs || []
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
