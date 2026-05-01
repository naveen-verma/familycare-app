import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMedication } from '@/lib/medications'
import { getFamilyMembers } from '@/lib/members'
import { MedicationForm } from '@/components/medications/MedicationForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function EditMedicationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [medication, members] = await Promise.all([
    getMedication(id),
    getFamilyMembers(),
  ])

  if (!medication) notFound()

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
          <Link href={`/medications/${id}`}>
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <h1 className="font-heading text-xl font-semibold mb-1">Edit Medication</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Update details for {medication.name}.
      </p>

      <MedicationForm
        members={members.map((m) => ({ id: m.id, full_name: m.full_name }))}
        editMode
        medicationId={id}
        initialValues={{
          family_member_id: medication.family_member_id,
          medical_condition_id: medication.medical_condition_id ?? undefined,
          name: medication.name,
          dosage: medication.dosage ?? undefined,
          frequency: medication.frequency ?? undefined,
          time_of_day: medication.time_of_day ?? undefined,
          start_date: medication.start_date ?? undefined,
          end_date: medication.end_date ?? undefined,
          prescribed_by: medication.prescribed_by ?? undefined,
          reminder_enabled: medication.reminder_enabled,
          notes: medication.notes ?? undefined,
        }}
      />
    </div>
  )
}
