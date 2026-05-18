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

function capitalize(s: string | null | undefined): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const STATUS_DOT: Record<string, string> = {
  active: '#BA7517', chronic: '#BA7517', monitoring: '#185FA5', resolved: '#6B7280',
}

interface MemberCardProps {
  member: MemberWithConditions
  medicationsCount: number
  documentsCount: number
}

export function MemberCard({ member, medicationsCount, documentsCount }: MemberCardProps) {
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null
  const colorIndex = RELATION_COLOR_INDEX[member.relation ?? 'other'] ?? 5
  const activeConditions = member.medical_conditions.filter(
    (c) => !c.deleted_at && (c.status === 'active' || c.status === 'chronic' || c.status === 'monitoring')
  )
  const conditionsCount = member.medical_conditions.filter((c) => !c.deleted_at).length
  const relationLabel = member.relation === 'self' ? 'You' : capitalize(member.relation)

  // Demographics: age · blood group · gender
  const demographics = [
    age !== null ? `${age}y` : null,
    member.blood_group ?? null,
    member.gender ? capitalize(member.gender) : null,
  ].filter(Boolean).join(' · ')

  // First active condition display
  const firstCondition = activeConditions[0]
  const conditionName = firstCondition
    ? firstCondition.icd10_conditions?.common_name ?? firstCondition.custom_name ?? 'Unknown'
    : null
  const extraCount = activeConditions.length - 1

  return (
    <Link
      href={`/members/${member.id}`}
      className="block group"
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 16,
        transition: 'border-color 150ms ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-secondary)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-tertiary)' }}
    >
      {/* Row 1 — header */}
      <div className="flex items-center gap-3 mb-3">
        <MemberAvatar
          name={member.full_name}
          avatarUrl={member.avatar_url ?? null}
          size={40}
          colorIndex={colorIndex}
        />
        <div className="flex-1 min-w-0">
          <p
            className="font-medium truncate"
            style={{ fontSize: 13, color: 'var(--color-text-primary)' }}
          >
            {member.full_name}
          </p>
          {relationLabel && (
            <span
              className="inline-block rounded-full"
              style={{
                fontSize: 10, color: 'var(--color-text-secondary)',
                background: 'var(--color-background-secondary)',
                padding: '2px 8px', marginTop: 2,
              }}
            >
              {relationLabel}
            </span>
          )}
        </div>
        <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
      </div>

      {/* Row 2 — demographics */}
      {demographics && (
        <p className="mb-3" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          {demographics}
        </p>
      )}

      {/* Divider */}
      <div className="mb-3" style={{ height: '0.5px', background: 'var(--color-border-tertiary)' }} />

      {/* Row 3 — stats mini row */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          { label: 'Conditions', value: conditionsCount },
          { label: 'Medications', value: medicationsCount },
          { label: 'Documents', value: documentsCount },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[8px] text-center"
            style={{ background: 'var(--color-background-secondary)', padding: '6px 8px' }}
          >
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</p>
            <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Row 4 — active condition pill */}
      {conditionName ? (
        <div className="flex items-center gap-1.5">
          <div
            className="rounded-full shrink-0"
            style={{ width: 6, height: 6, background: STATUS_DOT[firstCondition!.status] ?? '#BA7517' }}
          />
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }} className="truncate">
            {conditionName}
            {extraCount > 0 && (
              <span style={{ color: 'var(--color-text-tertiary)' }}> +{extraCount} more</span>
            )}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>No active conditions</p>
      )}
    </Link>
  )
}
