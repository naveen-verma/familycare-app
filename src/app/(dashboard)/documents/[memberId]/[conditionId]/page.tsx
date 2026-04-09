import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getViewReportData, DOC_TYPE_ORDER, DOC_TYPE_LABELS } from '@/lib/vault'
import type { ViewReportDocument } from '@/lib/vault'
import type { DocumentType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  FileText,
  FileImage,
  Download,
  Eye,
  Calendar,
  Stethoscope,
  Building2,
  FolderOpen,
  Upload,
  Zap,
} from 'lucide-react'

const statusStyles: Record<string, string> = {
  active: 'bg-red-100 text-red-700 border-red-200',
  chronic: 'bg-orange-100 text-orange-700 border-orange-200',
  monitoring: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function DocumentCard({ doc }: { doc: ViewReportDocument }) {
  const isImage = doc.file_type === 'jpg' || doc.file_type === 'jpeg' || doc.file_type === 'png'

  return (
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
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm">{doc.title}</p>
              {doc.phase2_ready && (
                <span className="flex items-center gap-0.5 text-xs text-amber-600 shrink-0">
                  <Zap className="size-3" />
                  Phase 2
                </span>
              )}
            </div>

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
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{doc.notes}</p>
            )}

            {doc.signed_url && (
              <div className="flex gap-2 mt-3">
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <a href={doc.signed_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="size-3 mr-1" />
                    View
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <a href={doc.signed_url} download>
                    <Download className="size-3 mr-1" />
                    Download
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DocTypeSection({
  type,
  docs,
}: {
  type: DocumentType
  docs: ViewReportDocument[]
}) {
  if (!docs.length) return null

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {DOC_TYPE_LABELS[type]}
      </h2>
      {docs.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
  )
}

export default async function ViewReportPage({
  params,
}: {
  params: Promise<{ memberId: string; conditionId: string }>
}) {
  const { memberId, conditionId } = await params
  const data = await getViewReportData(memberId, conditionId)

  if (!data) notFound()

  const { member, condition, documents } = data
  const isGeneral = conditionId === 'general'

  const docsByType = DOC_TYPE_ORDER.reduce<Record<DocumentType, ViewReportDocument[]>>(
    (acc, type) => {
      acc[type] = documents.filter((d) => d.document_type === type)
      return acc
    },
    {} as Record<DocumentType, ViewReportDocument[]>
  )

  const hasDocuments = documents.length > 0

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="p-0 h-auto mb-5">
        <Link href="/documents">
          <ArrowLeft className="size-4 mr-1" />
          Document Vault
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-1">{member.full_name}</p>
        <h1 className="font-heading text-xl font-semibold">
          {isGeneral ? 'General Documents' : condition?.name ?? 'Unknown Condition'}
        </h1>
        {!isGeneral && condition && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize ${statusStyles[condition.status] ?? statusStyles.monitoring}`}
            >
              {condition.status}
            </span>
            {condition.diagnosed_on && (
              <span className="text-xs text-muted-foreground">
                Diagnosed {formatDate(condition.diagnosed_on)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Documents */}
      {!hasDocuments ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="size-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No documents found</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {isGeneral
              ? 'No general documents uploaded yet'
              : 'No documents linked to this condition yet'}
          </p>
          <Button asChild size="sm">
            <Link href="/documents/upload">
              <Upload className="size-3.5 mr-1.5" />
              Upload document
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {DOC_TYPE_ORDER.map((type) => (
            <DocTypeSection key={type} type={type} docs={docsByType[type]} />
          ))}
        </div>
      )}
    </div>
  )
}
