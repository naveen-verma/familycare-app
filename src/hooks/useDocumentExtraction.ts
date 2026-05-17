'use client'

import { useState } from 'react'

export interface ExtractedDocumentData {
  doctor_name: string
  hospital_name: string
  visit_date: string
  condition_name: string
  condition_notes: string
  document_type: string
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
  }>
  confidence: 'high' | 'medium' | 'low'
  language_detected: string
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
          base64: await fileToBase64(file),
          mediaType: file.type,
        }))
      )

      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: fileData,
          documentType: documentType || 'medical document',
        }),
      })

      if (!response.ok) throw new Error('Extraction request failed')

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Extraction failed')

      setExtractedData(result.data)
      return result.data
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to extract data from document'
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

  return {
    extractFromFiles,
    isExtracting,
    extractedData,
    extractionError,
    clearExtraction,
  }
}
