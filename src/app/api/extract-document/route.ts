import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { files, documentType } = await request.json() as {
      files: Array<{ base64: string; mediaType: string }>
      documentType?: string
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prompt = `You are a medical document reader for an Indian family health app.

You may receive PDF documents, prescriptions, or lab reports. Extract all clinically relevant information including doctor name, hospital or clinic name, date of visit, diagnosis or condition name, medications prescribed with dosage and frequency, and any clinical notes or instructions. If the document is a scanned image inside a PDF, do your best to read the handwritten or printed text.

Carefully analyse ${files.length > 1 ? 'these medical documents' : `this ${documentType || 'medical document'}`} and extract the following information. Return ONLY a valid JSON object with no additional text, no markdown, no backticks.

Extract these fields:
{
  "doctor_name": "Full name of the prescribing or treating doctor. Empty string if not found.",
  "hospital_name": "Hospital, clinic or medical centre name. Empty string if not found.",
  "visit_date": "Date of visit or report in ISO format YYYY-MM-DD. Empty string if not found.",
  "condition_name": "Primary diagnosis or condition name exactly as written. Empty string if not found.",
  "condition_notes": "Any additional notes, instructions or findings relevant to the condition. Empty string if not found.",
  "document_type": "One of: prescription, lab_report, scan, discharge_summary, vaccination, other",
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Dosage as written e.g. 500mg, 10ml",
      "frequency": "One of: once daily, twice daily, three times daily, four times daily, every alternate day, weekly, as needed, other",
      "duration": "Duration if mentioned e.g. 5 days, 2 weeks"
    }
  ],
  "confidence": "high, medium or low — your confidence in the extraction quality",
  "language_detected": "Language of the document e.g. English, Hindi, Hinglish"
}

Important rules:
- Return ONLY the JSON object. No other text whatsoever.
- For medications frequency, map to the closest matching value from the list above.
- If a field cannot be determined, use empty string not null.
- medications array can be empty if no medications found.
- For Indian documents: doctor names often have Dr. prefix, hospitals often end in Hospital/Clinic/Centre.
- Dates may be in DD/MM/YYYY format — convert to YYYY-MM-DD.
- If the document is in Hindi or regional language, still return field values in English.`

    // Build one content block per file
    type ContentBlock =
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } }
      | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
      | { type: 'text'; text: string }

    const contentBlocks: ContentBlock[] = files.map(({ base64, mediaType }) => {
      if (mediaType === 'application/pdf') {
        return {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
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

    contentBlocks.push({ type: 'text', text: prompt })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: contentBlocks,
        },
      ],
    })

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const extracted = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: extracted })
  } catch (error) {
    console.error('Document extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract document data' },
      { status: 500 }
    )
  }
}
