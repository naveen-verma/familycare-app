import { createClient } from '@/lib/supabase/server'
import { getFamilyMembers } from '@/lib/members'
import Link from 'next/link'
import { Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardClient } from './DashboardClient'
import type { FamilyMemberSummary } from '@/components/dashboard/FamilyHealthTabs'
import type { TodayMed } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Phase 1: profile + members + auth user in parallel
  const [{ data: profileData }, members, { data: { user: authUser } }] = await Promise.all([
    supabase.rpc('get_current_user_profile'),
    getFamilyMembers(),
    supabase.auth.getUser(),
  ])

  const profile = profileData as { full_name: string; role: string } | null
  const isOwner = profile?.role === 'owner'

  // Resolve first name
  const rawName = profile?.full_name?.trim()
  let firstName: string
  if (rawName && rawName !== 'New User') {
    const first = rawName.split(' ')[0]
    firstName = first.charAt(0).toUpperCase() + first.slice(1)
  } else {
    const metaName = (
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      ''
    ).trim()
    if (metaName) {
      const first = metaName.split(' ')[0]
      firstName = first.charAt(0).toUpperCase() + first.slice(1)
    } else {
      firstName = 'there'
    }
  }

  // Greeting based on IST
  const istHour = parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    })
  )
  const greeting =
    istHour >= 5 && istHour < 12
      ? 'Good morning'
      : istHour >= 12 && istHour < 17
        ? 'Good afternoon'
        : istHour >= 17 && istHour < 21
          ? 'Good evening'
          : 'Good night'

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })

  // Empty state — no family members yet
  if (members.length === 0) {
    return (
      <>
        {/* Top bar for empty state */}
        <div className="hidden md:flex items-center justify-between shrink-0 px-5 bg-white border-b border-gray-100" style={{ height: 52 }}>
          <div>
            <p className="font-medium text-gray-800 text-[13px]">{greeting}, {firstName}</p>
            <p className="text-gray-400 text-[10px]">{todayStr}</p>
          </div>
        </div>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-muted">
            <div className="size-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Users className="size-8 text-indigo-500" />
            </div>
            <h2 className="font-heading font-semibold text-lg mb-1">Welcome to FamilyCare</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Start by adding your first family member to set up your health command centre
            </p>
            <Button asChild>
              <Link href="/members/new">
                <UserPlus className="size-4 mr-2" />
                Add Family Member
              </Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const memberIds = members.map((m) => m.id)
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Phase 2: data queries in parallel
  const [
    { data: criticalRaw },
    { data: medsRaw },
    { data: allDocsRaw },
  ] = await Promise.all([
    // Active conditions (for critical-condition badge check)
    supabase
      .from('medical_conditions')
      .select('id, custom_name, status, family_member_id, icd10_conditions(common_name, is_critical)')
      .in('family_member_id', memberIds)
      .in('status', ['active', 'chronic'])
      .is('deleted_at', null)
      .limit(50),

    // All active medications — passed as reminder strip data
    supabase
      .from('medications')
      .select('id, name, dosage, time_of_day, reminder_enabled, family_member_id, family_members(full_name)')
      .in('family_member_id', memberIds)
      .eq('is_active', true)
      .or('end_date.is.null,end_date.gte.' + today)
      .or('start_date.is.null,start_date.lte.' + today)
      .is('deleted_at', null)
      .order('name'),

    // Documents: family_member_id + created_at for count + last visit date
    supabase
      .from('documents')
      .select('family_member_id, created_at')
      .in('family_member_id', memberIds)
      .is('deleted_at', null),
  ])

  // Phase 3: owner-only interest signals count
  let pendingSignalsCount = 0
  if (isOwner) {
    const { count } = await supabase
      .from('interest_signals')
      .select('id', { count: 'exact', head: true })
      .eq('digest_included', false)
    pendingSignalsCount = count ?? 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (v: unknown) => v as any

  // ── Per-member counts + latest doc date ──────────────────────────────────────
  const medCountByMember: Record<string, number> = {}
  for (const med of medsRaw ?? []) {
    const mid = r(med).family_member_id as string
    medCountByMember[mid] = (medCountByMember[mid] ?? 0) + 1
  }

  const docCountByMember: Record<string, number> = {}
  let latestDocDate: string | null = null
  for (const doc of allDocsRaw ?? []) {
    const mid = r(doc).family_member_id as string
    docCountByMember[mid] = (docCountByMember[mid] ?? 0) + 1
    const dt = r(doc).created_at as string | null
    if (dt && (!latestDocDate || dt > latestDocDate)) latestDocDate = dt
  }

  // ── Family member summaries ──────────────────────────────────────────────────
  const familyMemberSummaries: FamilyMemberSummary[] = members.map((m) => {
    const activeConditions = m.medical_conditions.filter(
      (c) => !c.deleted_at && ['active', 'chronic', 'monitoring'].includes(c.status)
    )
    return {
      id: m.id,
      name: m.full_name,
      relation: m.relation,
      date_of_birth: m.date_of_birth,
      blood_group: m.blood_group,
      gender: m.gender,
      is_primary: m.is_primary,
      avatar_url: m.avatar_url ?? null,
      conditions_count: m.medical_conditions.filter((c) => !c.deleted_at).length,
      active_conditions_count: activeConditions.length,
      medications_count: medCountByMember[m.id] ?? 0,
      documents_count: docCountByMember[m.id] ?? 0,
      conditions: activeConditions.slice(0, 3).map((c) => ({
        id: c.id,
        condition_name: c.icd10_conditions?.common_name ?? c.custom_name ?? 'Unknown',
        status: c.status,
        diagnosed_on: c.diagnosed_on,
      })),
      last_event_date: null,
    }
  })

  return (
    <DashboardClient
      familyMembers={familyMemberSummaries}
      isOwner={isOwner}
      pendingSignalsCount={pendingSignalsCount}
      greeting={greeting}
      firstName={firstName}
      todayStr={todayStr}
      todaysMeds={(medsRaw ?? []) as unknown as TodayMed[]}
      latestDocDate={latestDocDate}
    />
  )
}
