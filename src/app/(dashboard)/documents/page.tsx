import { getVaultData } from '@/lib/vault'
import { VaultView } from '@/components/documents/VaultView'

export default async function DocumentsPage() {
  const members = await getVaultData()

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold">Document Vault</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All your family health documents, organised by condition
        </p>
      </div>
      <VaultView members={members} />
    </div>
  )
}
