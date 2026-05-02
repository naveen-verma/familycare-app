'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { UserPlus, Plus, Upload, Pill, Share2 } from 'lucide-react'

export type FamilyMemberSummary = {
  id: string
  full_name: string
  relation: string | null
}

const avatarColors: Record<string, string> = {
  self: 'bg-blue-100 text-blue-700',
  spouse: 'bg-pink-100 text-pink-700',
  child: 'bg-green-100 text-green-700',
  parent: 'bg-purple-100 text-purple-700',
  sibling: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface QuickActionsBarProps {
  members: FamilyMemberSummary[]
  onAddMember?: () => void
}

export function QuickActionsBar({ members, onAddMember }: QuickActionsBarProps) {
  const router = useRouter()
  const [pickerMode, setPickerMode] = useState<'condition' | 'share' | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerMode(null)
      }
    }
    if (pickerMode) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pickerMode])

  function handleMemberSelect(member: FamilyMemberSummary) {
    setPickerMode(null)
    if (pickerMode === 'condition') {
      router.push(`/members/${member.id}`)
    } else {
      router.push(`/share?memberId=${member.id}`)
    }
  }

  const actionBtn =
    'flex-shrink-0 flex flex-col items-center gap-2 rounded-xl border bg-white p-3.5 hover:border-indigo-200 hover:bg-indigo-50 transition-colors min-w-[88px]'

  return (
    <section className="pb-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Quick Actions
      </h2>
      <div className="relative">
        {pickerMode && (
          <div
            ref={pickerRef}
            className="absolute bottom-full mb-2 left-0 z-50 w-full rounded-2xl border bg-white shadow-xl overflow-hidden"
          >
            <p className="text-xs font-semibold text-muted-foreground px-4 pt-3 pb-2 uppercase tracking-wider">
              {pickerMode === 'condition' ? 'Add condition for' : 'Share records for'}
            </p>
            {members.map((member) => {
              const initials = getInitials(member.full_name)
              const color = avatarColors[member.relation ?? 'other'] ?? avatarColors.other
              return (
                <button
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left last:pb-3"
                >
                  <div
                    className={`size-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs ${color}`}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.relation === 'self' ? 'You' : (member.relation ?? '—')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-6 md:px-6">
          <button onClick={() => onAddMember?.()} className={actionBtn}>
            <div className="size-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserPlus className="size-4 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">Add Member</span>
          </button>

          <button
            onClick={() => setPickerMode(pickerMode === 'condition' ? null : 'condition')}
            className={actionBtn}
          >
            <div className="size-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <Plus className="size-4 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">Add Condition</span>
          </button>

          <Link href="/documents/upload" className={actionBtn}>
            <div className="size-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <Upload className="size-4 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">Upload Doc</span>
          </Link>

          <Link href="/medications/add" className={actionBtn}>
            <div className="size-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <Pill className="size-4 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">Add Medication</span>
          </Link>

          <button
            onClick={() => setPickerMode(pickerMode === 'share' ? null : 'share')}
            className={actionBtn}
          >
            <div className="size-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <Share2 className="size-4 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">Share Records</span>
          </button>
        </div>
      </div>
    </section>
  )
}
