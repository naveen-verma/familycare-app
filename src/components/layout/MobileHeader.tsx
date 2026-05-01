'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { LogoutButton } from '@/components/layout/LogoutButton'
import { UserCircle } from 'lucide-react'

export function MobileHeader() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex md:hidden items-center justify-between h-14 px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-primary flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary-foreground">FC</span>
          </div>
          <span className="font-heading font-semibold text-sm">FamilyCare</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Account menu"
        >
          <UserCircle className="size-6 text-muted-foreground" />
        </button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-sm font-medium">Account</SheetTitle>
            {email && (
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            )}
          </SheetHeader>
          <div className="border-t pt-3">
            <LogoutButton variant="sidebar" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
