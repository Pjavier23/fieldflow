import { createAdminClient } from '../../../../lib/supabase/server'
import { getUserId } from '../../../../lib/auth-helper'
import { analyzeDocument } from '../../../../lib/ai'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const files = formData.getAll('files')
    const types = formData.getAll('types')

    const admin = createAdminClient()
    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const docType = types[i] || 'other'
      const buffer = Buffer.from(await file.arrayBuffer())
      const storagePath = `${userId}/${Date.now()}-${file.name}`

      // Upload to Supabase Storage
      const { error: uploadError } = await admin.storage.from('documents').upload(storagePath, buffer, { contentType: file.type })
      if (uploadError) continue

      // Insert doc record
      const { data: doc, error: docError } = await admin.from('documents').insert({
        client_id: userId,
        original_name: file.name,
        storage_path: storagePath,
        doc_type: docType,
        file_size: buffer.length,
        mime_type: file.type,
        status: 'uploaded'
      }).select().single()

      if (docError) continue

      // AI analysis
      try {
        const analysis = await analyzeDocument(buffer, file.name, docType)
        await admin.from('documents').update({
          ai_summary: analysis.summary,
          ai_categories: analysis.categories || [],
          ai_amounts: analysis.amounts || {},
          status: 'analyzed',
          processed_at: new Date().toISOString()
        }).eq('id', doc.id)
      } catch {
        // AI analysis failed, document stays as 'uploaded'
      }

      results.push(doc)
    }

    return NextResponse.json({ docs: results })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
