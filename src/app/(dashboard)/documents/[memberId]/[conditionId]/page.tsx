import { notFound } from 'next/navigation'
import { getViewReportData } from '@/lib/vault'
import { ViewReportClient } from '@/components/documents/ViewReportClient'
import { SecondOpinionButton } from '@/components/conditions/SecondOpinionButton'
import { PageShell } from '@/components/layout/PageShell'

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

  const title = isGeneral ? 'General Documents' : condition?.name ?? 'Documents'
  const subtitle = member.full_name

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      backHref="/documents"
    >
      {/* Condition status info (if not general) */}
      {!isGeneral && condition && (
        <div
          className="mb-4 rounded-[10px] p-4 space-y-2"
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 capitalize"
              style={{
                fontSize: 11, fontWeight: 500,
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {condition.status}
            </span>
            {condition.diagnosed_on && (
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                Diagnosed: {formatDate(condition.diagnosed_on)}
              </span>
            )}
          </div>
          {condition.diagnosed_by && (
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              {condition.diagnosed_by}
            </p>
          )}
          <SecondOpinionButton
            memberId={memberId}
            conditionId={conditionId}
            conditionName={condition.name}
            icd10ConditionId={condition.icd10_condition_id}
          />
        </div>
      )}

      <ViewReportClient
        member={member}
        condition={condition}
        documents={documents}
        isGeneral={isGeneral}
      />
    </PageShell>
  )
}
