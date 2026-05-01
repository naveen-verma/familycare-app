'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LogOutIcon } from 'lucide-react'

export function LogoutButton({ variant = 'sidebar' }: { variant?: 'sidebar' | 'mobile' }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    // Session cleared — middleware will redirect any protected route to /login.
    // Push explicitly so the navigation is immediate.
    router.push('/login')
  }

  if (variant === 'mobile') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOutIcon className="size-5" />
          <span>Logout</span>
        </button>

        <LogoutDialog
          open={open}
          loading={loading}
          onConfirm={handleLogout}
          onCancel={() => setOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2.5 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
        onClick={() => setOpen(true)}
      >
        <LogOutIcon className="size-4 shrink-0" />
        Logout
      </Button>

      <LogoutDialog
        open={open}
        loading={loading}
        onConfirm={handleLogout}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

function LogoutDialog({
  open,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log out of FamilyCare?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Any unsaved changes in open forms will be lost. Make sure you have
          saved your work before logging out.
        </p>
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 sm:flex-none bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            {loading ? 'Logging out…' : 'Log out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
