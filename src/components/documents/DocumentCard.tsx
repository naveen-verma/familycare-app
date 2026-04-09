import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { DocumentTypeIcon } from './DocumentTypeIcon'
import { ConditionTag } from '@/components/conditions/ConditionTag'
import type { DocumentWithMember } from '@/lib/documents'
import type { DocumentType } from '@/types/database'
import { Calendar, User, Building2, Stethoscope } from 'lucide-react'

const docTypeLabels: Record<DocumentType, string> = {
  prescription: 'Prescription',
  report: 'Report',
  scan: 'Scan',
  insurance: 'Insurance',
  vaccination: 'Vaccination',
  other: 'Other',
}

const docTypeBadgeVariants: Record<DocumentType, string> = {
  prescription: 'bg-blue-100 text-blue-700 border-blue-200',
  report: 'bg-purple-100 text-purple-700 border-purple-200',
  scan: 'bg-orange-100 text-orange-700 border-orange-200',
  insurance: 'bg-green-100 text-green-700 border-green-200',
  vaccination: 'bg-teal-100 text-teal-700 border-teal-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function DocumentCard({ doc }: { doc: DocumentWithMember }) {
  const condition = doc.medical_conditions
  const conditionName = condition
    ? (condition.icd10_conditions?.common_name ??
        condition.icd10_conditions?.name ??
        condition.custom_name)
    : null

  return (
    <Link href={`/documents/${doc.id}`}>
      <Card className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <DocumentTypeIcon type={doc.document_type} fileType={doc.file_type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm truncate">{doc.title}</p>
                <span
                  className={`inline-flex shrink-0 h-5 items-center rounded-full border px-2 text-xs font-medium ${docTypeBadgeVariants[doc.document_type] ?? docTypeBadgeVariants.other}`}
                >
                  {docTypeLabels[doc.document_type] ?? 'Other'}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {doc.family_members?.full_name && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="size-3" />
                    {doc.family_members.full_name}
                  </span>
                )}
                {doc.document_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {formatDate(doc.document_date)}
                  </span>
                )}
              </div>

              {(doc.doctor_name || doc.hospital_name) && (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
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
              )}

              {conditionName && condition && (
                <div className="mt-2">
                  <ConditionTag status={condition.status} name={conditionName} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
