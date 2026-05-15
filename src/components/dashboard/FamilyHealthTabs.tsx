'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MemberAvatar } from '@/components/members/MemberAvatar'

export interface FamilyMemberSummary {
  id: string
  name: string
  relation: string | null
  date_of_birth: string | null
  blood_group: string | null
  gender: string | null
  is_primary: boolean
  avatar_url: string | null
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

const CONDITION_DOT: Record<string, string> = {
  active: '#E24B4A',
  chronic: '#BA7517',
  monitoring: '#378ADD',
  resolved: '#888780',
}

// Inline styles for condition badges (Change 6)
const CONDITION_BADGE_STYLE: Record<string, React.CSSProperties> = {
  active:     { backgroundColor: '#FAEEDA', color: '#633806' },
  chronic:    { backgroundColor: '#FAEEDA', color: '#633806' },
  monitoring: { backgroundColor: '#E6F1FB', color: '#0C447C' },
  resolved:   { backgroundColor: '#F1EFE8', color: '#444441' },
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

// Sub-section label style matching dashboard section headers (Change 5)
const sectionLabel = 'text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground mb-2'

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
  const age = getAge(m.date_of_birth)
  const status = getStatus(m)

  // Pre-compute which years have events for teal segment logic (Change 3)
  const currentYear = new Date().getFullYear()
  const yearsWithEvents = new Set(
    m.conditions
      .filter(c => c.diagnosed_on)
      .map(c => new Date(c.diagnosed_on!).getFullYear())
  )
  const diagYears = Array.from(yearsWithEvents)
  const earliestEventYear = diagYears.length > 0 ? Math.min(...diagYears) : currentYear - 3
  // Cap to last 8 years — older history is visible on the full profile page
  const firstYear = Math.max(earliestEventYear, currentYear - 7)
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
        <Link href="/members" className="text-xs text-indigo-600 hover:underline">
          Manage →
        </Link>
      </div>

      {/* ── Card ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* ── Tab bar — grey bg to separate from white content (Change 1) ── */}
        <div className="flex overflow-x-auto bg-gray-50 border-b border-gray-200 px-4 pt-3 gap-1">
          {members.map((member, i) => {
            const isActive = i === safeIndex
            return (
              <button
                key={member.id}
                onClick={() => setActiveIndex(i)}
                className={`flex flex-col items-center gap-1.5 px-3 pb-2.5 border-b-2 flex-shrink-0 transition-colors ${
                  isActive ? 'border-teal-600' : 'border-transparent'
                }`}
              >
                <MemberAvatar
                  name={member.name}
                  avatarUrl={null}
                  size={40}
                  colorIndex={i}
                />
                <span className={`text-[11px] font-medium whitespace-nowrap ${
                  isActive ? 'text-teal-600' : 'text-gray-400'
                }`}>
                  {member.name.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Content panel ── */}
        <div className="p-4 space-y-5">

          {/* 1. Profile strip — compact single row (Changes 2) */}
          <div className="flex items-start gap-3">
            <MemberAvatar
              name={m.name}
              avatarUrl={m.avatar_url}
              size={48}
              colorIndex={safeIndex}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-tight truncate">{m.name}</p>
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
                {/* Single "View →" link — no duplicate at bottom (Change 2 / Change 4) */}
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

          {/* 3. Active conditions (Change 5 — label style; Change 6 — badge colours) */}
          <div>
            <p className={sectionLabel}>Active conditions</p>
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
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 capitalize"
                      style={CONDITION_BADGE_STYLE[cond.status] ?? { backgroundColor: '#F1EFE8', color: '#444441' }}
                    >
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
          <div>
              <p className={sectionLabel}>Health timeline</p>
              <div
                className="overflow-x-auto -mx-4 px-4"
                style={{ scrollbarWidth: 'none' } as React.CSSProperties}
              >
                <div className="flex min-w-max">
                  {timelineYears.map((year, yi) => {
                    const hasEvent = yearsWithEvents.has(year)
                    const nextHasEvent =
                      yi < timelineYears.length - 1 &&
                      yearsWithEvents.has(timelineYears[yi + 1])
                    const eventLabel =
                      m.conditions.find(
                        c => c.diagnosed_on && new Date(c.diagnosed_on).getFullYear() === year
                      )?.condition_name.split(' ')[0] ?? ''
                    const isCurrentYear = year === currentYear
                    // Left segment is teal when THIS year has events (Change 3)
                    const leftSegCls = yi > 0
                      ? (hasEvent ? 'bg-teal-500' : 'bg-gray-200')
                      : 'invisible'
                    // Right segment is teal when the NEXT year has events (Change 3)
                    const rightSegCls = yi < timelineYears.length - 1
                      ? (nextHasEvent ? 'bg-teal-500' : 'bg-gray-200')
                      : 'invisible'
                    return (
                      <div key={year} className="flex flex-col items-center min-w-[72px]">
                        {/* Year label — teal + medium weight for current year (Change 3) */}
                        <span
                          className={`text-[10px] mb-1.5 ${
                            isCurrentYear
                              ? 'text-teal-600 font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {year}
                        </span>
                        <div className="flex items-center w-full">
                          <div className={`flex-1 h-px ${leftSegCls}`} />
                          <div
                            className={`size-3 rounded-full shrink-0 ${
                              hasEvent
                                ? 'bg-teal-500'
                                : isCurrentYear
                                  ? 'bg-amber-400'
                                  : 'bg-gray-200'
                            }`}
                          />
                          <div className={`flex-1 h-px ${rightSegCls}`} />
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

        </div>

        {/* ── Footer — single "View full profile" link (Change 4) ── */}
        <div className="border-t border-gray-100 py-2.5 text-center">
          <Link
            href={`/members/${m.id}`}
            className="text-xs font-medium text-teal-600 hover:underline"
          >
            View full profile →
          </Link>
        </div>

      </div>
    </section>
  )
}
