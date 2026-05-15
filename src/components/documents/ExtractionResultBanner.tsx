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
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const CONFIDENCE_BADGE: Record<string, { label: string; className: string }> = {
  high:   { label: 'High confidence',                  className: 'bg-green-100 text-green-700 border-green-200' },
  medium: { label: 'Review carefully',                 className: 'bg-amber-100 text-amber-700 border-amber-200' },
  low:    { label: 'Low confidence — verify all fields', className: 'bg-red-100 text-red-700 border-red-200' },
}

export function ExtractionResultBanner({ data, onReviewCondition, onDismiss }: Props) {
  const badge = CONFIDENCE_BADGE[data.confidence] ?? CONFIDENCE_BADGE.medium

  const fields: Array<{ label: string; value: string }> = [
    { label: 'Doctor',      value: data.doctor_name },
    { label: 'Hospital',    value: data.hospital_name },
    { label: 'Date',        value: data.visit_date ? formatVisitDate(data.visit_date) : '' },
    { label: 'Condition',   value: data.condition_name },
    {
      label: 'Medications',
      value: data.medications.length > 0 ? `${data.medications.length} found` : '',
    },
  ].filter((f) => f.value)

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start gap-2">
        <Sparkles className="size-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-teal-900">AI extracted health data</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${badge.className}`}
        >
          {badge.label}
        </span>
        <button
          onClick={onDismiss}
          className="shrink-0 ml-1 rounded-full p-0.5 hover:bg-teal-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-3.5 text-teal-600" />
        </button>
      </div>

      {/* Extracted fields */}
      {fields.length > 0 && (
        <div className="space-y-1">
          {fields.map((f) => (
            <div key={f.label} className="flex gap-2 text-xs">
              <span className="text-teal-600 font-medium w-20 shrink-0">{f.label}:</span>
              <span className="text-teal-900 truncate">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA button */}
      <Button
        type="button"
        onClick={onReviewCondition}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm"
        size="sm"
      >
        Review and add condition →
      </Button>

      <p className="text-center text-muted-foreground italic" style={{ fontSize: 11 }}>
        Review all fields before saving. AI extraction may contain errors.
      </p>
    </div>
  )
}
