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

const VALID_DOC_TYPES = ['prescription', 'report', 'scan', 'vaccination', 'other']

function normaliseDocType(raw: string | null | undefined): string | null {
  if (!raw) return null
  const lower = raw.toLowerCase()
  if (lower.includes('prescription')) return 'prescription'
  if (lower.includes('lab') || lower.includes('report')) return 'report'
  if (lower.includes('scan') || lower.includes('xray') || lower.includes('mri') || lower.includes('ct')) return 'scan'
  if (lower.includes('vaccination') || lower.includes('vaccine')) return 'vaccination'
  if (VALID_DOC_TYPES.includes(lower)) return lower
  return 'other'
}

const EXTRACTION_PROMPT = `You are a medical data extraction assistant for an Indian family health app. Extract structured information from the prescription, report or medical document provided.

Return ONLY a valid JSON object — no preamble, no explanation, no markdown fences.

{
  "doctor_name": "doctor name from letterhead or signature, null if not found",
  "hospital_name": "hospital or clinic name, null if not found",
  "visit_date": "date of visit in YYYY-MM-DD format, null if not found",
  "document_type": "one of: prescription | lab_report | scan | discharge_summary | vaccination | other",
  "notes": "any general clinical notes or instructions not tied to a specific medication, null if none",
  "medications": [
    {
      "name": "medication name as written",
      "dose": "dose with unit e.g. 500mg, 1 tablet, 2 drops, null if not found",
      "frequency": "one of: once daily | twice daily | three times daily | four times daily | every alternate day | weekly | as needed | null if not found",
      "notes": "medication-specific instructions e.g. after food, before sleep, null if none",
      "start_date": "YYYY-MM-DD if written, else null",
      "end_date": "YYYY-MM-DD if written, else null"
    }
  ]
}

Indian doctor shorthand — map these to frequency values:
  OD       → once daily
  BD, BID  → twice daily
  TDS, TID → three times daily
  QID      → four times daily
  SOS, PRN → as needed
  EOD      → every alternate day

Rules:
- Never guess or infer values not written in the document
- If a field is not found return null for that field
- If no medications found return medications: []
- doctor_name: the treating doctor, not the patient
- hospital_name: the institution, not a person's name
- document_type: use your best judgment from the content`

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json() as {
      files: Array<{ base64: string; mediaType: string; fileName: string; fileSize: number }>
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Missing required fields', documents: [], medications: [] })
    }

    type ContentBlock =
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } }
      | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
      | { type: 'text'; text: string }

    const contentBlocks: ContentBlock[] = files.map(({ base64, mediaType }) => {
      if (mediaType === 'application/pdf') {
        return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      }
      return {
        type: 'image',
        source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
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
      return NextResponse.json({ error: 'extraction_failed', documents: [], medications: [] })
    }

    let extracted: Record<string, unknown>
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
      extracted = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'extraction_failed', documents: [], medications: [] })
    }

    const doctorName    = (extracted.doctor_name   as string | null) ?? null
    const hospitalName  = (extracted.hospital_name as string | null) ?? null
    const visitDate     = (extracted.visit_date     as string | null) ?? null
    const documentType  = normaliseDocType(extracted.document_type as string | null)
    const extractedNotes = (extracted.notes         as string | null) ?? null

    // Build one document metadata object per uploaded file
    const documents = files.map(({ fileName, fileSize }) => ({
      file_name:     fileName,
      file_size:     fileSize,
      title:         fileName.replace(/\.[^.]+$/, ''),
      document_date: visitDate,
      doctor_name:   doctorName,
      hospital_name: hospitalName,
      document_type: documentType,
      notes:         extractedNotes,
    }))

    // Enrich medications
    const medications = ((extracted.medications ?? []) as unknown[]).map((m) => {
      const med = m as Record<string, unknown>
      const freq = (med.frequency as string) ?? null
      return {
        name:             med.name        ?? '',
        dose:             med.dose        ?? null,
        frequency:        freq,
        time_of_day:      TIME_DEFAULTS[freq ?? ''] ?? ['08:00'],
        notes:            med.notes       ?? null,
        start_date:       med.start_date  ?? null,
        end_date:         med.end_date    ?? null,
        reminder_enabled: false as const,
      }
    })

    return NextResponse.json({
      doctor_name:   doctorName,
      hospital_name: hospitalName,
      visit_date:    visitDate,
      document_type: documentType,
      notes:         extractedNotes,
      documents,
      medications,
    })
  } catch (error) {
    console.error('Document extraction error:', error)
    return NextResponse.json({ error: 'extraction_failed', documents: [], medications: [] })
  }
}
