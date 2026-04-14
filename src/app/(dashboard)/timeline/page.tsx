import { getFamilyMembers } from '@/lib/members'
import { TimelineView } from '@/components/timeline/TimelineView'
import Link from 'next/link'

export default async function TimelinePage() {
  const members = await getFamilyMembers()
  const memberOptions = members.map((m) => ({ id: m.id, full_name: m.full_name }))
  const initialMemberId = memberOptions[0]?.id ?? null

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold">Health Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete health history — auto-generated
        </p>
      </div>

      {initialMemberId ? (
        <TimelineView members={memberOptions} initialMemberId={initialMemberId} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-medium text-sm">No family members found.</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Add a family member to start building a health timeline.
          </p>
          <Link
            href="/members"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Go to Family page
          </Link>
        </div>
      )}
    </div>
  )
}
