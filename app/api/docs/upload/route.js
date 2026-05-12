import { createClient, createAdminClient } from '../../../../../lib/supabase/server'
import { analyzeDocument } from '../../../../../lib/ai'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const files = formData.getAll('files')
    const types = formData.getAll('types')

    const admin = createAdminClient()
    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const docType = types[i] || 'other'
      const buffer = Buffer.from(await file.arrayBuffer())
      const storagePath = `${user.id}/${Date.now()}-${file.name}`

      // Upload to Supabase Storage
      const { error: uploadError } = await admin.storage.from('documents').upload(storagePath, buffer, { contentType: file.type })
      if (uploadError) continue

      // Insert doc record
      const { data: doc } = await admin.from('documents').insert({
        client_id: user.id, original_name: file.name,
        storage_path: storagePath, doc_type: docType,
        file_size: file.size, mime_type: file.type, status: 'uploaded'
      }).select().single()

      results.push(doc)

      // Process in background (don't await)
      processDoc(doc.id, buffer, docType, file.name, file.type).catch(console.error)
    }

    return NextResponse.json({ success: true, documents: results })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function processDoc(docId, buffer, docType, fileName, mimeType) {
  const admin = createAdminClient()
  await admin.from('documents').update({ status: 'processing' }).eq('id', docId)

  let text = ''
  if (mimeType === 'application/pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      text = data.text
    } catch { text = `PDF: ${fileName}` }
  } else if (mimeType === 'text/csv') {
    text = buffer.toString('utf8')
  } else {
    text = `File: ${fileName}`
  }

  const result = await analyzeDocument(text, docType, fileName)

  await admin.from('documents').update({
    status: 'done',
    ai_summary: result.summary,
    ai_categories: result.categories,
    ai_amounts: result.amounts,
    processed_at: new Date().toISOString()
  }).eq('id', docId)
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  let query = supabase.from('documents').select('*').order('uploaded_at', { ascending: false })
  if (profile?.role !== 'admin') query = query.eq('client_id', user.id)

  const { data } = await query
  return NextResponse.json(data || [])
}
