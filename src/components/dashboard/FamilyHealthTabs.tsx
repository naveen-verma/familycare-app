'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface FamilyMemberSummary {
  id: string
  name: string
  relation: string | null
  date_of_birth: string | null
  blood_group: string | null
  gender: string | null
  is_primary: boolean
  conditions_count: number
  active_conditions_count: number
  medications_count: number
  documents_count: number
  conditions: Array<{
    id: string
    condition_name: string
    status: string
    diagnosed_on: string | null
  }>
  last_event_date: string | null
}

interface Props {
  members: FamilyMemberSummary[]
  onAddMember?: () => void
}

const AVATAR_COLORS = ['#0D9488', '#7F77DD', '#D85A30', '#1D9E75', '#D4537E', '#378ADD']

const CONDITION_DOT: Record<string, string> = {
  active: '#E24B4A',
  chronic: '#BA7517',
  monitoring: '#378ADD',
  resolved: '#888780',
}

const CONDITION_BADGE: Record<string, string> = {
  active: 'bg-red-50 text-red-700',
  chronic: 'bg-amber-50 text-amber-700',
  monitoring: 'bg-blue-50 text-blue-700',
  resolved: 'bg-gray-100 text-gray-600',
}

function getAge(dob: string | null): string {
  if (!dob) return ''
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age}y`
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getStatus(m: FamilyMemberSummary) {
  if (m.active_conditions_count > 0 && m.medications_count > 0)
    return { label: 'Up to date', cls: 'bg-green-100 text-green-700' }
  if (m.active_conditions_count > 0 && m.medications_count === 0)
    return { label: 'Needs review', cls: 'bg-amber-100 text-amber-700' }
  if (m.conditions_count === 0 && m.documents_count === 0)
    return { label: 'Add data', cls: 'bg-gray-100 text-gray-600' }
  return { label: 'Partial', cls: 'bg-blue-100 text-blue-700' }
}

export function FamilyHealthTabs({ members, onAddMember }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (members.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Family Health
        </h2>
        <div className="rounded-2xl border-2 border-dashed border-muted p-8 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-indigo-50 flex items-center justify-center">
            <UserPlus className="size-6 text-indigo-500" />
          </div>
          <p className="text-sm text-muted-foreground">No family members yet</p>
          <Button size="sm" onClick={onAddMember}>Add Member</Button>
        </div>
      </section>
    )
  }

  const safeIndex = Math.min(activeIndex, members.length - 1)
  const m = members[safeIndex]
  const color = AVATAR_COLORS[safeIndex % AVATAR_COLORS.length]
  const age = getAge(m.date_of_birth)
  const status = getStatus(m)

  // Build year range for mini timeline from condition diagnosed_on dates
  const currentYear = new Date().getFullYear()
  const diagYears = m.conditions
    .map(c => c.diagnosed_on ? new Date(c.diagnosed_on).getFullYear() : null)
    .filter((y): y is number => y !== null)
  const firstYear = diagYears.length > 0 ? Math.min(...diagYears) : currentYear
  const timelineYears = Array.from(
    { length: currentYear - firstYear + 1 },
    (_, i) => firstYear + i
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Family Health
        </h2>
        <Link
          href="/members"
          className="text-xs text-indigo-600 hover:underline"
        >
          Manage →
        </Link>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {/* ── Tab bar ── */}
        <div
          className="flex overflow-x-auto border-b border-gray-100 bg-white px-2"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {members.map((member, i) => {
            const tabColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const isActive = i === safeIndex
            return (
              <button
                key={member.id}
                onClick={() => setActiveIndex(i)}
                className={`flex flex-col items-center gap-1.5 py-3 px-3 min-w-[72px] shrink-0 border-b-2 transition-colors ${
                  isActive ? 'border-teal-500' : 'border-transparent'
                }`}
              >
                <div
                  className="size-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: tabColor }}
                >
                  {getInitials(member.name)}
                </div>
                <span className="text-[11px] font-medium truncate max-w-[64px] text-center leading-tight">
                  {member.name.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Content panel ── */}
        <div className="p-4 space-y-5">

          {/* 1. Profile row */}
          <div className="flex items-start gap-3">
            <div
              className="size-[52px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: color }}
            >
              {getInitials(m.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-bold leading-tight truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[age, m.relation === 'self' ? 'You' : m.relation]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {m.blood_group && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-700">
                        {m.blood_group}
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/members/${m.id}`}
                  className="text-xs text-teal-600 hover:underline shrink-0 mt-0.5"
                >
                  View →
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Conditions', value: m.conditions_count },
              { label: 'Medications', value: m.medications_count },
              { label: 'Documents', value: m.documents_count },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-secondary p-2.5 text-center">
                <p className="text-[22px] font-bold leading-none">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* 3. Active conditions */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Active conditions
            </p>
            {m.conditions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No conditions recorded</p>
            ) : (
              <div className="space-y-2">
                {m.conditions.map((cond) => (
                  <div key={cond.id} className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: CONDITION_DOT[cond.status] ?? '#888780' }}
                    />
                    <span className="text-[13px] font-semibold flex-1 min-w-0 truncate">
                      {cond.condition_name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 capitalize ${CONDITION_BADGE[cond.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {cond.status}
                    </span>
                    {cond.diagnosed_on && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(cond.diagnosed_on).getFullYear()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Mini health timeline */}
          {timelineYears.length > 1 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Health timeline
              </p>
              <div
                className="overflow-x-auto -mx-4 px-4"
                style={{ scrollbarWidth: 'none' } as React.CSSProperties}
              >
                <div className="flex min-w-max">
                  {timelineYears.map((year, yi) => {
                    const yearConds = m.conditions.filter(
                      c => c.diagnosed_on && new Date(c.diagnosed_on).getFullYear() === year
                    )
                    const hasEvent = yearConds.length > 0
                    const eventLabel = yearConds[0]?.condition_name.split(' ')[0] ?? ''
                    return (
                      <div key={year} className="flex flex-col items-center min-w-[72px]">
                        <span className="text-[10px] text-muted-foreground mb-1.5">{year}</span>
                        <div className="flex items-center w-full">
                          <div className={`flex-1 h-px ${yi > 0 ? 'bg-gray-200' : 'invisible'}`} />
                          <div
                            className={`size-3 rounded-full shrink-0 ${hasEvent ? 'bg-teal-500' : 'bg-gray-200'}`}
                          />
                          <div className={`flex-1 h-px ${yi < timelineYears.length - 1 ? 'bg-gray-200' : 'invisible'}`} />
                        </div>
                        <span className="text-[9px] text-teal-600 mt-1 max-w-[64px] text-center truncate leading-tight h-3">
                          {hasEvent ? eventLabel : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. Full profile link */}
          <div className="text-center pt-1">
            <Link
              href={`/members/${m.id}`}
              className="text-xs text-teal-600 hover:underline"
            >
              View full profile →
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
