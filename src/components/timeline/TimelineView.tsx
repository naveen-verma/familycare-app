'use client'

import { useState, useEffect } from 'react'
import { Activity, Stethoscope, FileText, Pill, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────

type EventType = 'diagnosis' | 'visit' | 'document' | 'medication'

type HorizontalTimelineEvent = {
  id: string
  date: string
  year: number
  month: number
  type: EventType
  title: string
  subtitle: string
  member_id: string
}

// ── Event config ───────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<EventType, {
  bg: string
  color: string
  Icon: React.ElementType
  label: string
}> = {
  diagnosis:  { bg: '#FCEBEB', color: '#791F1F', Icon: Activity,    label: 'Diagnosis'  },
  visit:      { bg: '#E1F5EE', color: '#085041', Icon: Stethoscope, label: 'Visit'       },
  document:   { bg: '#E6F1FB', color: '#0C447C', Icon: FileText,    label: 'Document'    },
  medication: { bg: '#EEEDFE', color: '#3C3489', Icon: Pill,        label: 'Medication'  },
}

const AVATAR_COLORS = ['#0D9488', '#7F77DD', '#D85A30', '#1D9E75', '#D4537E', '#378ADD']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const FILTER_CHIPS: { label: string; value: EventType | 'all' }[] = [
  { label: 'All',         value: 'all'        },
  { label: 'Diagnoses',   value: 'diagnosis'  },
  { label: 'Visits',      value: 'visit'      },
  { label: 'Documents',   value: 'document'   },
  { label: 'Medications', value: 'medication' },
]

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchMemberEvents(memberId: string): Promise<HorizontalTimelineEvent[]> {
  const supabase = createClient()
  const events: HorizontalTimelineEvent[] = []

  const [condRes, consultRes, docRes, medRes] = await Promise.all([
    supabase
      .from('medical_conditions')
      .select('id, diagnosed_on, custom_name, status, icd10_conditions(common_name)')
      .eq('family_member_id', memberId)
      .is('deleted_at', null)
      .not('diagnosed_on', 'is', null),

    supabase
      .from('condition_consultations')
      .select(`
        id, consultation_date, consultation_type, doctor_name, hospital_name,
        medical_conditions!inner(family_member_id, custom_name, icd10_conditions(common_name))
      `)
      .eq('medical_conditions.family_member_id', memberId)
      .is('deleted_at', null)
      .not('consultation_date', 'is', null),

    supabase
      .from('documents')
      .select('id, document_date, title, document_type')
      .eq('family_member_id', memberId)
      .is('deleted_at', null)
      .not('document_date', 'is', null),

    supabase
      .from('medications')
      .select('id, start_date, name, dosage')
      .eq('family_member_id', memberId)
      .is('deleted_at', null)
      .not('start_date', 'is', null),
  ])

  for (const c of condRes.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ic = (c.icd10_conditions as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = ic?.common_name ?? (c as any).custom_name ?? 'Unknown condition'
    const d = new Date(c.diagnosed_on!)
    events.push({
      id: `diag-${c.id}`,
      date: c.diagnosed_on!,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      type: 'diagnosis',
      title: name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subtitle: (c as any).status ?? '',
      member_id: memberId,
    })
  }

  for (const c of consultRes.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mc = (c as any).medical_conditions
    const condName = mc?.icd10_conditions?.common_name ?? mc?.custom_name ?? ''
    const d = new Date(c.consultation_date!)
    events.push({
      id: `consult-${c.id}`,
      date: c.consultation_date!,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      type: 'visit',
      title: condName || (c.consultation_type ?? 'Visit'),
      subtitle: c.doctor_name ?? c.hospital_name ?? '',
      member_id: memberId,
    })
  }

  for (const d of docRes.data ?? []) {
    const dt = new Date(d.document_date!)
    events.push({
      id: `doc-${d.id}`,
      date: d.document_date!,
      year: dt.getFullYear(),
      month: dt.getMonth() + 1,
      type: 'document',
      title: d.title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subtitle: (d as any).document_type ?? '',
      member_id: memberId,
    })
  }

  for (const m of medRes.data ?? []) {
    const dt = new Date(m.start_date!)
    events.push({
      id: `med-${m.id}`,
      date: m.start_date!,
      year: dt.getFullYear(),
      month: dt.getMonth() + 1,
      type: 'medication',
      title: m.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subtitle: (m as any).dosage ?? '',
      member_id: memberId,
    })
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EventPill({ event }: { event: HorizontalTimelineEvent }) {
  const cfg = EVENT_CONFIG[event.type]
  const Icon = cfg.Icon
  return (
    <div className="flex flex-col items-start">
      {/* Date chip */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: cfg.bg }}
        >
          <Icon className="size-2.5" style={{ color: cfg.color }} />
        </div>
        <span className="text-[11px] text-gray-500 whitespace-nowrap">{fmtDate(event.date)}</span>
      </div>
      {/* Connector */}
      <div className="w-px h-2 bg-gray-200 ml-[19px]" />
      {/* Label pill */}
      <div
        className="rounded-lg px-2.5 py-1.5 max-w-[130px]"
        style={{ backgroundColor: cfg.bg }}
      >
        <p
          className="text-[13px] font-medium leading-tight truncate"
          style={{ color: cfg.color }}
        >
          {event.title}
        </p>
        {event.subtitle && (
          <p
            className="text-[10px] leading-tight truncate mt-0.5"
            style={{ color: cfg.color, opacity: 0.7 }}
          >
            {event.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function TimelineView({
  members,
  initialMemberId,
}: {
  members: { id: string; full_name: string }[]
  initialMemberId: string
}) {
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId)
  const [allEvents, setAllEvents] = useState<Map<string, HorizontalTimelineEvent[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all')

  // Fetch ALL members' events once on mount for instant switching
  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const results = await Promise.all(
          members.map(async (m) => {
            const events = await fetchMemberEvents(m.id)
            return [m.id, events] as [string, HorizontalTimelineEvent[]]
          })
        )
        setAllEvents(new Map(results))
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset year drill-down when member or filter changes
  useEffect(() => { setSelectedYear(null) }, [activeMemberId, activeFilter])

  // Build filtered + grouped data
  const memberEvents = allEvents.get(activeMemberId) ?? []
  const filteredEvents = activeFilter === 'all'
    ? memberEvents
    : memberEvents.filter(e => e.type === activeFilter)

  const eventsByYear: Record<number, HorizontalTimelineEvent[]> = {}
  for (const event of filteredEvents) {
    if (!eventsByYear[event.year]) eventsByYear[event.year] = []
    eventsByYear[event.year].push(event)
  }
  const years = Object.keys(eventsByYear).map(Number).sort((a, b) => b - a)

  // Month breakdown for selected year
  const selectedYearEvents = selectedYear ? (eventsByYear[selectedYear] ?? []) : []
  const eventsByMonth: Record<number, HorizontalTimelineEvent[]> = {}
  for (const event of selectedYearEvents) {
    if (!eventsByMonth[event.month]) eventsByMonth[event.month] = []
    eventsByMonth[event.month].push(event)
  }

  const activeMember = members.find(m => m.id === activeMemberId)
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-5">

      {/* ── Member switcher ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {members.map((m, i) => {
          const isActive = m.id === activeMemberId
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
          return (
            <button
              key={m.id}
              onClick={() => setActiveMemberId(m.id)}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px] ${
                isActive
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : color }}
              >
                {getInitials(m.full_name)}
              </div>
              {m.full_name.split(' ')[0]}
            </button>
          )
        })}
      </div>

      {/* ── Type filter chips ── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map(({ label, value }) => {
          const isActive = activeFilter === value
          return (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[32px] ${
                isActive
                  ? 'border-teal-600 text-teal-700 bg-teal-50'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Month drill-down ── */}
      {!loading && selectedYear !== null && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium">{selectedYear} — month by month</p>
            <button
              onClick={() => setSelectedYear(null)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              Close <X className="size-3" />
            </button>
          </div>
          <div
            className="overflow-x-auto px-4 py-4"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            <div className="flex gap-4 min-w-max">
              {MONTHS.map((monthName, idx) => {
                const monthNum = idx + 1
                const monthEvents = eventsByMonth[monthNum] ?? []
                const hasEvents = monthEvents.length > 0
                return (
                  <div key={monthNum} className="flex flex-col items-center gap-1.5 min-w-[44px]">
                    <span className="text-[10px] text-gray-400">{monthName}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${hasEvents ? 'bg-teal-500' : 'bg-gray-200'}`} />
                    <div className="flex flex-col gap-0.5 max-w-[60px]">
                      {monthEvents.slice(0, 2).map(e => {
                        const cfg = EVENT_CONFIG[e.type]
                        return (
                          <span
                            key={e.id}
                            className="text-[9px] font-medium leading-tight truncate"
                            style={{ color: cfg.color }}
                          >
                            {e.title}
                          </span>
                        )
                      })}
                      {monthEvents.length > 2 && (
                        <span className="text-[9px] text-gray-400">+{monthEvents.length - 2}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filteredEvents.length === 0 && (
        <div className="flex flex-col items-center gap-2.5 py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock className="size-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">
            No health events recorded for{' '}
            {activeMember?.full_name ?? 'this member'}
          </p>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
            Events are added automatically when you log visits, add conditions,
            upload documents or add medications
          </p>
        </div>
      )}

      {/* ── Year rows ── */}
      {!loading && years.map((year, yi) => {
        const yearEvents = eventsByYear[year]
        const isCurrentYear = year === currentYear
        const isLastYear = yi === years.length - 1
        return (
          <div key={year} className="flex gap-3">
            {/* Year label + stem */}
            <div className="flex flex-col items-center shrink-0" style={{ width: 44 }}>
              <button
                onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                className={`text-[13px] font-medium leading-tight w-full text-right transition-colors ${
                  isCurrentYear
                    ? 'text-teal-600'
                    : selectedYear === year
                      ? 'text-teal-500'
                      : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {year}
              </button>
              <div className="mt-2 w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
              {!isLastYear && (
                <div className="flex-1 w-px bg-gray-200 mt-1 min-h-[16px]" />
              )}
            </div>

            {/* Event pills */}
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap gap-3 pt-0.5">
                {yearEvents.map(event => (
                  <EventPill key={event.id} event={event} />
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {/* ── Legend ── */}
      {!loading && filteredEvents.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                <span className="text-[10px] text-gray-400">{cfg.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => years.length > 0 && setSelectedYear(years[0])}
            className="text-[11px] text-teal-600 hover:underline shrink-0 ml-3"
          >
            Tap a year to see months →
          </button>
        </div>
      )}

    </div>
  )
}
