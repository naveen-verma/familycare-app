import { getFamilyMembers } from '@/lib/members'
import { MemberCard } from '@/components/members/MemberCard'
import { AddMemberDialog } from '@/components/members/AddMemberDialog'
import { createClient } from '@/lib/supabase/server'
import { Users, MicroscopeIcon } from 'lucide-react'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const members = await getFamilyMembers()

  // Fetch current user role and interest signals (owner only)
  const supabase = await createClient()
  const { data: profile } = await supabase.rpc('get_current_user_profile')
  const isOwner = profile?.role === 'owner'

  type InterestSignalRow = {
    id: string
    signal_date: string
    created_at: string
    notified: boolean
    medical_conditions: {
      custom_name: string | null
      status: string
      icd10_conditions: { common_name: string | null; category: string | null } | null
    } | null
    family_members: { full_name: string } | null
  }

  let interestSignals: InterestSignalRow[] = []
  if (isOwner) {
    const { data } = await supabase
      .from('interest_signals')
      .select(`
        id, signal_date, created_at, notified,
        medical_conditions (
          custom_name, status,
          icd10_conditions (common_name, category)
        ),
        family_members (full_name)
      `)
      .eq('signal_type', 'second_opinion')
      .order('created_at', { ascending: false })
    interestSignals = (data ?? []) as unknown as InterestSignalRow[]
  }

  const activeConditionCount = members.reduce(
    (sum, m) =>
      sum +
      m.medical_conditions.filter(
        (c) => c.status === 'active' || c.status === 'chronic'
      ).length,
    0
  )

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-semibold">Family Health</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? 'member' : 'members'}
            {activeConditionCount > 0 && (
              <>
                {' '}
                · {activeConditionCount} active{' '}
                {activeConditionCount === 1 ? 'condition' : 'conditions'}
              </>
            )}
          </p>
        </div>
        <AddMemberDialog />
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">No family members yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Add your first family member to get started
          </p>
          <AddMemberDialog />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}

      {/* Interest Signals Panel — owner only */}
      {isOwner && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <MicroscopeIcon className="size-4 text-indigo-600" />
            <div>
              <h2 className="font-heading font-semibold text-sm">Second Opinion Interest (Admin)</h2>
              <p className="text-xs text-muted-foreground">
                Conditions your family wants specialist opinions on
              </p>
            </div>
          </div>

          {interestSignals.length === 0 ? (
            <div className="rounded-xl border bg-white px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No second opinion requests yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                When family members request specialist opinions, they will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">Member</th>
                    <th className="px-4 py-2.5 text-left font-medium">Condition</th>
                    <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Category</th>
                    <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Date</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {interestSignals.map((signal) => {
                    const mc = signal.medical_conditions
                    const conditionName =
                      mc?.icd10_conditions?.common_name ?? mc?.custom_name ?? '—'
                    const category = mc?.icd10_conditions?.category ?? '—'
                    const memberName = signal.family_members?.full_name ?? '—'
                    return (
                      <tr key={signal.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-sm font-medium">{memberName}</td>
                        <td className="px-4 py-2.5 text-sm">{conditionName}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                          {category}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                          {formatDate(signal.signal_date)}
                        </td>
                        <td className="px-4 py-2.5">
                          {signal.notified ? (
                            <span className="inline-flex h-5 items-center rounded-full bg-green-100 text-green-700 px-2 text-xs font-medium">
                              Notified
                            </span>
                          ) : (
                            <span className="inline-flex h-5 items-center rounded-full bg-yellow-100 text-yellow-700 px-2 text-xs font-medium">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
