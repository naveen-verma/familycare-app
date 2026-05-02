'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, MicroscopeIcon } from 'lucide-react'
import { FamilyHealthSnapshot, type MemberSnapshot } from '@/components/dashboard/FamilyHealthSnapshot'
import { RecentActivityFeed, type ActivityItem } from '@/components/dashboard/RecentActivityFeed'
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar'
import { AddMemberDialog } from '@/components/members/AddMemberDialog'
import { DoctorVisitFAB } from '@/components/dashboard/DoctorVisitFAB'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  memberSnapshots: MemberSnapshot[]
  activityItems: ActivityItem[]
  isOwner: boolean
  pendingSignalsCount: number
}

export function DashboardClient({
  memberSnapshots,
  activityItems,
  isOwner,
  pendingSignalsCount,
}: DashboardClientProps) {
  const [showAddMember, setShowAddMember] = useState(false)
  const router = useRouter()

  const memberSummaries = memberSnapshots.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    relation: m.relation,
  }))

  return (
    <>
      <FamilyHealthSnapshot snapshots={memberSnapshots} />
      <RecentActivityFeed items={activityItems} />
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
      <QuickActionsBar
        members={memberSummaries}
        onAddMember={() => setShowAddMember(true)}
      />
      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} />
      <DoctorVisitFAB
        members={memberSummaries}
        onSuccess={() => router.refresh()}
        disabled={memberSummaries.length === 0}
      />
    </>
  )
}
