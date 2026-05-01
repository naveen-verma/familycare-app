'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  FileText,
  FileImage,
  Calendar,
  Stethoscope,
  Building2,
  ChevronDown,
  X,
  FolderOpen,
  RulerIcon,
  ScaleIcon,
} from 'lucide-react'
import type { ViewReportDocument, ViewReportCondition, ViewReportMember } from '@/lib/vault-types'
import { REPORT_DOC_TYPE_ORDER, DOC_TYPE_LABELS } from '@/lib/vault-types'
import type { DocumentType } from '@/types/database'

// ---- BMI helpers ----

function bmiClass(bmi: number): { label: string; badgeClass: string } {
  if (bmi < 18.5) return { label: 'Underweight', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' }
  if (bmi < 23.0) return { label: 'Normal', badgeClass: 'bg-green-100 text-green-700 border-green-200' }
  if (bmi < 25.0) return { label: 'Overweight', badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  if (bmi < 30.0) return { label: 'Obese Class I', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' }
  return { label: 'Obese Class II', badgeClass: 'bg-red-100 text-red-700 border-red-200' }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ---- Health Metrics Panel ----

function HealthMetricsPanel({ member }: { member: ViewReportMember }) {
  const hasMetrics =
    member.height_cm != null && member.weight_kg != null && member.bmi != null

  if (!hasMetrics) {
    return (
      <div className="rounded-lg border bg-muted/30 px-4 py-3 mb-6">
        <p className="text-xs text-muted-foreground">Health metrics not recorded</p>
      </div>
    )
  }

  const cls = bmiClass(Number(member.bmi))

  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 mb-6">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <RulerIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Height</span>
          <span className="text-sm font-medium">{member.height_cm} cm</span>
        </div>
        <div className="flex items-center gap-2">
          <ScaleIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Weight</span>
          <span className="text-sm font-medium">{member.weight_kg} kg</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">BMI</span>
          <span className="text-sm font-semibold">{Number(member.bmi).toFixed(1)}</span>
          <span
            className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${cls.badgeClass}`}
          >
            {cls.label}
          </span>
          {member.bmi_date && (
            <span className="text-xs text-muted-foreground">
              Measured {formatDate(member.bmi_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Inline Document Preview ----

function DocumentPreview({ doc }: { doc: ViewReportDocument }) {
  const isImage =
    doc.file_type === 'jpg' || doc.file_type === 'jpeg' || doc.file_type === 'png'

  if (!doc.signed_url) {
    return (
      <div className="rounded-lg border bg-muted/40 px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">Preview not available</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden bg-muted/20">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={doc.signed_url}
          alt={doc.title}
          className="w-full rounded-lg"
        />
      ) : (
        <embed
          src={doc.signed_url}
          type="application/pdf"
          width="100%"
          height="500px"
          className="block"
        />
      )}
    </div>
  )
}

// ---- Document Card ----

function DocumentCard({
  doc,
  previewOpen,
  onTogglePreview,
}: {
  doc: ViewReportDocument
  previewOpen: boolean
  onTogglePreview: () => void
}) {
  const isImage =
    doc.file_type === 'jpg' || doc.file_type === 'jpeg' || doc.file_type === 'png'

  return (
    <div>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
              {isImage ? (
                <FileImage className="size-4 text-muted-foreground" />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{doc.title}</p>

              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {doc.document_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {formatDate(doc.document_date)}
                  </span>
                )}
                {doc.doctor_name && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Stethoscope className="size-3" />
                    {doc.doctor_name}
                  </span>
                )}
                {doc.hospital_name && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="size-3" />
                    {doc.hospital_name}
                  </span>
                )}
              </div>

              {doc.notes && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{doc.notes}</p>
              )}

              <div className="mt-3">
                <Button
                  size="sm"
                  variant={previewOpen ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={onTogglePreview}
                >
                  {previewOpen ? (
                    <>
                      <X className="size-3 mr-1" /> Close Preview
                    </>
                  ) : (
                    'Preview'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inline preview panel */}
      {previewOpen && (
        <div className="mt-2">
          <DocumentPreview doc={doc} />
        </div>
      )}
    </div>
  )
}

// ---- Document Type Section (accordion) ----

function DocTypeSection({
  type,
  docs,
  isOpen,
  onToggle,
}: {
  type: DocumentType
  docs: ViewReportDocument[]
  isOpen: boolean
  onToggle: () => void
}) {
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)

  function togglePreview(docId: string) {
    setPreviewDocId((prev) => (prev === docId ? null : docId))
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{DOC_TYPE_LABELS[type]}</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 text-primary px-1.5 text-xs font-medium">
            {docs.length}
          </span>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t px-4 py-3 space-y-3 bg-background">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              previewOpen={previewDocId === doc.id}
              onTogglePreview={() => togglePreview(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Main ViewReportClient ----

export function ViewReportClient({
  member,
  condition,
  documents,
  isGeneral,
}: {
  member: ViewReportMember
  condition: ViewReportCondition
  documents: ViewReportDocument[]
  isGeneral: boolean
}) {
  const docsByType = REPORT_DOC_TYPE_ORDER.reduce<Record<DocumentType, ViewReportDocument[]>>(
    (acc, type) => {
      acc[type] = documents.filter((d) => d.document_type === type)
      return acc
    },
    {} as Record<DocumentType, ViewReportDocument[]>
  )

  const sectionsWithDocs = REPORT_DOC_TYPE_ORDER.filter(
    (type) => docsByType[type].length > 0
  )

  const [openSections, setOpenSections] = useState<Set<DocumentType>>(new Set())
  const allExpanded = sectionsWithDocs.length > 0 && sectionsWithDocs.every((t) => openSections.has(t))

  function toggleSection(type: DocumentType) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  function toggleAll() {
    if (allExpanded) {
      setOpenSections(new Set())
    } else {
      setOpenSections(new Set(sectionsWithDocs))
    }
  }

  const statusStyles: Record<string, string> = {
    active: 'bg-red-100 text-red-700 border-red-200',
    chronic: 'bg-orange-100 text-orange-700 border-orange-200',
    monitoring: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
  }

  return (
    <div>
      {/* Health metrics */}
      <HealthMetricsPanel member={member} />

      {/* Documents */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="size-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No documents found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isGeneral
              ? 'No general documents uploaded yet'
              : 'No documents uploaded for this condition yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Expand All / Collapse All */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={toggleAll}
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>

          {/* Document type sections */}
          {sectionsWithDocs.map((type) => (
            <DocTypeSection
              key={type}
              type={type}
              docs={docsByType[type]}
              isOpen={openSections.has(type)}
              onToggle={() => toggleSection(type)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
