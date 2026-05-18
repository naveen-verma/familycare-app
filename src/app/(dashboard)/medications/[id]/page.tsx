import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMedication, getMedicationLogs, isMedicationActive } from '@/lib/medications'
import { MedicationDetailView } from '@/components/medications/MedicationDetailView'
import { PageShell } from '@/components/layout/PageShell'
import { frequencyLabel } from '@/lib/medication-utils'

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

  const active = isMedicationActive(medication)
  const subtitle = [
    medication.dosage,
    medication.frequency ? frequencyLabel(medication.frequency) : null,
    active ? 'Active' : 'Inactive',
  ].filter(Boolean).join(' · ')

  return (
    <PageShell
      title={medication.name}
      subtitle={subtitle || 'Medication details'}
      backHref="/medications"
      action={
        <Link
          href={`/medications/${id}/edit`}
          className="font-medium hover:opacity-80 transition-opacity"
          style={{
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 20,
            padding: '7px 14px',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          Edit
        </Link>
      }
    >
      <MedicationDetailView medication={medication} logs={logs} />
    </PageShell>
  )
}
