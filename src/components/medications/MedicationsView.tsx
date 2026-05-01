'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toggleReminderAction } from '@/app/(dashboard)/medications/actions'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Pill, Clock, Calendar, User, Bell, BellOff, Edit, Plus } from 'lucide-react'
import type { MedicationWithCondition } from '@/lib/medication-utils'
import { getConditionName, isMedicationActive, frequencyLabel } from '@/lib/medication-utils'

type MemberWithMeds = {
  id: string
  full_name: string
  relation: string | null
  medications: MedicationWithCondition[]
}

const avatarColors: Record<string, string> = {
  self: 'bg-blue-100 text-blue-700',
  spouse: 'bg-pink-100 text-pink-700',
  child: 'bg-green-100 text-green-700',
  parent: 'bg-purple-100 text-purple-700',
  sibling: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function MedicationCard({ medication }: { medication: MedicationWithCondition }) {
  const [reminderOn, setReminderOn] = useState(medication.reminder_enabled)
  const [toggling, setToggling] = useState(false)

  const active = isMedicationActive(medication)
  const conditionName = getConditionName(medication)

  async function handleReminderToggle() {
    if (toggling) return
    setToggling(true)
    const prev = reminderOn
    setReminderOn(!prev)
    try {
      await toggleReminderAction(medication.id, prev)
    } catch {
      setReminderOn(prev)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      {/* Header — always visible */}
      <div className="flex items-center gap-2.5 min-h-[44px]">
        <div className="size-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
          <Pill className="size-4 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/medications/${medication.id}`}
              className="font-semibold text-sm hover:text-primary transition-colors"
            >
              {medication.name}
            </Link>
            <span
              className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${
                active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {/* Dosage · frequency on one compact line */}
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {[medication.dosage, medication.frequency ? frequencyLabel(medication.frequency) : null]
              .filter(Boolean)
              .join(' · ') || <span className="italic">No dosage set</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Reminder dot */}
          <span
            className={`size-2 rounded-full ${reminderOn ? 'bg-green-500' : 'bg-gray-300'}`}
            title={reminderOn ? 'Reminders on' : 'Reminders off'}
          />
          <Button asChild variant="ghost" size="sm" className="size-8 p-0">
            <Link href={`/medications/${medication.id}/edit`} aria-label="Edit medication">
              <Edit className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Secondary info — hidden on mobile, shown on sm: */}
      <div className="hidden sm:block space-y-1.5">
        {(medication.frequency || conditionName) && (
          <div className="flex flex-wrap gap-1.5">
            {conditionName && (
              <span className="flex items-center text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                {conditionName}
              </span>
            )}
          </div>
        )}
        {medication.time_of_day && medication.time_of_day.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {medication.time_of_day.map((t, i) => (
              <span key={i} className="flex items-center gap-1 text-xs rounded-full bg-muted px-2 py-0.5">
                <Clock className="size-3 text-muted-foreground" />
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {medication.prescribed_by && (
            <span className="flex items-center gap-1"><User className="size-3" />{medication.prescribed_by}</span>
          )}
          {medication.start_date && (
            <span className="flex items-center gap-1"><Calendar className="size-3" />Started {formatDate(medication.start_date)}</span>
          )}
          {medication.end_date ? (
            <span className="flex items-center gap-1"><Calendar className="size-3" />Until {formatDate(medication.end_date)}</span>
          ) : (
            <span className="text-green-600 font-medium">Ongoing</span>
          )}
        </div>
      </div>

      {/* Reminder toggle */}
      <div className="flex items-center gap-2 pt-1 border-t">
        <Switch checked={reminderOn} onCheckedChange={handleReminderToggle} disabled={toggling} aria-label="Toggle reminder" />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {reminderOn ? <Bell className="size-3" /> : <BellOff className="size-3" />}
          {reminderOn ? 'Reminders on' : 'Reminders off'}
        </span>
      </div>
    </div>
  )
}

function MemberMedSection({
  member,
  statusFilter,
}: {
  member: MemberWithMeds
  statusFilter: 'active' | 'all'
}) {
  const initials = getInitials(member.full_name)
  const avatarColor = avatarColors[member.relation ?? 'other'] ?? avatarColors.other

  const medications =
    statusFilter === 'active'
      ? member.medications.filter((m) => isMedicationActive(m))
      : member.medications

  if (medications.length === 0) return null

  return (
    <div>
      {/* Member section header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`size-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${avatarColor}`}
        >
          {initials}
        </div>
        <span className="text-sm font-semibold">{member.full_name}</span>
        <span className="text-xs text-muted-foreground">
          {medications.length} {medications.length === 1 ? 'medication' : 'medications'}
        </span>
      </div>
      <div className="space-y-3 pl-0.5">
        {medications.map((med) => (
          <MedicationCard key={med.id} medication={med} />
        ))}
      </div>
    </div>
  )
}

export function MedicationsView({ memberMeds }: { memberMeds: MemberWithMeds[] }) {
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active')

  if (memberMeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Pill className="size-12 text-muted-foreground mb-3" />
        <p className="font-medium text-sm">No family members yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Add family members to start tracking medications
        </p>
        <Link href="/dashboard" className="text-sm text-primary underline underline-offset-2">
          Go to Dashboard
        </Link>
      </div>
    )
  }

  const hasAnyMedications = memberMeds.some((m) => m.medications.length > 0)

  return (
    <div className="relative">
      {/* Status filter chips */}
      <div className="flex gap-2 mb-5">
        {(['active', 'all'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px] ${
              statusFilter === filter
                ? 'bg-teal-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {filter === 'active' ? 'Active' : 'All'}
          </button>
        ))}
      </div>

      {/* Member sections */}
      {!hasAnyMedications ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <Pill className="size-5 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">No medications yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Add the first medication for a family member
          </p>
          <Link
            href="/medications/add"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors h-11"
          >
            <Plus className="size-4" />
            Add Medication
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {memberMeds.map((m) => (
            <MemberMedSection key={m.id} member={m} statusFilter={statusFilter} />
          ))}
          {/* Empty state when filter hides everything */}
          {statusFilter === 'active' &&
            memberMeds.every((m) => m.medications.filter(isMedicationActive).length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Pill className="size-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">No active medications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All medications are inactive or ended
                </p>
              </div>
            )}
        </div>
      )}

      {/* FAB */}
      <Link
        href="/medications/add"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 size-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-40"
        aria-label="Add medication"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  )
}
