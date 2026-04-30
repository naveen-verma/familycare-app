import { getFamilyMembers } from '@/lib/members'
import { getMedicationsForMember } from '@/lib/medications'
import { MedicationsView } from '@/components/medications/MedicationsView'

export default async function MedicationsPage() {
  const members = await getFamilyMembers()

  const memberMeds = await Promise.all(
    members.map(async (m) => ({
      id: m.id,
      full_name: m.full_name,
      relation: m.relation ?? null,
      medications: await getMedicationsForMember(m.id),
    }))
  )

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold">Medications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track current and past medications for your family
        </p>
      </div>
      <MedicationsView memberMeds={memberMeds} />
    </div>
  )
}
