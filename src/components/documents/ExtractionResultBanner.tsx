'use client'

import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExtractedDocumentData } from '@/hooks/useDocumentExtraction'

interface Props {
  data: ExtractedDocumentData
  onReviewCondition: () => void
  onDismiss: () => void
}

function formatVisitDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ExtractionResultBanner({ data, onReviewCondition, onDismiss }: Props) {
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Prescribed by', value: data.prescribed_by ?? '' },
    { label: 'Date',          value: data.visit_date ? formatVisitDate(data.visit_date) : '' },
    { label: 'Medications',   value: data.medications.length > 0 ? `${data.medications.length} found` : '' },
  ].filter((f) => f.value)

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="size-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-semibold text-teal-900">AI extracted health data</p>
        <button onClick={onDismiss} className="shrink-0 ml-1 rounded-full p-0.5 hover:bg-teal-100 transition-colors" aria-label="Dismiss">
          <X className="size-3.5 text-teal-600" />
        </button>
      </div>

      {fields.length > 0 && (
        <div className="space-y-1">
          {fields.map((f) => (
            <div key={f.label} className="flex gap-2 text-xs">
              <span className="text-teal-600 font-medium w-24 shrink-0">{f.label}:</span>
              <span className="text-teal-900 truncate">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      <Button type="button" onClick={onReviewCondition} className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm" size="sm">
        Review and add condition →
      </Button>

      <p className="text-center text-muted-foreground italic" style={{ fontSize: 11 }}>
        Review all fields before saving. AI extraction may contain errors.
      </p>
    </div>
  )
}
