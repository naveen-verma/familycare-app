import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConditionTag } from '@/components/conditions/ConditionTag'
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
  const activeConditions = member.medical_conditions.filter(
    (c) => c.status === 'active' || c.status === 'chronic'
  )
  const avatarColor = avatarColors[member.relation ?? 'other'] ?? avatarColors.other

  return (
    <Link href={`/members/${member.id}`}>
      <Card className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div
              className={`size-10 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${avatarColor}`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{member.full_name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                {age !== null && <span>{age} yrs</span>}
                {age !== null && member.blood_group && <span>·</span>}
                {member.blood_group && <span>{member.blood_group}</span>}
              </div>
            </div>
            {member.relation && (
              <Badge variant="outline" className="text-xs capitalize shrink-0">
                {member.relation === 'self' ? 'You' : member.relation}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeConditions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {activeConditions.slice(0, 3).map((c) => (
                <ConditionTag
                  key={c.id}
                  status={c.status}
                  name={
                    c.icd10_conditions?.common_name ??
                    c.icd10_conditions?.name ??
                    c.custom_name ??
                    'Unknown'
                  }
                />
              ))}
              {activeConditions.length > 3 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{activeConditions.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No active conditions</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
