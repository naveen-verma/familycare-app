'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, MicroscopeIcon } from 'lucide-react'
import { FamilyHealthTabs, type FamilyMemberSummary } from '@/components/dashboard/FamilyHealthTabs'
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar'
import { AddMemberDialog } from '@/components/members/AddMemberDialog'
import { DoctorVisitFAB } from '@/components/dashboard/DoctorVisitFAB'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  familyMembers: FamilyMemberSummary[]
  isOwner: boolean
  pendingSignalsCount: number
}

export function DashboardClient({
  familyMembers,
  isOwner,
  pendingSignalsCount,
}: DashboardClientProps) {
  const [showAddMember, setShowAddMember] = useState(false)
  const router = useRouter()

  const memberSummaries = familyMembers.map((m) => ({
    id: m.id,
    full_name: m.name,
    relation: m.relation,
  }))

  return (
    <>
      <FamilyHealthTabs
        members={familyMembers}
        onAddMember={() => setShowAddMember(true)}
      />
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
