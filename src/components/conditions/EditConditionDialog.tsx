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
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PencilIcon, PlusIcon, Trash2Icon, UserIcon, BuildingIcon, CalendarIcon } from 'lucide-react'
import {
  editConditionAction,
  addConsultationAction,
  deleteConsultationAction,
} from '@/app/(dashboard)/members/[id]/actions'
import type { ConditionWithICD10 } from '@/lib/conditions'
import type { ConditionConsultation } from '@/types/database'

// ── Edit condition fields ─────────────────────────────────────────────────────

const conditionSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional(),
})
type ConditionForm = z.infer<typeof conditionSchema>

// ── Add consultation fields ───────────────────────────────────────────────────

const consultationSchema = z.object({
  doctor_name: z.string().min(1, 'Doctor name is required'),
  hospital_name: z.string().optional(),
  consultation_date: z.string().optional(),
  notes: z.string().optional(),
})
type ConsultationForm = z.infer<typeof consultationSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditConditionDialog({
  condition,
  memberId,
}: {
  condition: ConditionWithICD10
  memberId: string
}) {
  const [open, setOpen] = useState(false)
  const [savingCondition, setSavingCondition] = useState(false)
  const [conditionError, setConditionError] = useState<string | null>(null)
  const [showAddConsultation, setShowAddConsultation] = useState(false)
  const [savingConsultation, setSavingConsultation] = useState(false)
  const [consultationError, setConsultationError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const conditionName =
    condition.icd10_conditions?.common_name ??
    condition.icd10_conditions?.name ??
    condition.custom_name ??
    'Condition'

  // Condition form
  const {
    register: regCondition,
    handleSubmit: handleConditionSubmit,
    setValue: setConditionValue,
    formState: { errors: conditionErrors },
  } = useForm<ConditionForm>({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      status: condition.status,
      notes: condition.notes ?? '',
    },
  })

  // Consultation form
  const {
    register: regConsultation,
    handleSubmit: handleConsultationSubmit,
    reset: resetConsultation,
    formState: { errors: consultationErrors },
  } = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
  })

  async function onSaveCondition(data: ConditionForm) {
    setSavingCondition(true)
    setConditionError(null)
    try {
      await editConditionAction(condition.id, memberId, data)
      router.refresh()
    } catch {
      setConditionError('Failed to save changes.')
    } finally {
      setSavingCondition(false)
    }
  }

  async function onAddConsultation(data: ConsultationForm) {
    setSavingConsultation(true)
    setConsultationError(null)
    try {
      await addConsultationAction(condition.id, memberId, data)
      resetConsultation()
      setShowAddConsultation(false)
      router.refresh()
    } catch {
      setConsultationError('Failed to add consultation.')
    } finally {
      setSavingConsultation(false)
    }
  }

  async function onDeleteConsultation(consultation: ConditionConsultation) {
    setDeletingId(consultation.id)
    try {
      await deleteConsultationAction(consultation.id, memberId)
      router.refresh()
    } catch {
      // silent — user can retry
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <PencilIcon />
          <span className="sr-only">Edit condition</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{conditionName}</DialogTitle>
          {condition.icd10_conditions && (
            <p className="text-xs text-muted-foreground">
              {condition.icd10_conditions.icd10_code} · {condition.icd10_conditions.name}
            </p>
          )}
        </DialogHeader>

        {/* ── Condition details form ── */}
        <form onSubmit={handleConditionSubmit(onSaveCondition)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              defaultValue={condition.status}
              onValueChange={(v) => setConditionValue('status', v)}
            >
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...regCondition('notes')}
              placeholder="Any notes about this condition..."
              rows={2}
            />
          </div>

          {conditionError && (
            <p className="text-xs text-destructive">{conditionError}</p>
          )}

          <Button type="submit" size="sm" disabled={savingCondition} className="w-full">
            {savingCondition ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>

        <Separator />

        {/* ── Consultations ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Consultations</p>
            {!showAddConsultation && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddConsultation(true)}
              >
                <PlusIcon />
                Add
              </Button>
            )}
          </div>

          {/* Existing consultations */}
          {condition.condition_consultations.length > 0 ? (
            <div className="space-y-2">
              {condition.condition_consultations.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="size-3 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{c.doctor_name}</span>
                    </div>
                    {c.hospital_name && (
                      <div className="flex items-center gap-1.5">
                        <BuildingIcon className="size-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">{c.hospital_name}</span>
                      </div>
                    )}
                    {c.consultation_date && (
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(c.consultation_date)}
                        </span>
                      </div>
                    )}
                    {c.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{c.notes}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={deletingId === c.id}
                    onClick={() => onDeleteConsultation(c)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2Icon className="size-3.5" />
                    <span className="sr-only">Delete consultation</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            !showAddConsultation && (
              <p className="text-xs text-muted-foreground">
                No consultations recorded. Add the doctor(s) seen for this condition.
              </p>
            )
          )}

          {/* Add consultation inline form */}
          {showAddConsultation && (
            <form
              onSubmit={handleConsultationSubmit(onAddConsultation)}
              className="space-y-3 rounded-lg border border-border bg-muted/30 p-3"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                New Consultation
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="doctor_name">Doctor Name *</Label>
                <Input
                  id="doctor_name"
                  {...regConsultation('doctor_name')}
                  placeholder="e.g. Dr. Mehta"
                />
                {consultationErrors.doctor_name && (
                  <p className="text-xs text-destructive">
                    {consultationErrors.doctor_name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hospital_name">Hospital / Clinic</Label>
                  <Input
                    id="hospital_name"
                    {...regConsultation('hospital_name')}
                    placeholder="e.g. Apollo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="consultation_date">Date</Label>
                  <Input
                    id="consultation_date"
                    type="date"
                    {...regConsultation('consultation_date')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="consultation_notes">Notes</Label>
                <Textarea
                  id="consultation_notes"
                  {...regConsultation('notes')}
                  placeholder="What was discussed or prescribed..."
                  rows={2}
                />
              </div>

              {consultationError && (
                <p className="text-xs text-destructive">{consultationError}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowAddConsultation(false)
                    resetConsultation()
                    setConsultationError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1"
                  disabled={savingConsultation}
                >
                  {savingConsultation ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
