import Link from 'next/link'
import { getDocuments } from '@/lib/documents'
import { getFamilyMembers } from '@/lib/members'
import { DocumentCard } from '@/components/documents/DocumentCard'
import { Button } from '@/components/ui/button'
import { FolderOpen, Upload } from 'lucide-react'
import { DocumentFiltersBar } from '@/components/documents/DocumentFiltersBar'
import type { DocumentType } from '@/types/database'

type SearchParams = {
  member?: string
  type?: string
  from?: string
  to?: string
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [documents, members] = await Promise.all([
    getDocuments({
      memberId: params.member,
      documentType: params.type as DocumentType | undefined,
      dateFrom: params.from,
      dateTo: params.to,
    }),
    getFamilyMembers(),
  ])

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-xl font-semibold">Document Vault</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/documents/upload">
            <Upload className="size-4 mr-1.5" />
            Upload
          </Link>
        </Button>
      </div>

      <DocumentFiltersBar members={members.map((m) => ({ id: m.id, full_name: m.full_name }))} />

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FolderOpen className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">No documents yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Upload prescriptions, reports, and scans to your vault
          </p>
          <Button asChild size="sm">
            <Link href="/documents/upload">
              <Upload className="size-4 mr-1.5" />
              Upload your first document
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  )
}
