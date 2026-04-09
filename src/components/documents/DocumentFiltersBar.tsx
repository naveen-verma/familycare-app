'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { DocumentType } from '@/types/database'
import { X } from 'lucide-react'

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'report', label: 'Lab Report' },
  { value: 'scan', label: 'Scan' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'other', label: 'Other' },
]

type Member = { id: string; full_name: string }

export function DocumentFiltersBar({ members }: { members: Member[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const member = searchParams.get('member') ?? ''
  const type = searchParams.get('type') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  const hasFilters = member || type || from || to

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Select value={member} onValueChange={(v) => updateParam('member', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="All members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => updateParam('type', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={from}
          onChange={(e) => updateParam('from', e.target.value)}
          className="w-[140px] h-8 text-xs"
          placeholder="From date"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => updateParam('to', e.target.value)}
          className="w-[140px] h-8 text-xs"
          placeholder="To date"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs text-muted-foreground"
          >
            <X className="size-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
