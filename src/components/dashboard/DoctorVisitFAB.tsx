'use client'

import { useState } from 'react'
import { Stethoscope } from 'lucide-react'
import { LogVisitSheet } from '@/components/visits/LogVisitSheet'
import type { FamilyMemberSummary } from '@/components/dashboard/QuickActionsBar'

interface DoctorVisitFABProps {
  members: FamilyMemberSummary[]
  onSuccess: () => void
  disabled?: boolean
}

export function DoctorVisitFAB({ members, onSuccess, disabled }: DoctorVisitFABProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-label="Log doctor visit"
        className={`
          fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40
          flex items-center gap-2
          bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed
          text-white rounded-full shadow-lg hover:shadow-xl
          transition-all duration-200
          px-3 py-3 sm:px-4
        `}
      >
        <Stethoscope size={18} />
        <span className="hidden sm:inline text-sm font-medium">Log Visit</span>
      </button>

      <LogVisitSheet
        open={open}
        onOpenChange={setOpen}
        members={members}
        onSuccess={onSuccess}
      />
    </>
  )
}
