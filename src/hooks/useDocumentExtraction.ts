'use client'

import { useState } from 'react'

export interface ExtractionDocument {
  file_name: string
  file_size: number
  title: string
  document_date: string | null
  doctor_name: string | null
  hospital_name: string | null
  document_type: string | null
  notes: string | null
}

export interface ExtractedMedication {
  name: string
  dose: string | null
  frequency: string | null
  time_of_day: string[]
  notes: string | null
  start_date: string | null
  end_date: string | null
  reminder_enabled: false
}

export interface ExtractedDocumentData {
  doctor_name: string | null
  hospital_name: string | null
  visit_date: string | null
  document_type: string | null
  notes: string | null
  documents: ExtractionDocument[]
  medications: ExtractedMedication[]
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useDocumentExtraction() {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  const extractFromFiles = async (
    files: File[],
    documentType?: string
  ): Promise<ExtractedDocumentData | null> => {
    setIsExtracting(true)
    setExtractionError(null)
    setExtractedData(null)

    try {
      const fileData = await Promise.all(
        files.map(async (file) => ({
          base64:    await fileToBase64(file),
          mediaType: file.type,
          fileName:  file.name,
          fileSize:  file.size,
        }))
      )

      const response = await fetch('/api/extract-document', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ files: fileData, documentType: documentType || 'medical document' }),
      })

      if (!response.ok) throw new Error('Extraction request failed')

      const result: ExtractedDocumentData & { error?: string } = await response.json()

      if (result.error) {
        setExtractionError(result.error)
        return null
      }

      setExtractedData(result)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to extract data from document'
      setExtractionError(message)
      return null
    } finally {
      setIsExtracting(false)
    }
  }

  const clearExtraction = () => {
    setExtractedData(null)
    setExtractionError(null)
  }

  return { extractFromFiles, isExtracting, extractedData, extractionError, clearExtraction }
}
