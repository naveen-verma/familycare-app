import { redirect } from 'next/navigation'
import { getFamilyMembers } from '@/lib/members'
import { getFamilyGroupId } from '@/app/(dashboard)/documents/actions'
import { UploadDocumentForm } from '@/components/documents/UploadDocumentForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function UploadDocumentPage() {
  const [members, familyGroupId] = await Promise.all([
    getFamilyMembers(),
    getFamilyGroupId(),
  ])

  if (!familyGroupId) redirect('/dashboard')

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
          <Link href="/documents">
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <h1 className="font-heading text-xl font-semibold mb-1">Upload Document</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Add a prescription, report, scan, or any health document to your vault.
      </p>

      <UploadDocumentForm
        members={members.map((m) => ({ id: m.id, full_name: m.full_name }))}
        familyGroupId={familyGroupId}
      />
    </div>
  )
}
