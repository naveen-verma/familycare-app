import { createClient } from '@/lib/supabase/server'
import { getFamilyMembers } from '@/lib/members'
import Link from 'next/link'
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  Pill,
  FileText,
  Plus,
  Share2,
  Users,
  ChevronRight,
  Activity,
  MicroscopeIcon,
  UserPlus,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const avatarColors: Record<string, string> = {
  self: 'bg-blue-100 text-blue-700',
  spouse: 'bg-pink-100 text-pink-700',
  child: 'bg-green-100 text-green-700',
  parent: 'bg-purple-100 text-purple-700',
  sibling: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Phase 1: profile + members in parallel
  const [{ data: profileData }, members] = await Promise.all([
    supabase.rpc('get_current_user_profile'),
    getFamilyMembers(),
  ])

  const profile = profileData as { full_name: string; role: string } | null
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const isOwner = profile?.role === 'owner'

  // Greeting based on IST (Indian users)
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
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-semibold">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{todayStr}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-muted">
          <div className="size-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <Users className="size-8 text-indigo-500" />
          </div>
          <h2 className="font-heading font-semibold text-lg mb-1">
            Welcome to FamilyCare 👋
          </h2>
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
    )
  }

  const memberIds = members.map((m) => m.id)
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const in24h = new Date(now.getTime() + 24 * 3600000).toISOString()

  // Phase 2: all data queries in parallel
  const [
    { data: overdueRaw },
    { data: expiringRaw },
    { data: criticalRaw },
    { data: medsRaw },
    { data: recentDocsRaw },
    { data: recentCondRaw },
  ] = await Promise.all([
    // Overdue follow-ups
    supabase
      .from('medical_events')
      .select('id, title, follow_up_date, family_member_id, family_members(full_name)')
      .in('family_member_id', memberIds)
      .lt('follow_up_date', today)
      .eq('follow_up_sent', false)
      .is('deleted_at', null)
      .order('follow_up_date', { ascending: true })
      .limit(5),

    // Share links expiring in next 24 hours
    supabase
      .from('share_links')
      .select('id, expires_at, family_member_id, family_members(full_name)')
      .in('family_member_id', memberIds)
      .eq('is_active', true)
      .gt('expires_at', now.toISOString())
      .lt('expires_at', in24h)
      .limit(5),

    // Active conditions — filter for critical client-side after join
    supabase
      .from('medical_conditions')
      .select(
        'id, custom_name, status, family_member_id, family_members(full_name), icd10_conditions(common_name, is_critical)'
      )
      .in('family_member_id', memberIds)
      .in('status', ['active', 'chronic'])
      .is('deleted_at', null)
      .limit(50),

    // All active medications (used for today's section + snapshot counts)
    supabase
      .from('medications')
      .select(
        'id, name, dosage, time_of_day, reminder_enabled, family_member_id, family_members(full_name)'
      )
      .in('family_member_id', memberIds)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),

    // Recent documents (activity feed + last-per-member)
    supabase
      .from('documents')
      .select('id, title, family_member_id, created_at, family_members(full_name)')
      .in('family_member_id', memberIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),

    // Recent conditions added (activity feed)
    supabase
      .from('medical_conditions')
      .select(
        'id, custom_name, family_member_id, created_at, family_members(full_name), icd10_conditions(common_name)'
      )
      .in('family_member_id', memberIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
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

  // ── Process alerts ──────────────────────────────────────────────────────────

  type AlertItem =
    | { type: 'overdue'; id: string; memberName: string; title: string; date: string }
    | { type: 'expiring'; id: string; memberName: string; expiresAt: string }
    | { type: 'critical'; id: string; memberName: string; conditionName: string }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (v: unknown) => v as any

  const criticalConditions = (criticalRaw ?? [])
    .filter((c) => r(c).icd10_conditions?.is_critical)
    .slice(0, 5)

  const alerts: AlertItem[] = [
    ...(overdueRaw ?? []).map((f) => ({
      type: 'overdue' as const,
      id: f.id,
      memberName: r(f).family_members?.full_name ?? '—',
      title: r(f).title,
      date: r(f).follow_up_date,
    })),
    ...(expiringRaw ?? []).map((l) => ({
      type: 'expiring' as const,
      id: l.id,
      memberName: r(l).family_members?.full_name ?? '—',
      expiresAt: r(l).expires_at,
    })),
    ...criticalConditions.map((c) => ({
      type: 'critical' as const,
      id: c.id,
      memberName: r(c).family_members?.full_name ?? '—',
      conditionName: r(c).icd10_conditions?.common_name ?? r(c).custom_name ?? 'Unknown',
    })),
  ].slice(0, 5)

  const totalAlertCount =
    (overdueRaw?.length ?? 0) + (expiringRaw?.length ?? 0) + criticalConditions.length

  // ── Process medications ─────────────────────────────────────────────────────

  const todaysMeds = (medsRaw ?? []).filter((m) => r(m).reminder_enabled)

  const medCountByMember: Record<string, number> = {}
  for (const med of medsRaw ?? []) {
    const mid = r(med).family_member_id as string
    medCountByMember[mid] = (medCountByMember[mid] ?? 0) + 1
  }

  // ── Last document per member ────────────────────────────────────────────────

  const lastDocByMember: Record<string, string> = {}
  for (const doc of recentDocsRaw ?? []) {
    const mid = r(doc).family_member_id as string
    if (!lastDocByMember[mid]) lastDocByMember[mid] = r(doc).created_at
  }

  // ── Activity feed ───────────────────────────────────────────────────────────

  type ActivityItem = {
    key: string
    type: 'document' | 'condition'
    description: string
    memberName: string
    createdAt: string
  }

  const activityItems: ActivityItem[] = [
    ...(recentDocsRaw ?? []).slice(0, 5).map((d) => ({
      key: `doc-${d.id}`,
      type: 'document' as const,
      description: `${r(d).title} uploaded`,
      memberName: r(d).family_members?.full_name ?? '—',
      createdAt: r(d).created_at,
    })),
    ...(recentCondRaw ?? []).map((c) => ({
      key: `cond-${c.id}`,
      type: 'condition' as const,
      description: `${r(c).icd10_conditions?.common_name ?? r(c).custom_name ?? 'Condition'} added`,
      memberName: r(c).family_members?.full_name ?? '—',
      createdAt: r(c).created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's your family health summary
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{todayStr}</p>
      </div>

      {/* ── Section 1: Health Alerts ── */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Health Alerts
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => {
              if (alert.type === 'overdue') {
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
                  >
                    <AlertTriangle className="size-4 text-red-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-900 leading-snug">
                        Overdue: {alert.title} for {alert.memberName}
                      </p>
                      <p className="text-xs text-red-700 mt-0.5">
                        Was due on {fmtDate(alert.date)}
                      </p>
                    </div>
                  </div>
                )
              }
              if (alert.type === 'expiring') {
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3.5"
                  >
                    <Clock className="size-4 text-yellow-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-yellow-900 leading-snug">
                        Share link for {alert.memberName} expires soon
                      </p>
                      <p className="text-xs text-yellow-700 mt-0.5">
                        Expires {fmtDate(alert.expiresAt)}
                      </p>
                    </div>
                  </div>
                )
              }
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3.5"
                >
                  <AlertCircle className="size-4 text-orange-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-orange-900 leading-snug">
                      {alert.memberName} has an active critical condition
                    </p>
                    <p className="text-xs text-orange-700 mt-0.5">{alert.conditionName}</p>
                  </div>
                </div>
              )
            })}
            {totalAlertCount > 5 && (
              <Link
                href="/members"
                className="flex items-center gap-1 pl-1 text-xs text-indigo-600 hover:underline"
              >
                View all alerts <ChevronRight className="size-3" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── Section 2: Today's Medications ── */}
      {todaysMeds.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today's Medications
            </h2>
            <Link
              href="/medications"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="size-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-6 md:px-6">
            {todaysMeds.map((med) => {
              const timeList = (r(med).time_of_day as string[] | null) ?? []
              return (
                <div
                  key={med.id}
                  className="flex-shrink-0 rounded-xl border bg-white p-3 w-44"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <Pill className="size-4 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium leading-tight line-clamp-2 flex-1 min-w-0">
                      {r(med).name}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {r(med).family_members?.full_name ?? '—'}
                  </p>
                  {r(med).dosage && (
                    <p className="text-xs text-muted-foreground">{r(med).dosage}</p>
                  )}
                  {timeList.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeList.join(' · ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Section 3: Family Health Snapshot ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Family Health Snapshot
          </h2>
          <Link
            href="/members"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
          >
            Manage <ChevronRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {members.map((member) => {
            const initials = getInitials(member.full_name)
            const color = avatarColors[member.relation ?? 'other'] ?? avatarColors.other
            const activeConditions = member.medical_conditions.filter(
              (c) => c.status === 'active' || c.status === 'chronic'
            ).length
            const activeMeds = medCountByMember[member.id] ?? 0
            const lastDoc = lastDocByMember[member.id]

            return (
              <div key={member.id} className="rounded-xl border bg-white p-3.5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={`size-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs ${color}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.relation === 'self' ? 'You' : (member.relation ?? '—')}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conditions</span>
                    <span className="font-medium">{activeConditions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Medications</span>
                    <span className="font-medium">{activeMeds}</span>
                  </div>
                  {lastDoc && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last doc</span>
                      <span className="font-medium">{fmtDate(lastDoc)}</span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/members/${member.id}`}
                  className="block text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg py-1.5 transition-colors"
                >
                  View →
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 4: Recent Activity ── */}
      {activityItems.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Recent Activity
          </h2>
          <div className="rounded-xl border bg-white divide-y">
            {activityItems.map((item) => {
              const Icon = item.type === 'document' ? FileText : Activity
              return (
                <div key={item.key} className="flex items-center gap-3 px-4 py-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.memberName} · {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Section 5: Second Opinion Requests (owner only) ── */}
      {isOwner && pendingSignalsCount > 0 && (
        <section>
          <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <MicroscopeIcon className="size-5 text-indigo-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-900">
                {pendingSignalsCount} condition
                {pendingSignalsCount > 1 ? 's' : ''} pending specialist review
              </p>
            </div>
            <Link
              href="/members"
              className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1 shrink-0"
            >
              View <ChevronRight className="size-3" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Section 6: Quick Actions ── */}
      <section className="pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Actions
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-6 md:px-6">
          {(
            [
              { label: 'Add Member', href: '/members/new', Icon: UserPlus },
              { label: 'Add Condition', href: '/members', Icon: Plus },
              { label: 'Upload Doc', href: '/documents', Icon: Upload },
              { label: 'Add Medication', href: '/medications', Icon: Pill },
              { label: 'Share Records', href: '/members', Icon: Share2 },
            ] as const
          ).map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex-shrink-0 flex flex-col items-center gap-2 rounded-xl border bg-white p-3.5 hover:border-indigo-200 hover:bg-indigo-50 transition-colors min-w-[88px]"
            >
              <div className="size-9 rounded-full bg-indigo-100 flex items-center justify-center">
                <Icon className="size-4 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
