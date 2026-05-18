import { getVaultData } from '@/lib/vault'
import { VaultView } from '@/components/documents/VaultView'
import { toggleConditionPinAction } from '@/app/(dashboard)/documents/actions'
import { PageShell } from '@/components/layout/PageShell'
import Link from 'next/link'
import { Upload } from 'lucide-react'

export default async function DocumentsPage() {
  const members = await getVaultData()

  const totalDocs = members.reduce(
    (sum, m) =>
      sum +
      m.conditions.reduce((cs, c) => cs + c.documents.length, 0) +
      m.general_documents.length,
    0
  )

  return (
    <PageShell
      title="Documents"
      subtitle={
        totalDocs > 0
          ? `${totalDocs} document${totalDocs !== 1 ? 's' : ''} across all members`
          : 'Store family health documents'
      }
      action={
        <Link
          href="/documents/upload"
          className="flex items-center gap-1.5 text-white font-medium hover:opacity-90 transition-opacity"
          style={{ background: '#0F6E56', borderRadius: 20, padding: '7px 14px', fontSize: 12 }}
        >
          <Upload size={13} />
          Upload
        </Link>
      }
    >
      <VaultView members={members} onPinToggle={toggleConditionPinAction} />
    </PageShell>
  )
}
