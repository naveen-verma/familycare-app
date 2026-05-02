import { getFamilyMembers } from '@/lib/members'
import { MemberCard } from '@/components/members/MemberCard'
import { AddMemberDialog } from '@/components/members/AddMemberDialog'
import { Users } from 'lucide-react'

export default async function MembersPage() {
  const members = await getFamilyMembers()

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-semibold">Family Members</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? 'member' : 'members'}
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
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 md:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  )
}
