'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Activity,
  FileText,
  Stethoscope,
  Sparkles,
  TrendingUp,
  MapPin,
  Heart,
  UserPlus,
  Upload,
  Pill,
  Share2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react'
import { DoctorVisitFAB } from '@/components/dashboard/DoctorVisitFAB'
import { AddMemberDialog } from '@/components/members/AddMemberDialog'
import HealthEventLogger from '@/components/visits/HealthEventLogger'
import type { FamilyMemberSummary } from '@/components/dashboard/FamilyHealthTabs'

// ── Exported type for page.tsx to use ────────────────────────────────────────

export type TodayMed = {
  id: string
  name: string
  dosage: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  time_of_day: any
  reminder_enabled: boolean
  family_member_id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  family_members: any
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DashboardClientProps {
  familyMembers: FamilyMemberSummary[]
  isOwner: boolean
  pendingSignalsCount: number
  greeting: string
  firstName: string
  todayStr: string
  todaysMeds: TodayMed[]
  latestDocDate: string | null
}

// ── Colours ───────────────────────────────────────────────────────────────────

const MEMBER_COLORS = [
  { bg: '#E1F5EE', text: '#0F6E56', ring: '#0F6E56' },
  { bg: '#FAEEDA', text: '#854F0B', ring: '#854F0B' },
  { bg: '#EEEDFE', text: '#534AB7', ring: '#534AB7' },
  { bg: '#E6F1FB', text: '#185FA5', ring: '#185FA5' },
  { bg: '#FBEAF0', text: '#993556', ring: '#993556' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
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

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diffMs / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

// ── Status badge colours ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  active:     { bg: '#FAEEDA', text: '#633806' },
  chronic:    { bg: '#FAEEDA', text: '#633806' },
  monitoring: { bg: '#E6F1FB', text: '#0C447C' },
  resolved:   { bg: '#F1EFE8', text: '#444441' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="uppercase font-medium tracking-[0.08em] text-gray-400 mb-3" style={{ fontSize: 9 }}>
      {children}
    </p>
  )
}

function ActionBtn({
  icon: Icon,
  label,
  iconBg,
  iconColor,
  dashed,
  onClick,
}: {
  icon: React.ElementType
  label: string
  iconBg: string
  iconColor: string
  dashed?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-[8px] py-2.5 px-1 hover:opacity-80 transition-opacity"
      style={{
        background: dashed ? 'transparent' : undefined,
        border: dashed ? '0.5px dashed #D1D5DB' : 'none',
      }}
    >
      <div
        className="flex items-center justify-center rounded-[6px]"
        style={{ width: 28, height: 28, background: iconBg }}
      >
        <Icon size={14} color={iconColor} />
      </div>
      <span className="text-[9px] text-gray-500 font-medium text-center leading-tight">{label}</span>
    </button>
  )
}

function PhaseSlot({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  phase,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  phase: string
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-[8px] p-[7px_10px]"
      style={{ border: '0.5px dashed #D1D5DB' }}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-[6px]"
        style={{ width: 22, height: 22, background: iconBg }}
      >
        <Icon size={12} color={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-gray-600 leading-tight">{title}</p>
        <p className="text-[8px] text-gray-400 mt-0.5">{phase}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({
  familyMembers,
  isOwner,
  pendingSignalsCount,
  greeting,
  firstName,
  todayStr,
  todaysMeds,
  latestDocDate,
}: DashboardClientProps) {
  const router = useRouter()
  const [showAddMember, setShowAddMember] = useState(false)
  const [showDesktopLogVisit, setShowDesktopLogVisit] = useState(false)
  const [activeMemberIndex, setActiveMemberIndex] = useState(0)
  const [quickExpanded, setQuickExpanded] = useState(false)
  const [reminderExpanded, setReminderExpanded] = useState(false)

  const memberSummaries = familyMembers.map((m) => ({
    id: m.id,
    full_name: m.name,
    relation: m.relation,
  }))

  const totalActiveConditions = familyMembers.reduce((s, m) => s + m.active_conditions_count, 0)
  const reminderMeds = todaysMeds.filter((m) => m.reminder_enabled)
  const reminderCount = reminderMeds.length

  const safeIndex = Math.min(activeMemberIndex, Math.max(0, familyMembers.length - 1))
  const activeMember = familyMembers[safeIndex]

  // Snapshot row — last visit
  const lastVisitLabel = relativeDate(latestDocDate)

  return (
    <>
      {/* ── Desktop top bar ─────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between shrink-0 px-5 bg-white border-b border-gray-100"
        style={{ height: 52 }}>
        <div>
          <p className="font-medium text-gray-800" style={{ fontSize: 13 }}>
            {greeting}, {firstName}
          </p>
          <p className="text-gray-400" style={{ fontSize: 10 }}>{todayStr}</p>
        </div>

        {/* Log Visit button — desktop */}
        <button
          onClick={() => setShowDesktopLogVisit(true)}
          className="relative flex items-center gap-1.5 text-white font-medium hover:opacity-90 transition-opacity"
          style={{
            background: '#0F6E56',
            borderRadius: 20,
            padding: '7px 14px',
            fontSize: 12,
          }}
        >
          <Stethoscope size={13} />
          Log visit
          <span
            className="absolute flex items-center justify-center"
            style={{
              top: -5, right: -5,
              width: 18, height: 18,
              borderRadius: '50%',
              background: '#0F6E56',
              border: '2px solid white',
            }}
          >
            <Sparkles size={10} color="#EF9F27" />
          </span>
        </button>
      </div>

      {/* Desktop Log Visit modal */}
      <HealthEventLogger
        isOpen={showDesktopLogVisit}
        onClose={() => setShowDesktopLogVisit(false)}
        familyMembers={memberSummaries}
        onSuccess={() => { setShowDesktopLogVisit(false); router.refresh() }}
      />

      {/* ── Content area ────────────────────────────────────────── */}
      <div className="bg-gray-50 p-3 flex flex-col" style={{ gap: 10 }}>

        {/* ── Row 1: Snapshot + Quick Actions ─── */}
        <div className="grid gap-[10px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>

          {/* Today's snapshot */}
          <div className="bg-white rounded-[10px] p-[10px_12px]"
            style={{ border: '0.5px solid rgba(0,0,0,0.07)' }}>
            <SectionLabel>Today's Snapshot</SectionLabel>
            <div className="flex flex-col" style={{ gap: 8 }}>

              {/* Reminders */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-[6px] shrink-0"
                  style={{ width: 22, height: 22, background: '#FAEEDA' }}>
                  <Bell size={12} color="#854F0B" />
                </div>
                <p className="flex-1 text-[11px] text-gray-700">
                  {reminderCount > 0 ? `${reminderCount} medication reminder${reminderCount > 1 ? 's' : ''}` : 'No reminders'}
                </p>
                <p className="text-[10px] shrink-0"
                  style={{ color: reminderCount > 0 ? '#854F0B' : '#9CA3AF' }}>
                  {reminderCount > 0 ? 'due today' : 'none today'}
                </p>
              </div>

              {/* Last visit */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-[6px] shrink-0"
                  style={{ width: 22, height: 22, background: '#E1F5EE' }}>
                  <FileText size={12} color="#0F6E56" />
                </div>
                <p className="flex-1 text-[11px] text-gray-700">Last visit logged</p>
                <p className="text-[10px] text-gray-400 shrink-0">{lastVisitLabel}</p>
              </div>

              {/* Active conditions */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-[6px] shrink-0"
                  style={{ width: 22, height: 22, background: '#EEEDFE' }}>
                  <Activity size={12} color="#534AB7" />
                </div>
                <p className="flex-1 text-[11px] text-gray-700">
                  {totalActiveConditions} active condition{totalActiveConditions !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-gray-400 shrink-0">across family</p>
              </div>

            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-[10px] p-[10px_12px]"
            style={{ border: '0.5px solid rgba(0,0,0,0.07)' }}>
            <SectionLabel>Quick Actions</SectionLabel>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              <ActionBtn icon={UserPlus} label="Add Member"   iconBg="#E1F5EE" iconColor="#0F6E56" onClick={() => setShowAddMember(true)} />
              <ActionBtn icon={Upload}   label="Upload Doc"   iconBg="#F3F4F6" iconColor="#374151" onClick={() => router.push('/documents/upload')} />
              <ActionBtn icon={Pill}     label="Add Med"      iconBg="#F3F4F6" iconColor="#374151" onClick={() => router.push('/medications/add')} />
              <ActionBtn icon={Share2}   label="Share"        iconBg="#F3F4F6" iconColor="#374151" onClick={() => router.push('/share')} />
              <ActionBtn
                icon={quickExpanded ? ChevronUp : MoreHorizontal}
                label={quickExpanded ? 'Less' : 'More'}
                iconBg={quickExpanded ? '#E1F5EE' : '#F3F4F6'}
                iconColor={quickExpanded ? '#0F6E56' : '#374151'}
                dashed={!quickExpanded}
                onClick={() => setQuickExpanded((p) => !p)}
              />
            </div>

            {quickExpanded && (
              <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid #F3F4F6' }}>
                <p className="uppercase font-medium tracking-[0.08em] text-gray-400 mb-2" style={{ fontSize: 8 }}>
                  All Actions
                </p>
                {[
                  { icon: Plus, label: 'Add Condition', href: '/members' },
                  { icon: Stethoscope, label: 'Log a Visit', action: () => setShowDesktopLogVisit(true) },
                ].map(({ icon: Icon, label, href, action }) => (
                  <button
                    key={label}
                    onClick={action ?? (() => href && router.push(href))}
                    className="flex items-center gap-2 w-full rounded-[7px] px-2 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center rounded-[6px] shrink-0"
                      style={{ width: 28, height: 28, background: '#F3F4F6' }}>
                      <Icon size={14} color="#374151" />
                    </div>
                    <span className="flex-1 text-[11px] text-gray-700 font-medium text-left">{label}</span>
                    <ChevronRight size={12} color="#9CA3AF" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Smart reminder strip (conditional) ─── */}
        {reminderCount > 0 && (
          <div className="bg-white rounded-[10px] overflow-hidden"
            style={{ border: '0.5px solid rgba(0,0,0,0.07)' }}>

            {/* Header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{
                background: '#FAEEDA',
                borderBottom: '0.5px solid rgba(186,117,23,0.15)',
              }}
            >
              <Bell size={14} color="#854F0B" />
              <p className="flex-1 font-medium" style={{ fontSize: 11, color: '#633806' }}>
                {reminderCount} medication reminder{reminderCount > 1 ? 's' : ''} due today
              </p>
              <button
                onClick={() => setReminderExpanded((p) => !p)}
                className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{ fontSize: 10, color: '#854F0B' }}
              >
                Show {reminderExpanded ? 'less' : 'all'}
                {reminderExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {/* Rows */}
            <div className="px-3 py-[4px]">
              {(reminderExpanded ? reminderMeds : reminderMeds.slice(0, 2)).map((med, i) => {
                const memberColor = MEMBER_COLORS[i % MEMBER_COLORS.length]
                const memberName: string = med.family_members?.full_name ?? '—'
                const times: string[] = Array.isArray(med.time_of_day) ? med.time_of_day : []
                return (
                  <div key={med.id} className="flex items-center gap-2 py-2"
                    style={{ borderBottom: i < (reminderExpanded ? reminderMeds.length - 1 : Math.min(2, reminderMeds.length) - 1) ? '0.5px solid #F3F4F6' : 'none' }}>
                    <div
                      className="flex items-center justify-center rounded-full shrink-0 font-semibold"
                      style={{ width: 20, height: 20, background: memberColor.bg, color: memberColor.text, fontSize: 8 }}
                    >
                      {initials(memberName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 truncate">{med.name}</p>
                      {med.dosage && <p className="text-[9px] text-gray-400">{med.dosage}</p>}
                    </div>
                    <p className="text-[10px] text-gray-400 shrink-0">
                      {times.length > 0 ? times.join(' · ') : 'As needed'}
                    </p>
                  </div>
                )
              })}
              {!reminderExpanded && reminderCount > 2 && (
                <button
                  onClick={() => setReminderExpanded(true)}
                  className="w-full py-2 text-center hover:opacity-70 transition-opacity"
                  style={{ fontSize: 10, color: '#854F0B' }}
                >
                  + {reminderCount - 2} more reminder{reminderCount - 2 > 1 ? 's' : ''} · tap to expand
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Row 3: Member panel ─── */}
        {familyMembers.length > 0 && activeMember && (
          <div className="bg-white rounded-[10px] overflow-hidden"
            style={{ border: '0.5px solid rgba(0,0,0,0.07)' }}>

            {/* Tab row */}
            <div
              className="flex gap-1.5 overflow-x-auto"
              style={{
                padding: '8px 12px',
                borderBottom: '0.5px solid rgba(0,0,0,0.07)',
                scrollbarWidth: 'none',
              }}
            >
              {familyMembers.slice(0, 6).map((m, i) => {
                const active = i === safeIndex
                const color = MEMBER_COLORS[i % MEMBER_COLORS.length]
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMemberIndex(i)}
                    className="flex items-center gap-[5px] rounded-[20px] whitespace-nowrap shrink-0 transition-colors"
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: active ? 500 : 400,
                      background: active ? '#0F6E56' : '#F3F4F6',
                      color: active ? 'white' : '#6B7280',
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full shrink-0 font-semibold"
                      style={{
                        width: 16, height: 16,
                        background: active ? 'rgba(255,255,255,0.25)' : color.bg,
                        color: active ? 'white' : color.text,
                        fontSize: 7,
                      }}
                    >
                      {initials(m.name)}
                    </div>
                    {m.name.split(' ')[0]}
                  </button>
                )
              })}
              {familyMembers.length > 6 && (
                <Link
                  href="/members"
                  className="flex items-center gap-1 rounded-[20px] shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ padding: '4px 10px', fontSize: 11, background: '#F3F4F6' }}
                >
                  +{familyMembers.length - 6} more
                </Link>
              )}
            </div>

            {/* Two-column content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

              {/* Left column — member data */}
              <div className="p-3 space-y-3" style={{ borderRight: '0.5px solid rgba(0,0,0,0.05)' }}>

                {/* Member header */}
                <div className="flex items-start gap-2.5">
                  {activeMember.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeMember.avatar_url}
                      alt={activeMember.name}
                      className="rounded-full shrink-0 object-cover"
                      style={{ width: 34, height: 34 }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center rounded-full shrink-0 font-semibold"
                      style={{
                        width: 34, height: 34,
                        background: MEMBER_COLORS[safeIndex % MEMBER_COLORS.length].bg,
                        color: MEMBER_COLORS[safeIndex % MEMBER_COLORS.length].text,
                        fontSize: 12,
                      }}
                    >
                      {initials(activeMember.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-gray-900 truncate">{activeMember.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {[
                            getAge(activeMember.date_of_birth),
                            activeMember.blood_group,
                            activeMember.relation === 'self' ? 'You' : activeMember.relation,
                          ].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <Link
                        href={`/members/${activeMember.id}`}
                        className="text-[10px] font-medium shrink-0 hover:opacity-70 transition-opacity"
                        style={{ color: '#0F6E56' }}
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Conditions', val: activeMember.conditions_count },
                    { label: 'Medications', val: activeMember.medications_count },
                    { label: 'Documents', val: activeMember.documents_count },
                  ].map(({ label, val }) => (
                    <div key={label} className="rounded-[7px] bg-gray-50 p-[6px] text-center">
                      <p className="font-medium leading-none" style={{ fontSize: 15 }}>{val}</p>
                      <p className="text-gray-400 mt-1" style={{ fontSize: 8 }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Active conditions mini card */}
                <div className="rounded-[7px] bg-gray-50 p-[7px_9px]">
                  <p className="uppercase font-medium tracking-[0.08em] text-gray-400 mb-2" style={{ fontSize: 8 }}>
                    Active Conditions
                  </p>
                  {activeMember.conditions.length === 0 ? (
                    <p className="text-[10px] text-gray-400">No active conditions</p>
                  ) : (
                    <div className="space-y-1.5">
                      {activeMember.conditions.slice(0, 2).map((c) => {
                        const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.active
                        return (
                          <div key={c.id} className="flex items-center gap-2">
                            <div className="rounded-full shrink-0"
                              style={{ width: 6, height: 6, background: '#BA7517' }} />
                            <p className="flex-1 text-[11px] text-gray-800 truncate">{c.condition_name}</p>
                            <span
                              className="text-[8px] font-medium rounded-full px-1.5 py-0.5 shrink-0 capitalize"
                              style={{ background: badge.bg, color: badge.text }}
                            >
                              {c.status}
                            </span>
                          </div>
                        )
                      })}
                      {activeMember.conditions.length > 2 && (
                        <p className="text-[9px] text-gray-400">
                          +{activeMember.conditions.length - 2} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column — health panel (phase slots) */}
              <div className="p-3">
                <p className="uppercase font-medium tracking-[0.08em] text-gray-400 mb-2" style={{ fontSize: 9 }}>
                  Health Panel
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <PhaseSlot icon={Sparkles}   iconBg="#EEEDFE" iconColor="#534AB7" title="AI Summary"       phase="Phase 2" />
                  <PhaseSlot icon={TrendingUp} iconBg="#E6F1FB" iconColor="#185FA5" title="Health Charts"    phase="Phase 3 · IoT" />
                  <PhaseSlot icon={MapPin}     iconBg="#EAF3DE" iconColor="#3B6D11" title="Location Monitor" phase="Phase 4 · GPS" />
                  <PhaseSlot icon={Heart}      iconBg="#FBEAF0" iconColor="#993556" title="Chronic Support"  phase="Phase 4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state — no members */}
        {familyMembers.length === 0 && (
          <div className="bg-white rounded-[10px] p-8 flex flex-col items-center text-center gap-3"
            style={{ border: '0.5px solid rgba(0,0,0,0.07)' }}>
            <div className="size-14 rounded-full bg-teal-50 flex items-center justify-center">
              <UserPlus size={28} color="#0F6E56" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">Welcome to FamilyCare</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Add your first family member to start managing your family health records
              </p>
            </div>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 text-white text-xs font-medium rounded-full px-4 py-2"
              style={{ background: '#0F6E56' }}
            >
              <Plus size={14} />
              Add Family Member
            </button>
          </div>
        )}

        {/* Owner signal notice */}
        {isOwner && pendingSignalsCount > 0 && (
          <div className="bg-white rounded-[10px] p-3 flex items-center gap-3"
            style={{ border: '0.5px solid #E5E7EB' }}>
            <Stethoscope size={16} color="#4F46E5" className="shrink-0" />
            <p className="flex-1 text-[11px] text-gray-700">
              {pendingSignalsCount} condition{pendingSignalsCount > 1 ? 's' : ''} with pending specialist interest
            </p>
            <Link href="/members" className="text-[10px] font-medium shrink-0 flex items-center gap-1"
              style={{ color: '#4F46E5' }}>
              View <ChevronRight size={11} />
            </Link>
          </div>
        )}

      </div>

      {/* ── Mobile FAB (hidden on desktop) ────────────────────── */}
      <DoctorVisitFAB
        members={memberSummaries}
        onSuccess={() => router.refresh()}
        disabled={memberSummaries.length === 0}
      />

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
