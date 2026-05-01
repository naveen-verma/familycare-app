'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteDocumentAction } from '@/app/(dashboard)/documents/actions'

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteDocumentAction(documentId)
      router.push('/documents')
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Delete this document?</span>
        <Button
          size="sm"
          variant="destructive"
          className="h-7 text-xs"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          disabled={deleting}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 text-xs text-muted-foreground hover:text-destructive"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="size-3 mr-1" />
      Delete
    </Button>
  )
}
