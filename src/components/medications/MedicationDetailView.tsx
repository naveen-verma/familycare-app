'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Clock,
  User,
  Bell,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { toggleReminderAction, setMedicationActiveAction } from '@/app/(dashboard)/medications/actions'
import type { MedicationWithCondition, MedicationLog } from '@/lib/medication-utils'
import { getConditionName, isMedicationActive, frequencyLabel } from '@/lib/medication-utils'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const LOG_STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  taken: {
    label: 'Taken',
    icon: CheckCircle,
    className: 'text-green-700 bg-green-100',
  },
  skipped: {
    label: 'Skipped',
    icon: XCircle,
    className: 'text-red-700 bg-red-100',
  },
  snoozed: {
    label: 'Snoozed',
    icon: AlertCircle,
    className: 'text-yellow-700 bg-yellow-100',
  },
  pending: {
    label: 'Pending',
    icon: AlertCircle,
    className: 'text-gray-600 bg-gray-100',
  },
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  chronic: 'Chronic',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

export function MedicationDetailView({
  medication,
  logs,
}: {
  medication: MedicationWithCondition
  logs: MedicationLog[]
}) {
  const router = useRouter()
  const [reminderOn, setReminderOn] = useState(medication.reminder_enabled)
  const [toggling, setToggling] = useState(false)
  const [isActive, setIsActive] = useState(isMedicationActive(medication))
  const [showInactiveDialog, setShowInactiveDialog] = useState(false)
  const [activating, setActivating] = useState(false)

  const conditionName = getConditionName(medication)
  const takenCount = logs.filter((l) => l.status === 'taken').length
  const totalCount = logs.length

  async function handleReminderToggle() {
    if (toggling) return
    setToggling(true)
    const prev = reminderOn
    setReminderOn(!prev)
    try {
      await toggleReminderAction(medication.id, prev)
    } catch {
      setReminderOn(prev)
    } finally {
      setToggling(false)
    }
  }

  async function handleMarkInactive() {
    setShowInactiveDialog(false)
    setActivating(true)
    setIsActive(false)
    try {
      await setMedicationActiveAction(medication.id, false)
      router.refresh()
    } catch {
      setIsActive(true)
    } finally {
      setActivating(false)
    }
  }

  async function handleReactivate() {
    setActivating(true)
    setIsActive(true)
    try {
      await setMedicationActiveAction(medication.id, true)
      router.refresh()
    } catch {
      setIsActive(false)
    } finally {
      setActivating(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Section 1: Details */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              Details
            </h2>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href={`/medications/${medication.id}/edit`}>
                <Edit className="size-3 mr-1.5" />
                Edit
              </Link>
            </Button>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
            {medication.dosage && (
              <>
                <dt className="text-muted-foreground self-center">Dosage</dt>
                <dd className="font-medium">{medication.dosage}</dd>
              </>
            )}
            {medication.frequency && (
              <>
                <dt className="text-muted-foreground self-center">Frequency</dt>
                <dd className="font-medium">{frequencyLabel(medication.frequency)}</dd>
              </>
            )}
            {medication.time_of_day && medication.time_of_day.length > 0 && (
              <>
                <dt className="text-muted-foreground self-center">Times</dt>
                <dd>
                  <div className="flex flex-wrap gap-1">
                    {medication.time_of_day.map((t, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-0.5 text-xs bg-muted rounded px-1.5 py-0.5"
                      >
                        <Clock className="size-3 text-muted-foreground" />
                        {t}
                      </span>
                    ))}
                  </div>
                </dd>
              </>
            )}
            {medication.prescribed_by && (
              <>
                <dt className="text-muted-foreground self-center">Prescribed By</dt>
                <dd className="font-medium flex items-center gap-1">
                  <User className="size-3.5 text-muted-foreground shrink-0" />
                  {medication.prescribed_by}
                </dd>
              </>
            )}
            {medication.start_date && (
              <>
                <dt className="text-muted-foreground self-center">Started</dt>
                <dd className="font-medium flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                  {formatDate(medication.start_date)}
                </dd>
              </>
            )}
            <>
              <dt className="text-muted-foreground self-center">End Date</dt>
              <dd className="font-medium">
                {medication.end_date ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                    {formatDate(medication.end_date)}
                  </span>
                ) : (
                  <span className="text-green-600">Ongoing</span>
                )}
              </dd>
            </>
            {conditionName && (
              <>
                <dt className="text-muted-foreground self-center">Condition</dt>
                <dd>
                  <span className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                    {conditionName}
                  </span>
                </dd>
              </>
            )}
          </dl>

          {medication.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{medication.notes}</p>
            </div>
          )}
        </div>

        {/* Section 2: Reminder Status */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
            Reminders
          </h2>
          <div className="flex items-start gap-3">
            <Switch
              id="detail-reminder"
              checked={reminderOn}
              onCheckedChange={handleReminderToggle}
              disabled={toggling}
              className="mt-0.5"
            />
            <Label htmlFor="detail-reminder" className="cursor-pointer">
              <span className="font-medium text-sm">
                {reminderOn ? 'Reminders enabled' : 'Reminders disabled'}
              </span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {reminderOn
                  ? 'WhatsApp reminders will be sent at scheduled times (from Week 10)'
                  : 'Enable to receive WhatsApp reminders at scheduled times'}
              </p>
            </Label>
          </div>

          {reminderOn && medication.time_of_day && medication.time_of_day.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Scheduled times today</p>
              <div className="flex flex-wrap gap-1.5">
                {medication.time_of_day.map((t, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1"
                  >
                    <Bell className="size-3" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Adherence Log */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              Adherence — Last 7 Days
            </h2>
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Taken {takenCount} of {totalCount} doses
              </span>
            )}
          </div>

          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No dose records yet
            </p>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log) => {
                const config = LOG_STATUS_CONFIG[log.status] ?? LOG_STATUS_CONFIG.pending
                const Icon = config.icon
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(log.scheduled_time)}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${config.className}`}
                    >
                      <Icon className="size-3" />
                      {config.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 4: Linked Condition */}
        {medication.medical_conditions && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              Linked Condition
            </h2>
            <div className="space-y-1.5">
              <p className="font-medium">{conditionName}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs capitalize">
                  {STATUS_LABELS[medication.medical_conditions.status] ??
                    medication.medical_conditions.status}
                </Badge>
                {medication.medical_conditions.diagnosed_on && (
                  <span className="text-xs text-muted-foreground">
                    Diagnosed {formatDate(medication.medical_conditions.diagnosed_on)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-1">
          {isActive ? (
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowInactiveDialog(true)}
              disabled={activating}
            >
              Mark as Inactive
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              onClick={handleReactivate}
              disabled={activating}
            >
              Reactivate Medication
            </Button>
          )}
        </div>
      </div>

      {/* Confirm inactive dialog */}
      <Dialog open={showInactiveDialog} onOpenChange={setShowInactiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Inactive?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Mark <strong>{medication.name}</strong> as inactive? This will stop reminders but keep
            the full medication history.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInactiveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMarkInactive}>
              Mark Inactive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
