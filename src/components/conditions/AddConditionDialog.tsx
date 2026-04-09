'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { addConditionAction } from '@/app/(dashboard)/members/[id]/actions'
import type { ICD10Condition } from '@/types/database'

const schema = z.object({
  status: z.string().min(1, 'Please select a status'),
  diagnosed_on: z.string().optional(),
  diagnosed_by: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function AddConditionDialog({
  memberId,
  icd10Conditions,
}: {
  memberId: string
  icd10Conditions: ICD10Condition[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCondition, setSelectedCondition] = useState<ICD10Condition | null>(null)
  const [customName, setCustomName] = useState('')
  const router = useRouter()

  const filtered =
    search.length > 1
      ? icd10Conditions
          .filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              (c.common_name &&
                c.common_name.toLowerCase().includes(search.toLowerCase())) ||
              c.icd10_code.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 8)
      : []

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  })

  async function onSubmit(data: FormData) {
    if (!selectedCondition && !customName.trim()) {
      setFormError('Please select or enter a condition name.')
      return
    }
    setLoading(true)
    setFormError(null)
    try {
      await addConditionAction(memberId, {
        icd10_condition_id: selectedCondition?.id,
        custom_name: selectedCondition ? undefined : customName.trim(),
        status: data.status,
        diagnosed_on: data.diagnosed_on,
        diagnosed_by: data.diagnosed_by,
        notes: data.notes,
      })
      reset()
      setSearch('')
      setSelectedCondition(null)
      setCustomName('')
      setOpen(false)
      router.refresh()
    } catch {
      setFormError('Failed to add condition. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    reset()
    setSearch('')
    setSelectedCondition(null)
    setCustomName('')
    setFormError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) handleReset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusIcon />
          Add Condition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Medical Condition</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Condition picker */}
          <div className="space-y-1.5">
            <Label>Condition *</Label>
            {selectedCondition ? (
              <div className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {selectedCondition.common_name ?? selectedCondition.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedCondition.icd10_code} · {selectedCondition.name}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedCondition(null)}
                >
                  <XIcon />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search ICD-10 conditions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {filtered.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md max-h-48 overflow-y-auto">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCondition(c)
                          setSearch('')
                        }}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                            {c.common_name ?? c.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.icd10_code}
                          </div>
                        </div>
                        {c.is_critical && (
                          <span className="text-xs text-destructive font-medium shrink-0">
                            Critical
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {search.length > 1 && filtered.length === 0 && (
                  <div className="mt-1.5 space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      No ICD-10 match — enter a custom name:
                    </p>
                    <Input
                      placeholder="Custom condition name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select defaultValue="active" onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="chronic">Chronic</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diagnosed_on">Diagnosed On</Label>
              <Input id="diagnosed_on" type="date" {...register('diagnosed_on')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="diagnosed_by">Doctor / Hospital</Label>
            <Input
              id="diagnosed_by"
              {...register('diagnosed_by')}
              placeholder="e.g. Dr. Gupta, AIIMS Delhi"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || (!selectedCondition && !customName.trim())}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add Condition'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
