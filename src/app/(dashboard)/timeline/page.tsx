import { getFamilyMembers } from '@/lib/members'
import { TimelineView } from '@/components/timeline/TimelineView'
import { PageShell } from '@/components/layout/PageShell'
import Link from 'next/link'

export default async function TimelinePage() {
  const members = await getFamilyMembers()
  const memberOptions = members.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    avatar_url: m.avatar_url ?? null,
  }))
  const initialMemberId = memberOptions[0]?.id ?? null

  return (
    <PageShell
      title="Health timeline"
      subtitle="Complete health history · auto-generated"
    >
      {initialMemberId ? (
        <TimelineView members={memberOptions} initialMemberId={initialMemberId} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="flex items-center justify-center rounded-full mb-4"
            style={{ width: 48, height: 48, background: 'var(--color-background-secondary)' }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.5}
              style={{ color: 'var(--color-text-tertiary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="font-medium mb-1" style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
            No family members yet
          </p>
          <p className="mb-5" style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Add a family member to start building a health timeline
          </p>
          <Link
            href="/members"
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ fontSize: 13, color: '#0F6E56', textDecoration: 'underline' }}
          >
            Go to Family page
          </Link>
        </div>
      )}
    </PageShell>
  )
}
