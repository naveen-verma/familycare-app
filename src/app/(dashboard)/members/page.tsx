'use client'

// This page is a client component because AddMemberDialog needs
// to be triggered by a button that opens the sheet.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus } from 'lucide-react'
import { MemberCard } from '@/components/members/MemberCard'
import { AddMemberDialog } from '@/components/members/AddMemberDialog'
import { PageShell } from '@/components/layout/PageShell'
import type { MemberWithConditions } from '@/lib/members'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<MemberWithConditions[]>([])
  const [medCounts, setMedCounts] = useState<Record<string, number>>({})
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    // Fetch members with conditions
    const { data: membersData } = await supabase
      .from('family_members')
      .select(`
        id, full_name, date_of_birth, gender, blood_group, relation,
        mobile, is_primary, profile_photo_url, avatar_url, created_at,
        medical_conditions(
          id, status, custom_name, diagnosed_on, deleted_at,
          icd10_conditions(name, common_name)
        )
      `)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    const memberList = (membersData ?? []) as unknown as MemberWithConditions[]
    setMembers(memberList)

    if (memberList.length === 0) { setLoading(false); return }

    const memberIds = memberList.map((m) => m.id)

    // Fetch medication + document counts in parallel
    const [{ data: medsData }, { data: docsData }] = await Promise.all([
      supabase.from('medications').select('family_member_id').in('family_member_id', memberIds).eq('is_active', true).is('deleted_at', null),
      supabase.from('documents').select('family_member_id').in('family_member_id', memberIds).is('deleted_at', null),
    ])

    const mc: Record<string, number> = {}
    for (const m of medsData ?? []) {
      const id = (m as { family_member_id: string }).family_member_id
      mc[id] = (mc[id] ?? 0) + 1
    }

    const dc: Record<string, number> = {}
    for (const d of docsData ?? []) {
      const id = (d as { family_member_id: string }).family_member_id
      dc[id] = (dc[id] ?? 0) + 1
    }

    setMedCounts(mc)
    setDocCounts(dc)
    setLoading(false)
  }

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addMemberAction = (
    <button
      onClick={() => setShowAddMember(true)}
      className="flex items-center gap-1.5 text-white font-medium hover:opacity-90 transition-opacity"
      style={{
        background: '#0F6E56', borderRadius: 20,
        padding: '7px 14px', fontSize: 12,
        border: 'none', cursor: 'pointer',
      }}
    >
      <UserPlus size={13} />
      Add member
    </button>
  )

  if (loading) {
    return (
      <PageShell
        title="Family"
        subtitle="Loading…"
        action={addMemberAction}
      >
        <div className="flex items-center justify-center py-20">
          <div className="size-6 border-2 border-gray-200 border-t-[#0F6E56] rounded-full animate-spin" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Family"
      subtitle={`${members.length} member${members.length !== 1 ? 's' : ''}`}
      action={addMemberAction}
    >
      {members.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="flex items-center justify-center rounded-full mb-4"
            style={{ width: 56, height: 56, background: 'var(--color-background-secondary)' }}
          >
            <Users size={28} style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
          <p className="font-medium" style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
            No family members yet
          </p>
          <p className="mt-1 mb-5" style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Add your first family member to get started
          </p>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 text-white font-medium hover:opacity-90 transition-opacity"
            style={{ background: '#0F6E56', borderRadius: 20, padding: '8px 18px', fontSize: 13, border: 'none', cursor: 'pointer' }}
          >
            <UserPlus size={14} />
            Add member
          </button>
        </div>
      ) : (
        /* Card grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              medicationsCount={medCounts[member.id] ?? 0}
              documentsCount={docCounts[member.id] ?? 0}
            />
          ))}
        </div>
      )}

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onSuccess={() => { setShowAddMember(false); loadData() }}
      />
    </PageShell>
  )
}
