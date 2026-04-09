import { notFound } from 'next/navigation'
import { getDocument } from '@/lib/documents'
import { DocumentTypeIcon } from '@/components/documents/DocumentTypeIcon'
import { DeleteDocumentButton } from '@/components/documents/DeleteDocumentButton'
import { ConditionTag } from '@/components/conditions/ConditionTag'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Stethoscope,
  Building2,
  User,
  FileText,
  Download,
  Sparkles,
} from 'lucide-react'
import type { DocumentType } from '@/types/database'

const docTypeLabels: Record<DocumentType, string> = {
  prescription: 'Prescription',
  report: 'Lab Report',
  scan: 'Scan / Imaging',
  insurance: 'Insurance',
  vaccination: 'Vaccination',
  other: 'Other',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatFileSize(kb: number | null | undefined): string {
  if (!kb) return '—'
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const doc = await getDocument(id)

  if (!doc) notFound()

  const condition = doc.medical_conditions
  const conditionName = condition
    ? (condition.icd10_conditions?.common_name ??
        condition.icd10_conditions?.name ??
        condition.custom_name)
    : null

  const isImage = doc.file_type === 'jpg' || doc.file_type === 'jpeg' || doc.file_type === 'png'
  const viewUrl = doc.signed_url

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="p-0 h-auto mb-6">
        <Link href="/documents">
          <ArrowLeft className="size-4 mr-1" />
          Back to vault
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <DocumentTypeIcon type={doc.document_type} fileType={doc.file_type} />
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-lg font-semibold leading-tight">{doc.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex h-5 items-center rounded-full bg-muted border px-2 text-xs font-medium">
              {docTypeLabels[doc.document_type] ?? 'Other'}
            </span>
            {doc.phase2_ready && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 text-xs text-amber-700 font-medium">
                <Sparkles className="size-3" />
                Phase 2 Ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* File preview */}
      {!viewUrl ? (
        <div className="rounded-xl border mb-5 bg-muted flex items-center justify-center h-40">
          <p className="text-sm text-muted-foreground">Preview unavailable</p>
        </div>
      ) : isImage ? (
        <div className="rounded-xl overflow-hidden border mb-5 bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewUrl}
            alt={doc.title}
            className="w-full object-contain max-h-[400px]"
          />
        </div>
      ) : (
        <div className="rounded-xl border mb-5 bg-muted overflow-hidden">
          <iframe
            src={viewUrl}
            className="w-full h-[400px] md:h-[500px]"
            title={doc.title}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <Button asChild size="sm" disabled={!viewUrl}>
          <a href={viewUrl ?? '#'} download target="_blank" rel="noopener noreferrer">
            <Download className="size-4 mr-1.5" />
            Download
          </a>
        </Button>
        <DeleteDocumentButton documentId={doc.id} />
      </div>

      <Separator className="mb-5" />

      {/* Metadata */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Details
        </h2>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Family Member</p>
                <p className="text-sm font-medium">
                  {doc.family_members?.full_name ?? '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Document Date</p>
                <p className="text-sm font-medium">{formatDate(doc.document_date)}</p>
              </div>
            </div>

            {doc.doctor_name && (
              <div className="flex items-center gap-2">
                <Stethoscope className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Doctor</p>
                  <p className="text-sm font-medium">{doc.doctor_name}</p>
                </div>
              </div>
            )}

            {doc.hospital_name && (
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Hospital / Clinic</p>
                  <p className="text-sm font-medium">{doc.hospital_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">File Size</p>
                <p className="text-sm font-medium">{formatFileSize(doc.file_size_kb)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Uploaded On</p>
                <p className="text-sm font-medium">{formatDate(doc.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {conditionName && condition && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Linked Condition</p>
            <ConditionTag status={condition.status} name={conditionName} />
          </div>
        )}

        {doc.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Notes</p>
            <Card>
              <CardContent className="p-3">
                <p className="text-sm whitespace-pre-wrap">{doc.notes}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phase 2 signal */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Second Opinion Status</p>
          <span
            className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-3 text-xs font-medium ${
              doc.phase2_ready
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-muted border-border text-muted-foreground'
            }`}
          >
            <Sparkles className="size-3" />
            {doc.phase2_ready
              ? 'Ready for second opinion matching'
              : 'Link a condition to enable second opinions'}
          </span>
        </div>
      </div>
    </div>
  )
}
