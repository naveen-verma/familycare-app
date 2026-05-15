import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { MemberWithConditions } from '@/lib/members'
import { MemberAvatar } from '@/components/members/MemberAvatar'

const RELATION_COLOR_INDEX: Record<string, number> = {
  self: 0, spouse: 4, child: 3, parent: 1, sibling: 2, other: 5,
}

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function MemberCard({ member }: { member: MemberWithConditions }) {
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null
  const colorIndex = RELATION_COLOR_INDEX[member.relation ?? 'other'] ?? 5
  const activeConditions = member.medical_conditions.filter(
    (c) => c.status === 'active' || c.status === 'chronic'
  )
  const relation = member.relation === 'self' ? 'You' : member.relation

  return (
    <Link
      href={`/members/${member.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[72px] hover:bg-muted/40 transition-colors"
    >
      <MemberAvatar
        name={member.full_name}
        avatarUrl={member.avatar_url ?? null}
        size={44}
        colorIndex={colorIndex}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight truncate">{member.full_name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[relation, age !== null ? `${age} yrs` : null].filter(Boolean).join(' · ')}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeConditions.length > 0
            ? `${activeConditions.length} active condition${activeConditions.length !== 1 ? 's' : ''}`
            : 'No active conditions'}
        </p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </Link>
  )
}
