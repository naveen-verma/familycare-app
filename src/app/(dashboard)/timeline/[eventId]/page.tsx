import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTimelineEvent } from '@/lib/timeline'
import {
  Calendar,
  Building2,
  Stethoscope,
  Clock,
  AlertCircle,
  RulerIcon,
  ScaleIcon,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// ---- Helpers ----

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function bmiClass(bmi: number): { label: string; badgeClass: string } {
  if (bmi < 18.5) return { label: 'Underweight', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' }
  if (bmi < 23.0) return { label: 'Normal', badgeClass: 'bg-green-100 text-green-700 border-green-200' }
  if (bmi < 25.0) return { label: 'Overweight', badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  if (bmi < 30.0) return { label: 'Obese Class I', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' }
  return { label: 'Obese Class II', badgeClass: 'bg-red-100 text-red-700 border-red-200' }
}

const statusStyles: Record<string, string> = {
  active: 'bg-red-100 text-red-700 border-red-200',
  chronic: 'bg-orange-100 text-orange-700 border-orange-200',
  monitoring: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  visit: 'Visit',
  surgery: 'Surgery',
  test: 'Test',
  vaccination: 'Vaccination',
  hospitalization: 'Hospitalization',
  therapy: 'Therapy',
  other: 'Other',
}

const EVENT_TYPE_BADGE: Record<string, string> = {
  visit: 'bg-blue-100 text-blue-700 border-blue-200',
  surgery: 'bg-red-100 text-red-700 border-red-200',
  test: 'bg-purple-100 text-purple-700 border-purple-200',
  vaccination: 'bg-green-100 text-green-700 border-green-200',
  hospitalization: 'bg-orange-100 text-orange-700 border-orange-200',
  therapy: 'bg-teal-100 text-teal-700 border-teal-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}

// ---- Page ----

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const event = await getTimelineEvent(eventId)

  if (!event) notFound()

  const member = event.family_members
  const condition = event.medical_conditions
  const conditionName = condition?.icd10_conditions?.common_name ?? condition?.custom_name ?? null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const followUpStatus = event.follow_up_date
    ? (() => {
        const d = new Date(event.follow_up_date)
        d.setHours(0, 0, 0, 0)
        if (event.follow_up_sent) return 'sent'
        if (d < today) return 'overdue'
        return 'future'
      })()
    : null

  const hasHealthMetrics =
    member?.height_cm != null && member?.weight_kg != null && member?.bmi != null

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/timeline"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        ← Health Timeline
      </Link>

      <div className="mb-5">
        <div className="mb-2">
          <span
            className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium ${EVENT_TYPE_BADGE[event.event_type] ?? EVENT_TYPE_BADGE.other}`}
          >
            {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
          </span>
        </div>
        <h1 className="font-heading text-xl font-semibold leading-tight">{event.title}</h1>
      </div>

      <div className="space-y-4">
        {/* Section 1 — Event Details */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Event Details
            </p>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(event.event_date)}</p>
                </div>
              </div>

              {member && (
                <div>
                  <p className="text-xs text-muted-foreground">Family Member</p>
                  <p className="font-medium">{member.full_name}</p>
                </div>
              )}

              {event.doctor_name && (
                <div className="flex items-start gap-2">
                  <Stethoscope className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="font-medium">{event.doctor_name}</p>
                  </div>
                </div>
              )}

              {event.hospital_name && (
                <div className="flex items-start gap-2">
                  <Building2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Hospital / Clinic</p>
                    <p className="font-medium">{event.hospital_name}</p>
                  </div>
                </div>
              )}
            </div>

            {event.notes && (
              <div className="pt-1 border-t">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm leading-relaxed">{event.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2 — Medical Condition (if linked) */}
        {condition && conditionName && (
          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Linked Medical Condition
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{conditionName}</span>
                <span
                  className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize ${statusStyles[condition.status] ?? statusStyles.monitoring}`}
                >
                  {condition.status}
                </span>
              </div>
              {condition.diagnosed_on && (
                <p className="text-xs text-muted-foreground">
                  Diagnosed {formatDate(condition.diagnosed_on)}
                </p>
              )}
              <Link
                href={`/documents/${event.family_member_id}/${condition.id}`}
                className="inline-block text-xs text-primary underline underline-offset-2 mt-1"
              >
                View documents for this condition →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Section 3 — Follow-up */}
        {event.follow_up_date && followUpStatus && (
          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Follow-up
              </p>
              {followUpStatus === 'sent' && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Reminder sent · {formatDate(event.follow_up_date)}
                </p>
              )}
              {followUpStatus === 'overdue' && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                  <AlertCircle className="size-4 shrink-0" />
                  Was due on {formatDate(event.follow_up_date)} — overdue
                </p>
              )}
              {followUpStatus === 'future' && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-blue-600">
                  <Clock className="size-4 shrink-0" />
                  Scheduled for {formatDate(event.follow_up_date)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 4 — Health Metrics */}
        {member && (
          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Health Metrics — {member.full_name}
              </p>
              {hasHealthMetrics ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <RulerIcon className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Height</p>
                      <p className="text-sm font-medium">{member.height_cm} cm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScaleIcon className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="text-sm font-medium">{member.weight_kg} kg</p>
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-muted-foreground mb-1">BMI</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        {Number(member.bmi).toFixed(1)}
                      </span>
                      <span
                        className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${bmiClass(Number(member.bmi)).badgeClass}`}
                      >
                        {bmiClass(Number(member.bmi)).label}
                      </span>
                    </div>
                    {member.bmi_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Measured {formatDate(member.bmi_date)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No health metrics recorded for this member.{' '}
                  <Link
                    href={`/members/${event.family_member_id}`}
                    className="text-primary underline underline-offset-2"
                  >
                    Add metrics
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
