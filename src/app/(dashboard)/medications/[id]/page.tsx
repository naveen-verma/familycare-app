import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMedication, getMedicationLogs, isMedicationActive } from '@/lib/medications'
import { getMember } from '@/lib/members'
import { MedicationDetailView } from '@/components/medications/MedicationDetailView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pill } from 'lucide-react'

export default async function MedicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [medication, logs] = await Promise.all([
    getMedication(id),
    getMedicationLogs(id),
  ])

  if (!medication) notFound()

  const member = await getMember(medication.family_member_id)
  const active = isMedicationActive(medication)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="p-0 h-auto mb-5">
        <Link href="/medications">
          <ArrowLeft className="size-4 mr-1" />
          Medications
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="mt-1 size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Pill className="size-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-xl font-semibold">{medication.name}</h1>
            <Badge
              className={
                active
                  ? 'bg-green-100 text-green-700 hover:bg-green-100 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }
            >
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {member && (
            <p className="text-sm text-muted-foreground mt-0.5">{member.full_name}</p>
          )}
          {medication.dosage && (
            <p className="text-sm text-muted-foreground">{medication.dosage}</p>
          )}
        </div>
      </div>

      <MedicationDetailView medication={medication} logs={logs} />
    </div>
  )
}
