'use client'

import { useState } from 'react'
import { Stethoscope, Sparkles } from 'lucide-react'
import HealthEventLogger from '@/components/visits/HealthEventLogger'
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
          relative
          fixed bottom-6 right-6 z-50
          flex items-center gap-2
          bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed
          text-white rounded-full shadow-lg hover:shadow-xl
          transition-all duration-200
          px-3 py-3 sm:px-4
        `}
      >
        <Stethoscope size={18} />
        <span className="hidden sm:inline text-sm font-medium">Log Visit</span>
        {/* Sparkle AI badge */}
        <span className="absolute -top-1 -right-1 size-[18px] rounded-full bg-white ring-1 ring-white shadow-sm flex items-center justify-center pointer-events-none">
          <Sparkles className="size-[11px] text-amber-400" />
        </span>
      </button>

      <HealthEventLogger
        isOpen={open}
        onClose={() => setOpen(false)}
        familyMembers={members}
        onSuccess={onSuccess}
      />
    </>
  )
}
