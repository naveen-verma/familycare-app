import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type MemberSnapshot = {
  id: string
  full_name: string
  relation: string | null
  dateOfBirth: string | null
  conditionCount: number
  medCount: number
  hasDoc: boolean
}

const avatarColors: Record<string, string> = {
  self: 'bg-blue-100 text-blue-700',
  spouse: 'bg-pink-100 text-pink-700',
  child: 'bg-green-100 text-green-700',
  parent: 'bg-purple-100 text-purple-700',
  sibling: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAge(dob: string | null): string {
  if (!dob) return ''
  const years = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600000)
  )
  return `${years}y`
}

function statusDot(s: MemberSnapshot): string {
  if (s.medCount > 0 && s.hasDoc) return 'bg-green-500'
  if (s.conditionCount > 0 && s.medCount === 0) return 'bg-amber-500'
  return 'bg-gray-300'
}

interface FamilyHealthSnapshotProps {
  snapshots: MemberSnapshot[]
}

export function FamilyHealthSnapshot({ snapshots }: FamilyHealthSnapshotProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Family Health Snapshot
        </h2>
        <Link
          href="/members"
          className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
        >
          Manage <ChevronRight className="size-3" />
        </Link>
      </div>
      <div className="rounded-xl border bg-white divide-y overflow-hidden">
        {snapshots.map((s) => {
          const initials = getInitials(s.full_name)
          const color = avatarColors[s.relation ?? 'other'] ?? avatarColors.other
          const age = getAge(s.dateOfBirth)
          const relationLabel = s.relation === 'self' ? 'You' : (s.relation ?? '—')
          const meta = [age, relationLabel].filter(Boolean).join(' · ')
          return (
            <Link
              key={s.id}
              href={`/members/${s.id}`}
              className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <div
                className={`size-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs ${color}`}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {meta} · {s.conditionCount} cond. · {s.medCount} med. · docs{' '}
                  {s.hasDoc ? '✓' : '✗'}
                </p>
              </div>
              <div className={`size-2.5 rounded-full shrink-0 ${statusDot(s)}`} />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
