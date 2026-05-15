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

export function useDocumentExtraction() {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  const extractFromFile = async (
    file: File,
    documentType?: string
  ): Promise<ExtractedDocumentData | null> => {
    setIsExtracting(true)
    setExtractionError(null)
    setExtractedData(null)

    try {
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!supportedTypes.includes(file.type)) {
        throw new Error(
          'For AI extraction, please upload an image file (JPG, PNG, or WebP). PDF extraction coming soon.'
        )
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType,
          documentType: documentType || 'medical document',
        }),
      })

      if (!response.ok) {
        throw new Error('Extraction request failed')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed')
      }

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
    extractFromFile,
    isExtracting,
    extractedData,
    extractionError,
    clearExtraction,
  }
}
