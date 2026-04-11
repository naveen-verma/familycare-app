import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getViewReportData } from '@/lib/vault'
import { Button } from '@/components/ui/button'
import { ViewReportClient } from '@/components/documents/ViewReportClient'
import { ArrowLeft } from 'lucide-react'

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
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize ${statusStyles[condition.status] ?? statusStyles.monitoring}`}
              >
                {condition.status}
              </span>
              {condition.diagnosed_on && (
                <span className="text-xs text-muted-foreground">
                  Diagnosed: {formatDate(condition.diagnosed_on)}
                </span>
              )}
            </div>
            {condition.diagnosed_by && (
              <p className="text-xs text-muted-foreground">{condition.diagnosed_by}</p>
            )}
          </div>
        )}
      </div>

      {/* Client component: health metrics panel + document sections with inline preview */}
      <ViewReportClient
        member={member}
        condition={condition}
        documents={documents}
        isGeneral={isGeneral}
      />
    </div>
  )
}
