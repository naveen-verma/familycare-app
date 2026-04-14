'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toggleReminderAction } from '@/app/(dashboard)/medications/actions'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pill, Clock, Calendar, User, Bell, BellOff, Edit, Plus } from 'lucide-react'
import type { MedicationWithCondition } from '@/lib/medication-utils'
import { getConditionName, isMedicationActive, frequencyLabel } from '@/lib/medication-utils'

type Member = { id: string; full_name: string }

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
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Pill className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/medications/${medication.id}`}
              className="font-semibold text-base hover:text-primary transition-colors"
            >
              {medication.name}
            </Link>
            <Badge
              className={
                active
                  ? 'bg-green-100 text-green-700 hover:bg-green-100 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }
            >
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {medication.dosage && (
            <p className="text-sm text-muted-foreground mt-0.5">{medication.dosage}</p>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0 size-8 p-0">
          <Link href={`/medications/${medication.id}/edit`} aria-label="Edit medication">
            <Edit className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* Frequency + Condition badges */}
      {(medication.frequency || conditionName) && (
        <div className="flex flex-wrap gap-1.5">
          {medication.frequency && (
            <Badge variant="outline" className="text-xs font-normal">
              {frequencyLabel(medication.frequency)}
            </Badge>
          )}
          {conditionName && (
            <span className="flex items-center text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
              {conditionName}
            </span>
          )}
        </div>
      )}

      {/* Time of day pills */}
      {medication.time_of_day && medication.time_of_day.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {medication.time_of_day.map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-xs rounded-full bg-muted px-2 py-0.5"
            >
              <Clock className="size-3 text-muted-foreground" />
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {medication.prescribed_by && (
          <span className="flex items-center gap-1">
            <User className="size-3" />
            {medication.prescribed_by}
          </span>
        )}
        {medication.start_date && (
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            Started {formatDate(medication.start_date)}
          </span>
        )}
        {medication.end_date ? (
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            Until {formatDate(medication.end_date)}
          </span>
        ) : (
          <span className="text-green-600 font-medium">Ongoing</span>
        )}
      </div>

      {/* Reminder toggle */}
      <div className="flex items-center gap-2 pt-1 border-t">
        <Switch
          checked={reminderOn}
          onCheckedChange={handleReminderToggle}
          disabled={toggling}
          aria-label="Toggle reminder"
        />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {reminderOn ? (
            <Bell className="size-3" />
          ) : (
            <BellOff className="size-3" />
          )}
          {reminderOn ? 'Reminders on' : 'Reminders off'}
        </span>
      </div>
    </div>
  )
}

export function MedicationsView({
  members,
  initialMedications,
  initialMemberId,
}: {
  members: Member[]
  initialMedications: MedicationWithCondition[]
  initialMemberId: string
}) {
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId)
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active')
  const [medications, setMedications] = useState<MedicationWithCondition[]>(initialMedications)
  const [loading, setLoading] = useState(false)

  async function fetchMedications(memberId: string) {
    if (!memberId) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('medications')
        .select(`
          id, name, dosage, frequency, time_of_day,
          start_date, end_date, prescribed_by,
          is_active, reminder_enabled, notes,
          family_member_id, medical_condition_id,
          created_at, updated_at, deleted_at,
          medical_conditions (
            id, custom_name, status, diagnosed_on,
            icd10_conditions (common_name)
          )
        `)
        .eq('family_member_id', memberId)
        .is('deleted_at', null)
        .order('is_active', { ascending: false })
        .order('name', { ascending: true })

      setMedications((data ?? []) as unknown as MedicationWithCondition[])
    } finally {
      setLoading(false)
    }
  }

  function handleMemberChange(memberId: string) {
    setSelectedMemberId(memberId)
    fetchMedications(memberId)
  }

  const filteredMedications =
    statusFilter === 'active'
      ? medications.filter((m) => isMedicationActive(m))
      : medications

  if (members.length === 0) {
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

  return (
    <div className="relative">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={selectedMemberId} onValueChange={handleMemberChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium border-l transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Medication list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 animate-pulse h-36" />
          ))}
        </div>
      ) : filteredMedications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Pill className="size-10 text-muted-foreground mb-3" />
          <p className="font-medium text-sm text-muted-foreground">
            {statusFilter === 'active'
              ? 'No active medications'
              : 'No medications recorded yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMedications.map((med) => (
            <MedicationCard key={med.id} medication={med} />
          ))}
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
