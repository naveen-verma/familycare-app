import { getFamilyMembers } from '@/lib/members'
import { MedicationForm } from '@/components/medications/MedicationForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AddMedicationPage() {
  const members = await getFamilyMembers()

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
          <Link href="/medications">
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <h1 className="font-heading text-xl font-semibold mb-1">Add Medication</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Track a new medication for a family member.
      </p>

      <MedicationForm
        members={members.map((m) => ({ id: m.id, full_name: m.full_name }))}
      />
    </div>
  )
}
