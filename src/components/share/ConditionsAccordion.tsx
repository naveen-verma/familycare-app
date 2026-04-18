'use client'

import { useState } from 'react'
import {
  ChevronDownIcon,
  PillIcon,
  FileTextIcon,
  XIcon,
  ExternalLinkIcon,
} from 'lucide-react'

// ---- Types ----

type Condition = {
  id: string
  custom_name: string | null
  status: string
  diagnosed_on: string | null
  diagnosed_by: string | null
  notes: string | null
  is_pinned: boolean
  icd10_conditions: {
    icd10_code: string
    name: string
    common_name: string | null
  } | null
}

type Medication = {
  id: string
  name: string
  dosage: string | null
  frequency: string | null
  prescribed_by: string | null
  is_active: boolean
  start_date: string | null
  medical_condition_id: string | null
}

type Document = {
  id: string
  title: string
  document_type: string
  document_date: string | null
  doctor_name: string | null
  hospital_name: string | null
  file_url: string
  file_type: string | null
  file_size_kb: number | null
  medical_condition_id: string | null
  condition_name: string | null
  signed_url: string | null
}

type Props = {
  conditions: Condition[]
  medications: Medication[]
  documents: Document[]
  includeDocuments: boolean
}

// ---- Helpers ----

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  chronic: 'bg-orange-100 text-orange-700 border-orange-200',
  monitoring: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-gray-100 text-gray-600 border-gray-200',
}

const DOC_TYPE_ORDER = [
  'prescription',
  'report',
  'scan',
  'vaccination',
  'other',
  'insurance',
]

const DOC_TYPE_LABEL: Record<string, string> = {
  prescription: 'Prescription',
  report: 'Lab Report',
  scan: 'Scan / Imaging',
  insurance: 'Insurance',
  vaccination: 'Vaccination',
  other: 'Document',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isImage(fileType: string | null): boolean {
  if (!fileType) return false
  return fileType.startsWith('image/')
}

// ---- Document preview ----

function DocumentPreview({
  src,
  doc,
  onClose,
}: {
  src: string
  doc: Document
  onClose: () => void
}) {
  return (
    <div className="border-t bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <p className="text-xs font-medium truncate">{doc.title}</p>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded p-0.5 hover:bg-gray-100 transition-colors"
          aria-label="Close preview"
        >
          <XIcon className="size-3.5 text-muted-foreground" />
        </button>
      </div>
      {isImage(doc.file_type) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={doc.title} className="w-full object-contain max-h-[500px] rounded-b-lg" />
      ) : (
        <embed src={src} type="application/pdf" width="100%" height="500px" />
      )}
    </div>
  )
}

// ---- Document card ----

function DocumentCard({
  doc,
  includeDocuments,
  previewDocId,
  onTogglePreview,
}: {
  doc: Document
  includeDocuments: boolean
  previewDocId: string | null
  onTogglePreview: (id: string) => void
}) {
  const label = DOC_TYPE_LABEL[doc.document_type] ?? 'Document'
  const isPreviewing = previewDocId === doc.id
  // Use the pre-generated public URL (signed_url field now holds the public URL)
  const publicUrl = doc.signed_url

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-medium truncate">{doc.title}</span>
              <span className="shrink-0 inline-flex h-5 items-center rounded-full bg-gray-100 px-2 text-[11px] font-medium text-gray-600">
                {label}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {doc.document_date && <span>{formatDate(doc.document_date)}</span>}
              {doc.doctor_name && <span>{doc.doctor_name}</span>}
              {doc.hospital_name && <span>{doc.hospital_name}</span>}
            </div>
          </div>

          {includeDocuments && publicUrl ? (
            <button
              onClick={() => onTogglePreview(doc.id)}
              className="shrink-0 inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              {isPreviewing ? (
                <>
                  <XIcon className="size-3" />
                  Close
                </>
              ) : (
                <>
                  <ExternalLinkIcon className="size-3" />
                  View Document
                </>
              )}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground shrink-0 italic">
              {!includeDocuments
                ? 'Document viewing not enabled for this link'
                : null}
            </span>
          )}
        </div>
      </div>

      {isPreviewing && includeDocuments && publicUrl && (
        <DocumentPreview
          src={publicUrl}
          doc={doc}
          onClose={() => onTogglePreview(doc.id)}
        />
      )}
    </div>
  )
}

// ---- Condition accordion item ----

function ConditionItem({
  condition,
  medications,
  documents,
  includeDocuments,
  isOpen,
  onToggle,
}: {
  condition: Condition
  medications: Medication[]
  documents: Document[]
  includeDocuments: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)

  const conditionName =
    condition.icd10_conditions?.common_name ??
    condition.icd10_conditions?.name ??
    condition.custom_name ??
    '—'

  // Group documents by type in fixed order
  const docsByType: Record<string, Document[]> = {}
  for (const doc of documents) {
    if (!docsByType[doc.document_type]) docsByType[doc.document_type] = []
    docsByType[doc.document_type].push(doc)
  }
  const orderedTypes = DOC_TYPE_ORDER.filter((t) => docsByType[t]?.length)

  function togglePreview(id: string) {
    setPreviewDocId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{conditionName}</span>
            <span
              className={`inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium capitalize ${
                STATUS_BADGE[condition.status] ?? STATUS_BADGE.active
              }`}
            >
              {condition.status}
            </span>
          </div>
          {condition.icd10_conditions && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {condition.icd10_conditions.icd10_code}
            </p>
          )}
          {condition.diagnosed_on && (
            <p className="text-xs text-muted-foreground">
              Diagnosed {formatDate(condition.diagnosed_on)}
            </p>
          )}
        </div>
        <ChevronDownIcon
          className={`size-4 text-muted-foreground shrink-0 mt-0.5 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Body */}
      {isOpen && (
        <div className="border-t divide-y">
          {/* Condition details */}
          {(condition.diagnosed_by || condition.notes) && (
            <div className="px-4 py-3 text-sm space-y-1 bg-gray-50">
              {condition.diagnosed_by && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Diagnosed by:</span>{' '}
                  {condition.diagnosed_by}
                </p>
              )}
              {condition.notes && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Notes:</span>{' '}
                  {condition.notes}
                </p>
              )}
            </div>
          )}

          {/* Linked Medications */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <PillIcon className="size-3.5 text-muted-foreground" />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Medications
              </h4>
            </div>
            {medications.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No medications linked to this condition
              </p>
            ) : (
              <ul className="space-y-2">
                {medications.map((med) => (
                  <li key={med.id} className="rounded-lg border px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{med.name}</p>
                        <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-muted-foreground">
                          {med.dosage && <span>{med.dosage}</span>}
                          {med.frequency && <span>{med.frequency}</span>}
                          {med.prescribed_by && (
                            <span>Prescribed by {med.prescribed_by}</span>
                          )}
                          {med.start_date && (
                            <span>Started {formatDate(med.start_date)}</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-[11px] font-medium ${
                          med.is_active
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {med.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Linked Documents */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <FileTextIcon className="size-3.5 text-muted-foreground" />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Documents
              </h4>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No documents linked to this condition
              </p>
            ) : (
              <div className="space-y-3">
                {orderedTypes.map((type) => (
                  <div key={type}>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                      {DOC_TYPE_LABEL[type]}
                    </p>
                    <div className="space-y-2">
                      {docsByType[type].map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          doc={doc}
                          includeDocuments={includeDocuments}
                          previewDocId={previewDocId}
                          onTogglePreview={togglePreview}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Main accordion ----

export function ConditionsAccordion({
  conditions,
  medications,
  documents,
  includeDocuments,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(
    conditions.length > 0 ? conditions[0].id : null
  )

  if (conditions.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-muted-foreground">
        No conditions included in this summary.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {conditions.map((condition) => {
        const condMeds = medications.filter(
          (m) => m.medical_condition_id === condition.id
        )
        const condDocs = documents.filter(
          (d) => d.medical_condition_id === condition.id
        )
        return (
          <ConditionItem
            key={condition.id}
            condition={condition}
            medications={condMeds}
            documents={condDocs}
            includeDocuments={includeDocuments}
            isOpen={openId === condition.id}
            onToggle={() =>
              setOpenId((prev) => (prev === condition.id ? null : condition.id))
            }
          />
        )
      })}
    </div>
  )
}
