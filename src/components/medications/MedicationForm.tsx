'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addMedicationAction, updateMedicationAction } from '@/app/(dashboard)/medications/actions'
import { AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import type { MedicationFormInput } from '@/app/(dashboard)/medications/actions'

// ---- Constants ----

const FREQUENCY_OPTIONS = [
  { value: 'once daily', label: 'Once Daily', timeCount: 1 },
  { value: 'twice daily', label: 'Twice Daily', timeCount: 2 },
  { value: 'three times daily', label: 'Three Times Daily', timeCount: 3 },
  { value: 'four times daily', label: 'Four Times Daily', timeCount: 4 },
  { value: 'every alternate day', label: 'Every Alternate Day', timeCount: 1 },
  { value: 'weekly', label: 'Weekly', timeCount: 1 },
  { value: 'as needed', label: 'As Needed', timeCount: 0 },
  { value: 'other', label: 'Other', timeCount: 1 },
]

function timeCountForFrequency(freq: string | null): number {
  return FREQUENCY_OPTIONS.find((f) => f.value === freq)?.timeCount ?? 0
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---- Types ----

type Member = { id: string; full_name: string }
type ConditionOption = { id: string; name: string }

export type MedicationFormProps = {
  members: Member[]
  editMode?: boolean
  medicationId?: string
  initialValues?: {
    family_member_id: string
    medical_condition_id?: string
    name: string
    dosage?: string
    frequency?: string
    time_of_day?: string[]
    start_date?: string
    end_date?: string
    prescribed_by?: string
    reminder_enabled: boolean
    notes?: string
  }
}

export function MedicationForm({
  members,
  editMode = false,
  medicationId,
  initialValues,
}: MedicationFormProps) {
  const router = useRouter()

  // Form state
  const [memberId, setMemberId] = useState(initialValues?.family_member_id ?? members[0]?.id ?? '')
  const [name, setName] = useState(initialValues?.name ?? '')
  const [dosage, setDosage] = useState(initialValues?.dosage ?? '')
  const [frequency, setFrequency] = useState(initialValues?.frequency ?? '')
  const [times, setTimes] = useState<string[]>(initialValues?.time_of_day ?? [])
  const [conditionId, setConditionId] = useState(initialValues?.medical_condition_id ?? 'none')
  const [startDate, setStartDate] = useState(initialValues?.start_date ?? todayISO())
  const [endDate, setEndDate] = useState(initialValues?.end_date ?? '')
  const [prescribedBy, setPrescribedBy] = useState(initialValues?.prescribed_by ?? '')
  const [reminderEnabled, setReminderEnabled] = useState(initialValues?.reminder_enabled ?? true)
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [conditions, setConditions] = useState<ConditionOption[]>([])
  const [loadingConditions, setLoadingConditions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Keep times array length in sync with frequency
  useEffect(() => {
    const count = timeCountForFrequency(frequency)
    setTimes((prev) => {
      if (prev.length === count) return prev
      if (prev.length < count) return [...prev, ...Array(count - prev.length).fill('')]
      return prev.slice(0, count)
    })
  }, [frequency])

  // Load conditions for selected member
  useEffect(() => {
    if (!memberId) return
    setLoadingConditions(true)
    setConditionId('none')
    const supabase = createClient()
    const load = async () => {
      try {
        const { data } = await supabase
          .from('medical_conditions')
          .select('id, custom_name, icd10_conditions(name, common_name)')
          .eq('family_member_id', memberId)
          .is('deleted_at', null)
        const opts: ConditionOption[] = (data || []).map((c: any) => {
          const ic = c.icd10_conditions as { name: string; common_name: string | null } | null
          return { id: c.id, name: ic?.common_name ?? ic?.name ?? c.custom_name ?? 'Unknown' }
        })
        setConditions(opts)
        // Restore conditionId in edit mode after conditions load
        if (editMode && initialValues?.medical_condition_id) {
          setConditionId(initialValues.medical_condition_id)
        }
      } finally {
        setLoadingConditions(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  function updateTime(index: number, value: string) {
    setTimes((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!memberId) { setError('Please select a family member.'); return }
    if (!name.trim()) { setError('Medication name is required.'); return }
    if (endDate && startDate && endDate <= startDate) {
      setError('End date must be after start date.')
      return
    }

    const payload: MedicationFormInput = {
      family_member_id: memberId,
      medical_condition_id: conditionId !== 'none' ? conditionId : undefined,
      name,
      dosage: dosage || undefined,
      frequency: frequency || undefined,
      time_of_day: times.filter(Boolean).length ? times.filter(Boolean) : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      prescribed_by: prescribedBy || undefined,
      reminder_enabled: reminderEnabled,
      notes: notes || undefined,
    }

    setSubmitting(true)
    try {
      if (editMode && medicationId) {
        await updateMedicationAction(medicationId, payload)
        toast.success('Medication updated')
        router.push(`/medications/${medicationId}`)
      } else {
        await addMedicationAction(payload)
        toast.success('Medication added')
        router.push('/medications')
      }
      router.refresh()
    } catch {
      setError('Failed to save medication. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const timeCount = timeCountForFrequency(frequency)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Family Member */}
      {!editMode && (
        <div className="space-y-1.5">
          <Label>Family Member *</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 2. Medication Name */}
      <div className="space-y-1.5">
        <Label htmlFor="med_name">Medication Name *</Label>
        <Input
          id="med_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Metformin"
        />
      </div>

      {/* 3. Dosage */}
      <div className="space-y-1.5">
        <Label htmlFor="dosage">Dosage</Label>
        <Input
          id="dosage"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="e.g. 500mg"
        />
      </div>

      {/* 4. Frequency */}
      <div className="space-y-1.5">
        <Label>Frequency</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_OPTIONS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!frequency && (
          <p className="text-xs text-muted-foreground">
            Time reminders will appear after selecting frequency
          </p>
        )}
      </div>

      {/* 5. Time of Day */}
      {timeCount > 0 && (
        <div className="space-y-1.5">
          <Label>Time of Day</Label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: timeCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground shrink-0" />
                <Input
                  type="time"
                  value={times[i] ?? ''}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="w-32"
                  aria-label={`Time ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Optional details divider ── */}
      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Optional Details
        </p>
      </div>

      {/* 6. Link to Condition */}
      {memberId && (
        <div className="space-y-1.5">
          <Label>Linked Medical Condition</Label>
          <Select
            value={conditionId}
            onValueChange={setConditionId}
            disabled={loadingConditions}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingConditions ? 'Loading…' : 'Select condition'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not linked to a condition</SelectItem>
              {conditions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 7 & 8. Start Date / End Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {!endDate && (
            <p className="text-xs text-green-600">Leave empty for ongoing</p>
          )}
        </div>
      </div>

      {/* 9. Prescribed By */}
      <div className="space-y-1.5">
        <Label htmlFor="prescribed_by">Prescribed By</Label>
        <Input
          id="prescribed_by"
          value={prescribedBy}
          onChange={(e) => setPrescribedBy(e.target.value)}
          placeholder="Dr. Sharma"
        />
      </div>

      {/* 10. Reminder */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-gray-50 p-3">
        <Switch
          id="reminder"
          checked={reminderEnabled}
          onCheckedChange={setReminderEnabled}
        />
        <div className="space-y-0.5">
          <Label htmlFor="reminder" className="cursor-pointer font-medium">
            Send WhatsApp reminder at scheduled times
          </Label>
          <p className="text-xs text-muted-foreground">
            Reminders will be sent via WhatsApp (available from Week 10)
          </p>
        </div>
      </div>

      {/* 11. Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="med_notes">Notes</Label>
        <Textarea
          id="med_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any instructions, warnings, or notes..."
          rows={3}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting
          ? editMode ? 'Saving…' : 'Adding…'
          : editMode ? 'Save Changes' : 'Add Medication'}
      </Button>
    </form>
  )
}
