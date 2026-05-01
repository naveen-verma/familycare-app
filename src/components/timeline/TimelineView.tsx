'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Stethoscope,
  Scissors,
  FlaskConical,
  Syringe,
  Building2,
  Heart,
  Activity,
  FileText,
  AlertCircle,
  ChevronDown,
  Users,
  Pill,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type {
  UnifiedTimelineEvent,
  UnifiedTimelineYear,
  UnifiedTimelineSource,
} from '@/lib/timeline-types'
import { groupUnifiedByYearMonth } from '@/lib/timeline-types'

// ---- Badge config ----

type BadgeConfig = {
  label: string
  badgeClass: string
  dotClass: string
  Icon: React.ElementType
}

const EVENT_CONFIG: Record<string, BadgeConfig> = {
  diagnosis: {
    label: 'Diagnosis',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
    Icon: AlertCircle,
  },
  visit: {
    label: 'Visit',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
    Icon: Stethoscope,
  },
  surgery: {
    label: 'Surgery',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
    Icon: Scissors,
  },
  test: {
    label: 'Test',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
    Icon: FlaskConical,
  },
  vaccination: {
    label: 'Vaccination',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    dotClass: 'bg-green-500',
    Icon: Syringe,
  },
  hospitalization: {
    label: 'Hospitalization',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    dotClass: 'bg-orange-500',
    Icon: Building2,
  },
  therapy: {
    label: 'Therapy',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200',
    dotClass: 'bg-teal-500',
    Icon: Heart,
  },
  document: {
    label: 'Document',
    badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500',
    Icon: FileText,
  },
  medication: {
    label: 'Medication',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200',
    dotClass: 'bg-teal-500',
    Icon: Pill,
  },
  other: {
    label: 'Other',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    dotClass: 'bg-gray-400',
    Icon: Activity,
  },
}

const SOURCE_LABELS: Record<UnifiedTimelineSource, string> = {
  diagnosis: 'Diagnosis',
  consultation: 'Consultation',
  document: 'Document',
}

function getEventConfig(eventType: string): BadgeConfig {
  return EVENT_CONFIG[eventType] ?? EVENT_CONFIG.other
}

// ---- Type filter chips ----

type TypeFilter = 'all' | 'consultation' | 'diagnosis' | 'document' | 'medication'

const TYPE_FILTER_CHIPS: { label: string; value: TypeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Visits', value: 'consultation' },
  { label: 'Diagnoses', value: 'diagnosis' },
  { label: 'Documents', value: 'document' },
  { label: 'Medications', value: 'medication' },
]

// ---- Helpers ----

function formatEventDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function formatEventDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ---- Skeleton ----

function TimelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2].map((year) => (
        <div key={year}>
          <div className="h-7 w-16 bg-muted rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative flex gap-0">
                <div className="flex flex-col items-center mr-3 shrink-0">
                  <div className="size-3 rounded-full bg-muted mt-4 shrink-0" />
                  <div className="flex-1 w-px bg-muted mt-1" />
                </div>
                <div className="flex-1 mb-4">
                  <div className="rounded-xl border bg-card p-3 h-14 bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Event Card (collapsible) ----

function EventCard({
  event,
  isOpen,
  onToggle,
}: {
  event: UnifiedTimelineEvent
  isOpen: boolean
  onToggle: () => void
}) {
  const cfg = getEventConfig(event.eventType)

  return (
    <div className="relative flex gap-0">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center mr-3 shrink-0">
        <div className={`size-3 rounded-full mt-4 shrink-0 z-10 ${cfg.dotClass}`} />
        <div className="flex-1 w-px bg-border mt-1" />
      </div>

      {/* Card */}
      <div className="flex-1 mb-3">
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Collapsed header — always visible, acts as toggle */}
          <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left min-h-[52px] hover:bg-muted/30 transition-colors"
            aria-expanded={isOpen}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 font-normal tabular-nums shrink-0">
                  {formatEventDateShort(event.date)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${cfg.badgeClass}`}
                >
                  <cfg.Icon className="size-3" />
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 leading-snug truncate mt-0.5">
                {event.title}
              </p>
            </div>
            <ChevronDown
              className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Expanded details */}
          {isOpen && (
            <div className="px-3.5 pb-3 space-y-1.5 border-t bg-muted/10">
              <p className="text-xs text-muted-foreground pt-2">
                {formatEventDateFull(event.date)}
              </p>

              {(event.doctorName || event.hospitalName) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {event.doctorName && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Stethoscope className="size-3" />
                      {event.doctorName}
                    </span>
                  )}
                  {event.hospitalName && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="size-3" />
                      {event.hospitalName}
                    </span>
                  )}
                </div>
              )}

              {event.conditionName && event.source !== 'diagnosis' && (
                <p className="text-xs text-muted-foreground">
                  Condition:{' '}
                  <span className="text-foreground font-medium">{event.conditionName}</span>
                </p>
              )}

              {event.notes && (
                <p className="text-xs text-muted-foreground leading-relaxed">{event.notes}</p>
              )}

              <p className="text-[10px] text-muted-foreground text-right pt-0.5">
                From: {SOURCE_LABELS[event.source]}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Month Group ----

function MonthGroup({
  group,
  openEventId,
  onToggle,
}: {
  group: { label: string; events: UnifiedTimelineEvent[] }
  openEventId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-3">{group.label}</p>
      <div>
        {group.events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isOpen={openEventId === event.id}
            onToggle={() => onToggle(event.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ---- Data fetching ----

async function fetchTimelineEvents(memberId: string): Promise<UnifiedTimelineEvent[]> {
  const supabase = createClient()
  const events: UnifiedTimelineEvent[] = []

  // Source 1 — Medical Conditions (diagnoses)
  const conditionsPromise = supabase
    .from('medical_conditions')
    .select(`
      id, diagnosed_on, diagnosed_by, status,
      custom_name, notes,
      icd10_conditions (common_name)
    `)
    .eq('family_member_id', memberId)
    .is('deleted_at', null)
    .not('diagnosed_on', 'is', null)

  // Source 2 — Consultations
  const consultationsPromise = supabase
    .from('condition_consultations')
    .select(`
      id, consultation_date, consultation_type,
      doctor_name, hospital_name, notes, is_pinned,
      medical_conditions!inner (
        family_member_id,
        custom_name,
        icd10_conditions (common_name)
      )
    `)
    .eq('medical_conditions.family_member_id', memberId)
    .is('deleted_at', null)
    .not('consultation_date', 'is', null)

  // Source 3 — Documents
  const documentsPromise = supabase
    .from('documents')
    .select(`
      id, document_date, document_type, title,
      doctor_name, hospital_name,
      medical_conditions (
        custom_name,
        icd10_conditions (common_name)
      )
    `)
    .eq('family_member_id', memberId)
    .is('deleted_at', null)
    .not('document_date', 'is', null)

  const [conditionsRes, consultationsRes, documentsRes] = await Promise.all([
    conditionsPromise,
    consultationsPromise,
    documentsPromise,
  ])

  // Map diagnoses
  for (const c of conditionsRes.data ?? []) {
    const ic = (c.icd10_conditions as unknown as { common_name: string | null } | null)
    const conditionName = ic?.common_name ?? (c as any).custom_name ?? 'Unknown condition'
    events.push({
      id: `diagnosis-${c.id}`,
      date: c.diagnosed_on!,
      source: 'diagnosis',
      eventType: 'diagnosis',
      title: conditionName,
      doctorName: c.diagnosed_by ?? null,
      hospitalName: null,
      conditionName,
      notes: c.notes ?? null,
    })
  }

  // Map consultations
  for (const c of consultationsRes.data ?? []) {
    const mc = (c as any).medical_conditions as {
      custom_name: string | null
      icd10_conditions: { common_name: string | null } | null
    } | null
    const conditionName =
      mc?.icd10_conditions?.common_name ?? mc?.custom_name ?? null
    const typeLabel =
      EVENT_CONFIG[c.consultation_type]?.label ?? c.consultation_type
    events.push({
      id: `consultation-${c.id}`,
      date: c.consultation_date!,
      source: 'consultation',
      eventType: c.consultation_type,
      title: conditionName ? `${typeLabel} — ${conditionName}` : typeLabel,
      doctorName: c.doctor_name ?? null,
      hospitalName: c.hospital_name ?? null,
      conditionName,
      notes: c.notes ?? null,
    })
  }

  // Map documents
  for (const d of documentsRes.data ?? []) {
    const mc = (d as any).medical_conditions as {
      custom_name: string | null
      icd10_conditions: { common_name: string | null } | null
    } | null
    const conditionName =
      mc?.icd10_conditions?.common_name ?? mc?.custom_name ?? null
    events.push({
      id: `document-${d.id}`,
      date: d.document_date!,
      source: 'document',
      eventType: 'document',
      title: d.title,
      doctorName: d.doctor_name ?? null,
      hospitalName: d.hospital_name ?? null,
      conditionName,
      notes: null,
    })
  }

  // Sort all events newest first
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return events
}

// ---- Main TimelineView ----

export function TimelineView({
  members,
  initialMemberId,
}: {
  members: { id: string; full_name: string }[]
  initialMemberId: string
}) {
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId)
  const [events, setEvents] = useState<UnifiedTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const selectedMember = members.find((m) => m.id === selectedMemberId)

  const loadEvents = useCallback(async (memberId: string) => {
    setLoading(true)
    setFetchError(null)
    setOpenEventId(null)
    try {
      const data = await fetchTimelineEvents(memberId)
      setEvents(data)
    } catch {
      setFetchError('Failed to load timeline. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents(selectedMemberId)
  }, [selectedMemberId, loadEvents])

  function handleToggleEvent(eventId: string) {
    setOpenEventId((prev) => (prev === eventId ? null : eventId))
  }

  // Apply type filter
  const filteredEvents = events.filter((e) => {
    if (typeFilter === 'all') return true
    if (typeFilter === 'medication') return e.source === 'medication' as any
    return e.source === typeFilter
  })

  const yearGroups: UnifiedTimelineYear[] = groupUnifiedByYearMonth(filteredEvents)

  return (
    <div>
      {/* Member selector */}
      <div className="mb-4">
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="w-full sm:w-56">
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
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TYPE_FILTER_CHIPS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTypeFilter(value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px] ${
              typeFilter === value
                ? 'bg-teal-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && <TimelineSkeleton />}

      {/* Error state */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="size-10 text-destructive mb-3" />
          <p className="text-sm font-medium text-destructive">{fetchError}</p>
          <button
            type="button"
            onClick={() => loadEvents(selectedMemberId)}
            className="mt-3 text-sm text-primary underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && filteredEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="size-12 text-muted-foreground mb-3" />
          <p className="font-medium text-sm">
            {typeFilter === 'all'
              ? `No health history recorded for ${selectedMember?.full_name ?? 'this member'} yet.`
              : `No ${TYPE_FILTER_CHIPS.find((c) => c.value === typeFilter)?.label.toLowerCase()} recorded yet.`}
          </p>
          {typeFilter === 'all' && (
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Start by adding a medical condition on the Family page.
            </p>
          )}
          {typeFilter === 'all' && (
            <Link
              href="/members"
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
            >
              Go to Family page
            </Link>
          )}
        </div>
      )}

      {/* Year groups */}
      {!loading && !fetchError && yearGroups.map((yearGroup) => (
        <div key={yearGroup.year} className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-4">{yearGroup.year}</h2>
          <div className="space-y-6">
            {yearGroup.months.map((monthGroup) => (
              <MonthGroup
                key={`${yearGroup.year}-${monthGroup.month}`}
                group={monthGroup}
                openEventId={openEventId}
                onToggle={handleToggleEvent}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
