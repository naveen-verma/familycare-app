import { getFamilyMembers } from '@/lib/members'
import { getMedicationsForMember } from '@/lib/medications'
import { MedicationsView } from '@/components/medications/MedicationsView'
import { PageShell } from '@/components/layout/PageShell'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MedicationsPage() {
  const members = await getFamilyMembers()

  const memberMeds = await Promise.all(
    members.map(async (m) => ({
      id: m.id,
      full_name: m.full_name,
      relation: m.relation ?? null,
      is_primary: m.is_primary,
      avatar_url: m.avatar_url ?? null,
      medications: await getMedicationsForMember(m.id),
    }))
  )

  const totalMeds = memberMeds.reduce((sum, m) => sum + m.medications.length, 0)

  return (
    <PageShell
      title="Medications"
      subtitle={
        totalMeds > 0
          ? `${totalMeds} medication${totalMeds !== 1 ? 's' : ''} across all members`
          : 'Track medications for your family'
      }
      action={
        <Link
          href="/medications/add"
          className="flex items-center gap-1.5 text-white font-medium hover:opacity-90 transition-opacity"
          style={{ background: '#0F6E56', borderRadius: 20, padding: '7px 14px', fontSize: 12 }}
        >
          <Plus size={13} />
          Add medication
        </Link>
      }
    >
      <MedicationsView memberMeds={memberMeds} />
    </PageShell>
  )
}
