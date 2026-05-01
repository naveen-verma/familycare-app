import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { MemberWithConditions } from '@/lib/members'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const avatarColors: Record<string, string> = {
  self: 'bg-blue-100 text-blue-700',
  spouse: 'bg-pink-100 text-pink-700',
  child: 'bg-green-100 text-green-700',
  parent: 'bg-purple-100 text-purple-700',
  sibling: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

export function MemberCard({ member }: { member: MemberWithConditions }) {
  const initials = getInitials(member.full_name)
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null
  const avatarColor = avatarColors[member.relation ?? 'other'] ?? avatarColors.other
  const activeConditions = member.medical_conditions.filter(
    (c) => c.status === 'active' || c.status === 'chronic'
  )
  const relation = member.relation === 'self' ? 'You' : member.relation

  return (
    <Link
      href={`/members/${member.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 min-h-[72px] hover:bg-muted/40 transition-colors"
    >
      <div
        className={`size-11 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${avatarColor}`}
      >
        {initials}
      </div>
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
