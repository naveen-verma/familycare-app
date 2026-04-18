'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MicroscopeIcon } from 'lucide-react'
import { toast } from 'sonner'
import { logSecondOpinionInterestAction } from '@/lib/second-opinion-actions'

interface Props {
  memberId: string
  conditionId: string
  conditionName: string
  icd10ConditionId: string | null
  secondOpinionRequested?: boolean
}

export function SecondOpinionButton({
  memberId,
  conditionId,
  conditionName,
  icd10ConditionId,
  secondOpinionRequested = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [interestLogged, setInterestLogged] = useState(secondOpinionRequested)

  async function handleNotifyMe() {
    setLoading(true)
    try {
      const result = await logSecondOpinionInterestAction({
        memberId,
        conditionId,
        icd10ConditionId,
      })

      if (result.alreadyLogged) {
        toast.info('Your interest has already been noted for today.')
      } else if (result.success) {
        toast.success(
          'We have noted your interest. You will be notified when specialist matching is available.'
        )
        setInterestLogged(true)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mt-3 pt-2.5 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
          onClick={() => setOpen(true)}
        >
          <MicroscopeIcon className="size-3.5 mr-1.5" />
          Find Second Opinion
        </Button>
        {interestLogged ? (
          <p className="text-xs text-green-600 mt-1.5">✓ Interest noted</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1.5">Specialist matching coming soon</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Find a Second Opinion</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3 py-1">
            <p>
              We are building a network of verified specialists across India for
              second opinions on critical conditions.
            </p>
            <p>
              We have noted your interest in finding a specialist for{' '}
              <span className="font-medium text-foreground">{conditionName}</span>.
              You will be notified when this feature is available.
            </p>
            <p className="text-xs">— FamilyCare Team</p>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Close
            </Button>
            <Button size="sm" onClick={handleNotifyMe} disabled={loading}>
              {loading ? 'Saving...' : 'Notify Me'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
