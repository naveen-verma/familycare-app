import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TIME_DEFAULTS: Record<string, string[]> = {
  'once daily':          ['08:00'],
  'twice daily':         ['08:00', '20:00'],
  'three times daily':   ['08:00', '14:00', '20:00'],
  'four times daily':    ['08:00', '12:00', '16:00', '20:00'],
  'every alternate day': ['08:00'],
  'weekly':              ['08:00'],
  'as needed':           [],
}

const EXTRACTION_PROMPT = `You are a medical data extraction assistant for an Indian family health app.

Extract all medications from the prescription or medical document provided.
Indian doctors commonly use shorthand — map these correctly:
  OD → once daily
  BD or BID → twice daily
  TDS or TID → three times daily
  QID → four times daily
  SOS or PRN → as needed
  EOD → every alternate day
  Weekly → weekly

For each medication found, extract the following fields.
Return ONLY a valid JSON object — no preamble, no explanation, no markdown code fences.

{
  "prescribed_by": "doctor name from letterhead or signature",
  "visit_date": "date in YYYY-MM-DD format if found, else null",
  "medications": [
    {
      "name": "medication name as written",
      "dose": "dose as written e.g. 500mg, 1 tablet, 2 drops",
      "frequency": "one of: once daily | twice daily | three times daily | four times daily | every alternate day | weekly | as needed",
      "notes": "any instructions e.g. after food, before sleep, with water",
      "start_date": "YYYY-MM-DD if explicitly written, else null",
      "end_date": "YYYY-MM-DD if explicitly written, else null"
    }
  ]
}

Rules:
- If a field is not found or not clear, return null for that field
- Never guess or infer values that are not written in the document
- If no medications are found, return { "medications": [] }
- prescribed_by: use the doctor name, not the patient name
- dose: include the unit (mg, ml, tablet, capsule, drops)
- Return every medication found — do not skip any`

export async function POST(request: NextRequest) {
  try {
    const { files, documentType } = await request.json() as {
      files: Array<{ base64: string; mediaType: string }>
      documentType?: string
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Missing required fields', medications: [] })
    }

    type ContentBlock =
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } }
      | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
      | { type: 'text'; text: string }

    const contentBlocks: ContentBlock[] = files.map(({ base64, mediaType }) => {
      if (mediaType === 'application/pdf') {
        return {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        }
      }
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: base64,
        },
      }
    })
    contentBlocks.push({ type: 'text', text: EXTRACTION_PROMPT })

    let rawText = ''
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: contentBlocks }],
      })
      rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    } catch {
      return NextResponse.json({ error: 'extraction_failed', medications: [] })
    }

    let extracted: { prescribed_by?: string | null; visit_date?: string | null; medications?: unknown[] }
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      extracted = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'extraction_failed', medications: [] })
    }

    // Normalise and enrich each medication with time_of_day defaults
    const medications = (extracted.medications ?? []).map((m: unknown) => {
      const med = m as Record<string, unknown>
      const freq = (med.frequency as string) ?? null
      return {
        name:            med.name         ?? '',
        dose:            med.dose         ?? null,
        frequency:       freq,
        time_of_day:     TIME_DEFAULTS[freq ?? ''] ?? ['08:00'],
        notes:           med.notes        ?? null,
        start_date:      med.start_date   ?? null,
        end_date:        med.end_date     ?? null,
        reminder_enabled: false as const,
      }
    })

    return NextResponse.json({
      prescribed_by: extracted.prescribed_by ?? null,
      visit_date:    extracted.visit_date    ?? null,
      medications,
    })
  } catch (error) {
    console.error('Document extraction error:', error)
    return NextResponse.json({ error: 'extraction_failed', medications: [] })
  }
}
