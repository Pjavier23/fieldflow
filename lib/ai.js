import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

const PROMPTS = {
  bank_statement: `You are a tax preparation AI for a US small business. Analyze this bank statement and return JSON with:
{ "total_income": number, "total_expenses": number, "net": number, "categories": {"materials": number, "fuel": number, "payroll": number, "utilities": number, "insurance": number, "meals": number, "equipment": number, "other": number}, "transactions": [{"date": "string", "description": "string", "amount": number, "type": "income|expense", "category": "string"}], "summary": "one sentence summary" }`,

  invoice: `You are a tax preparation AI. Analyze this invoice and return JSON with:
{ "vendor_or_client": "string", "date": "string", "total_amount": number, "type": "income|expense", "category": "string", "line_items": [{"description": "string", "amount": number}], "summary": "one sentence summary" }`,

  receipt: `You are a tax preparation AI. Analyze this receipt and return JSON with:
{ "vendor": "string", "date": "string", "total_amount": number, "category": "string", "items": [{"name": "string", "amount": number}], "tax_deductible": true|false, "deduction_reason": "string", "summary": "one sentence summary" }`,

  w2_1099: `You are a tax preparation AI. Analyze this tax form and return JSON with:
{ "form_type": "string", "payer": "string", "tax_year": "string", "wages_or_compensation": number, "federal_tax_withheld": number, "state_tax_withheld": number, "other_amounts": {}, "summary": "one sentence summary" }`,

  contract: `You are a tax preparation AI. Analyze this contract and return JSON with:
{ "parties": ["string"], "contract_type": "string", "payment_amount": number, "payment_terms": "string", "duration": "string", "worker_classification": "employee|contractor|unknown", "requires_1099": true|false, "summary": "one sentence summary" }`,

  other: `You are a tax preparation AI. Analyze this document and return JSON with:
{ "document_type": "string", "key_dates": ["string"], "amounts": [number], "tax_relevance": "string", "action_items": ["string"], "summary": "one sentence summary" }`
}

export async function analyzeDocument(text, docType, fileName) {
  try {
    const prompt = PROMPTS[docType] || PROMPTS.other
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `File: ${fileName}\n\nContent:\n${text.slice(0, 8000)}\n\nReturn valid JSON only.` }
      ]
    })

    const raw = response.choices[0].message.content
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      summary: parsed.summary || `${docType.replace('_', ' ')} processed`,
      categories: buildCategories(parsed, docType),
      amounts: buildAmounts(parsed, docType),
      raw: parsed
    }
  } catch (err) {
    console.error('AI error:', err.message)
    return {
      summary: `${fileName} received — manual review needed`,
      categories: [],
      amounts: {}
    }
  }
}

function buildCategories(data, type) {
  if (type === 'bank_statement' && data.categories) {
    return Object.entries(data.categories)
      .filter(([, v]) => v > 0)
      .map(([name, amount]) => ({ name, amount }))
  }
  if (data.category) return [{ name: data.category, amount: data.total_amount || 0 }]
  return []
}

function buildAmounts(data, type) {
  return {
    income: data.total_income || (data.type === 'income' ? data.total_amount : null) || data.wages_or_compensation || null,
    expenses: data.total_expenses || (data.type === 'expense' ? data.total_amount : null) || null,
    net: data.net || null
  }
}
