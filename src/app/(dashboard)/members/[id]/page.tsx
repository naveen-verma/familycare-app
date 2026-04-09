import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMember } from '@/lib/members'
import { getMemberConditions, getICD10Conditions } from '@/lib/conditions'
import { AddConditionDialog } from '@/components/conditions/AddConditionDialog'
import { EditConditionDialog } from '@/components/conditions/EditConditionDialog'
import { ConditionTag } from '@/components/conditions/ConditionTag'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeftIcon,
  CalendarIcon,
  PhoneIcon,
  HeartIcon,
  UserIcon,
  BuildingIcon,
} from 'lucide-react'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const avatarColors: Record<string, string> = {
  self: 'bg-blue-100 text-blue-700',
  spouse: 'bg-pink-100 text-pink-700',
  child: 'bg-green-100 text-green-700',
  parent: 'bg-purple-100 text-purple-700',
  sibling: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [member, conditions, icd10Conditions] = await Promise.all([
    getMember(id),
    getMemberConditions(id),
    getICD10Conditions(),
  ])

  if (!member) notFound()

  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null
  const avatarColor = avatarColors[member.relation ?? 'other'] ?? avatarColors.other
  const activeConditions = conditions.filter((c) => c.status !== 'resolved')
  const resolvedConditions = conditions.filter((c) => c.status === 'resolved')

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Link
        href="/members"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeftIcon className="size-4" />
        Family Members
      </Link>

      {/* Profile card */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div
              className={`size-14 rounded-full flex items-center justify-center shrink-0 font-semibold text-base ${avatarColor}`}
            >
              {getInitials(member.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h1 className="font-heading text-lg font-semibold leading-tight">
                  {member.full_name}
                </h1>
                {member.relation && (
                  <Badge variant="outline" className="capitalize shrink-0">
                    {member.relation === 'self' ? 'You' : member.relation}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                {age !== null && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="size-3.5" />
                    {age} years old
                  </span>
                )}
                {member.blood_group && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <HeartIcon className="size-3.5" />
                    {member.blood_group}
                  </span>
                )}
                {member.gender && (
                  <span className="text-sm text-muted-foreground capitalize">
                    {member.gender}
                  </span>
                )}
                {member.mobile && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <PhoneIcon className="size-3.5" />
                    {member.mobile}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-medium text-sm">Medical Conditions</h2>
          <AddConditionDialog memberId={member.id} icd10Conditions={icd10Conditions} />
        </div>

        {conditions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No conditions recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap &quot;Add Condition&quot; to record a diagnosis
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeConditions.length > 0 && (
              <div className="space-y-2">
                {activeConditions.map((condition) => (
                  <Card key={condition.id} size="sm">
                    <CardContent className="py-3">
                      {/* Condition header row */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {condition.icd10_conditions?.common_name ??
                                condition.icd10_conditions?.name ??
                                condition.custom_name}
                            </span>
                            <ConditionTag
                              status={condition.status}
                              name={condition.status}
                            />
                          </div>
                          {condition.icd10_conditions && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {condition.icd10_conditions.icd10_code} ·{' '}
                              {condition.icd10_conditions.name}
                            </div>
                          )}
                          {condition.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {condition.notes}
                            </p>
                          )}
                        </div>
                        <EditConditionDialog
                          condition={condition}
                          memberId={member.id}
                        />
                      </div>

                      {/* Consultations */}
                      {condition.condition_consultations.length > 0 && (
                        <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                          {condition.condition_consultations.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <UserIcon className="size-3 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="font-medium text-foreground">
                                  {c.doctor_name}
                                </span>
                                {c.hospital_name && (
                                  <>
                                    <span className="mx-1">·</span>
                                    <span className="inline-flex items-center gap-0.5">
                                      <BuildingIcon className="size-2.5" />
                                      {c.hospital_name}
                                    </span>
                                  </>
                                )}
                                {c.consultation_date && (
                                  <>
                                    <span className="mx-1">·</span>
                                    <span className="inline-flex items-center gap-0.5">
                                      <CalendarIcon className="size-2.5" />
                                      {formatDate(c.consultation_date)}
                                    </span>
                                  </>
                                )}
                                {c.notes && (
                                  <p className="text-muted-foreground mt-0.5 truncate">
                                    {c.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {resolvedConditions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Resolved
                </p>
                {resolvedConditions.map((condition) => (
                  <Card key={condition.id} size="sm">
                    <CardContent className="py-3 opacity-60">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm truncate">
                            {condition.icd10_conditions?.common_name ??
                              condition.icd10_conditions?.name ??
                              condition.custom_name}
                          </span>
                          <ConditionTag status="resolved" name="Resolved" />
                        </div>
                        <EditConditionDialog
                          condition={condition}
                          memberId={member.id}
                        />
                      </div>
                      {condition.condition_consultations.length > 0 && (
                        <div className="mt-1.5 space-y-1 border-t border-border pt-1.5">
                          {condition.condition_consultations.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground"
                            >
                              <UserIcon className="size-3 shrink-0" />
                              <span>{c.doctor_name}</span>
                              {c.hospital_name && (
                                <span>· {c.hospital_name}</span>
                              )}
                              {c.consultation_date && (
                                <span>· {formatDate(c.consultation_date)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
