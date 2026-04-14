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

// ---- Helpers ----

function formatEventDate(dateStr: string): string {
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
                  <div className="rounded-xl border bg-card p-3.5 space-y-2">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded-full" />
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Event Card ----

function EventCard({ event }: { event: UnifiedTimelineEvent }) {
  const cfg = getEventConfig(event.eventType)
  const [notesExpanded, setNotesExpanded] = useState(false)

  return (
    <div className="relative flex gap-0">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center mr-3 shrink-0">
        <div className={`size-3 rounded-full mt-4 shrink-0 z-10 ${cfg.dotClass}`} />
        <div className="flex-1 w-px bg-border mt-1" />
      </div>

      {/* Card */}
      <div className="flex-1 mb-4">
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Header */}
          <div className="p-3.5 pb-2 space-y-1.5">
            {/* Date */}
            <p className="text-xs text-muted-foreground">{formatEventDate(event.date)}</p>

            {/* Type badge */}
            <span
              className={`inline-flex h-5 items-center gap-1 rounded-full border px-2 text-xs font-medium ${cfg.badgeClass}`}
            >
              <cfg.Icon className="size-3" />
              {cfg.label}
            </span>

            {/* Title */}
            <p className="text-sm font-semibold leading-snug">{event.title}</p>
          </div>

          {/* Meta */}
          <div className="px-3.5 pb-3 space-y-1">
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
              <div>
                <p
                  className={`text-xs text-muted-foreground leading-relaxed cursor-pointer ${notesExpanded ? '' : 'line-clamp-2'}`}
                  onClick={() => setNotesExpanded((p) => !p)}
                >
                  {event.notes}
                </p>
                {event.notes.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setNotesExpanded((p) => !p)}
                    className="flex items-center gap-0.5 text-xs text-primary mt-0.5"
                  >
                    <ChevronDown
                      className={`size-3 transition-transform ${notesExpanded ? 'rotate-180' : ''}`}
                    />
                    {notesExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* Source tag */}
            <p className="text-[10px] text-muted-foreground text-right pt-0.5">
              From: {SOURCE_LABELS[event.source]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Month Group ----

function MonthGroup({ group }: { group: { label: string; events: UnifiedTimelineEvent[] } }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-3">{group.label}</p>
      <div>
        {group.events.map((event) => (
          <EventCard key={event.id} event={event} />
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

  const selectedMember = members.find((m) => m.id === selectedMemberId)

  const loadEvents = useCallback(async (memberId: string) => {
    setLoading(true)
    setFetchError(null)
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

  const yearGroups: UnifiedTimelineYear[] = groupUnifiedByYearMonth(events)

  return (
    <div>
      {/* Member selector */}
      <div className="mb-6">
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
      {!loading && !fetchError && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="size-12 text-muted-foreground mb-3" />
          <p className="font-medium text-sm">
            No health history recorded for {selectedMember?.full_name ?? 'this member'} yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Start by adding a medical condition on the Family page.
          </p>
          <Link
            href="/members"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Go to Family page
          </Link>
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
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
