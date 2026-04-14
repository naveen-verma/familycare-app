import type { EventType } from '@/types/database'

// ---- Shared types (safe for client components — no server imports) ----

export type TimelineEvent = {
  id: string
  event_type: EventType
  title: string
  event_date: string
  hospital_name: string | null
  doctor_name: string | null
  notes: string | null
  follow_up_date: string | null
  follow_up_sent: boolean
  is_pinned: boolean
  family_member_id: string
  medical_condition_id: string | null
  family_members: {
    id: string
    full_name: string
    relation: string | null
    height_cm: number | null
    weight_kg: number | null
    bmi: number | null
    bmi_date: string | null
  } | null
  medical_conditions: {
    id: string
    custom_name: string | null
    status: string
    diagnosed_on: string | null
    icd10_conditions: {
      common_name: string | null
    } | null
  } | null
}

export type TimelineMonthGroup = {
  year: number
  month: number
  /** "April 2026" */
  label: string
  events: TimelineEvent[]
}

export type TimelineYearGroup = {
  year: number
  months: TimelineMonthGroup[]
}

export type TimelineFamilyMember = {
  id: string
  full_name: string
}

// ---- Unified timeline types (rebuilt timeline — auto-generated from 3 sources) ----

export type UnifiedTimelineSource = 'diagnosis' | 'consultation' | 'document'

export type UnifiedTimelineEvent = {
  /** Unique key for React rendering */
  id: string
  date: string
  source: UnifiedTimelineSource
  /** consultation_type, document_type, or 'diagnosis' */
  eventType: string
  title: string
  doctorName: string | null
  hospitalName: string | null
  conditionName: string | null
  notes: string | null
}

export type UnifiedTimelineMonth = {
  year: number
  month: number
  label: string
  events: UnifiedTimelineEvent[]
}

export type UnifiedTimelineYear = {
  year: number
  months: UnifiedTimelineMonth[]
}

export function groupUnifiedByYearMonth(events: UnifiedTimelineEvent[]): UnifiedTimelineYear[] {
  const yearMap = new Map<number, Map<string, UnifiedTimelineEvent[]>>()

  for (const event of events) {
    const d = new Date(event.date)
    const year = d.getFullYear()
    const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!yearMap.has(year)) yearMap.set(year, new Map())
    const monthMap = yearMap.get(year)!
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, [])
    monthMap.get(monthKey)!.push(event)
  }

  const yearGroups: UnifiedTimelineYear[] = []
  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a)

  for (const year of sortedYears) {
    const monthMap = yearMap.get(year)!
    const sortedMonthKeys = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a))

    const months: UnifiedTimelineMonth[] = sortedMonthKeys.map((key) => {
      const [y, m] = key.split('-').map(Number)
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
      const monthEvents = monthMap.get(key)!
      // Sort newest first within month
      const sorted = [...monthEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      return { year: y, month: m, label, events: sorted }
    })

    yearGroups.push({ year, months })
  }

  return yearGroups
}

// ---- Client-safe grouping helper ----

export function groupEventsByYearMonth(events: TimelineEvent[]): TimelineYearGroup[] {
  const yearMap = new Map<number, Map<string, TimelineEvent[]>>()

  for (const event of events) {
    const d = new Date(event.event_date)
    const year = d.getFullYear()
    const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`

    if (!yearMap.has(year)) yearMap.set(year, new Map())
    const monthMap = yearMap.get(year)!
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, [])
    monthMap.get(monthKey)!.push(event)
  }

  const yearGroups: TimelineYearGroup[] = []

  // Years descending
  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a)

  for (const year of sortedYears) {
    const monthMap = yearMap.get(year)!
    const sortedMonthKeys = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a))

    const months: TimelineMonthGroup[] = sortedMonthKeys.map((key) => {
      const [y, m] = key.split('-').map(Number)
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
      const monthEvents = monthMap.get(key)!
      // Pinned first, then by date descending
      const sorted = [...monthEvents].sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      })
      return { year: y, month: m, label, events: sorted }
    })

    yearGroups.push({ year, months })
  }

  return yearGroups
}
