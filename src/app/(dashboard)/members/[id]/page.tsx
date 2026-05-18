import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMember } from '@/lib/members'
import { getMemberConditions, getICD10Conditions } from '@/lib/conditions'
import { getMedicationsForMember } from '@/lib/medications'
import { isMedicationActive, frequencyLabel } from '@/lib/medication-utils'
import { AddConditionDialog } from '@/components/conditions/AddConditionDialog'
import { EditConditionDialog } from '@/components/conditions/EditConditionDialog'
import { EditMemberHealthDialog } from '@/components/members/EditMemberHealthDialog'
import { AvatarUploader } from '@/components/members/AvatarUploader'
import { SecondOpinionButton } from '@/components/conditions/SecondOpinionButton'
import { PageShell } from '@/components/layout/PageShell'
import { Share2, Pill, ChevronRight, UserIcon, BuildingIcon, CalendarIcon } from 'lucide-react'

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
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function capitalize(s: string | null | undefined): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const CARD: React.CSSProperties = {
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '14px 16px',
  marginBottom: 10,
}
const SECTION_LABEL: React.CSSProperties = {
  fontSize: 9, fontWeight: 500, textTransform: 'uppercase',
  letterSpacing: '0.07em', color: 'var(--color-text-tertiary)',
}
const STATUS_DOT: Record<string, string> = {
  active: '#E24B4A', chronic: '#BA7517', monitoring: '#378ADD', resolved: '#888780',
}
const STATUS_BADGE: Record<string, React.CSSProperties> = {
  active:     { background: '#FAEEDA', color: '#633806' },
  chronic:    { background: '#FAEEDA', color: '#633806' },
  monitoring: { background: '#E6F1FB', color: '#0C447C' },
  resolved:   { background: '#F1EFE8', color: '#444441' },
}
const CONSULTATION_TYPE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  visit:           { label: 'Visit',           bg: '#E1F5EE', color: '#085041' },
  surgery:         { label: 'Surgery',         bg: '#FCEBEB', color: '#791F1F' },
  test:            { label: 'Test',            bg: '#EEEDFE', color: '#3C3489' },
  vaccination:     { label: 'Vaccination',     bg: '#E6F1FB', color: '#185FA5' },
  hospitalization: { label: 'Hospitalization', bg: '#FEF3C7', color: '#92400E' },
  therapy:         { label: 'Therapy',         bg: '#E6F1FB', color: '#0C447C' },
  other:           { label: 'Other',           bg: '#F1EFE8', color: '#444441' },
}

function bmiClass(bmi: number): { label: string; cls: string } {
  if (bmi < 18.5) return { label: 'Underweight', cls: 'bg-blue-100 text-blue-700' }
  if (bmi < 23.0) return { label: 'Normal', cls: 'bg-green-100 text-green-700' }
  if (bmi < 25.0) return { label: 'Overweight', cls: 'bg-yellow-100 text-yellow-700' }
  if (bmi < 30.0) return { label: 'Obese Class I', cls: 'bg-orange-100 text-orange-700' }
  return { label: 'Obese Class II', cls: 'bg-red-100 text-red-700' }
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [member, conditions, icd10Conditions, medications] = await Promise.all([
    getMember(id),
    getMemberConditions(id),
    getICD10Conditions(),
    getMedicationsForMember(id),
  ])

  if (!member) notFound()

  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const familyGroupId = (member as any).family_group_id as string ?? ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avatarUrl = (member as any).avatar_url as string | null ?? null
  const activeMedications = medications.filter(isMedicationActive)
  const activeConditions = conditions.filter(
    (c) => c.status === 'active' || c.status === 'chronic' || c.status === 'monitoring'
  )

  const hasHealthMetrics = member.height_cm != null && member.weight_kg != null && member.bmi != null

  // Demographics subtitle for PageShell
  const subtitle = [
    age !== null ? `${age}y` : null,
    member.blood_group ?? null,
    member.relation === 'self' ? 'You' : capitalize(member.relation),
  ].filter(Boolean).join(' · ')

  // Condition groups
  const conditionGroups = [
    { key: 'active',     label: 'Active',     color: STATUS_DOT.active },
    { key: 'chronic',    label: 'Chronic',    color: STATUS_DOT.chronic },
    { key: 'monitoring', label: 'Monitoring', color: STATUS_DOT.monitoring },
    { key: 'resolved',   label: 'Resolved',   color: STATUS_DOT.resolved },
  ]
    .map((g) => ({ ...g, items: conditions.filter((c) => c.status === g.key) }))
    .filter((g) => g.items.length > 0)

  return (
    <PageShell
      title={member.full_name}
      subtitle={subtitle}
      backHref="/members"
      action={
        <Link
          href={`/share?memberId=${id}`}
          className="flex items-center gap-1.5 font-medium hover:opacity-80 transition-opacity"
          style={{
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 20,
            padding: '7px 14px',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <Share2 size={12} />
          Share
        </Link>
      }
    >
      {/* ── Hero card ─────────────────────────────────────── */}
      <div style={CARD}>
        <div className="flex items-center gap-4">
          <AvatarUploader
            memberId={member.id}
            familyGroupId={familyGroupId}
            currentAvatarUrl={avatarUrl}
            memberName={member.full_name}
            size={56}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ fontSize: 16, color: 'var(--color-text-primary)' }}>
              {member.full_name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
              {[
                age !== null ? `${age} years old` : null,
                member.blood_group ?? null,
                member.gender ? capitalize(member.gender) : null,
                member.relation === 'self' ? 'You' : capitalize(member.relation),
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { label: 'Conditions', value: conditions.length },
            { label: 'Medications', value: activeMedications.length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-[8px] text-center"
              style={{ background: 'var(--color-background-secondary)', padding: '8px' }}
            >
              <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</p>
              <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Health Metrics card ───────────────────────────── */}
      <div style={CARD}>
        <div className="flex items-center justify-between mb-3">
          <p style={SECTION_LABEL}>HEALTH METRICS</p>
          <EditMemberHealthDialog
            memberId={member.id}
            initialHeight={member.height_cm ?? null}
            initialWeight={member.weight_kg ?? null}
          />
        </div>

        {hasHealthMetrics ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] px-3 py-2.5"
                style={{ background: 'var(--color-background-secondary)' }}>
                <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Height</p>
                <p className="font-medium mt-1" style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {member.height_cm} cm
                </p>
              </div>
              <div className="rounded-[8px] px-3 py-2.5"
                style={{ background: 'var(--color-background-secondary)' }}>
                <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight</p>
                <p className="font-medium mt-1" style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {member.weight_kg} kg
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BMI</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold" style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                    {Number(member.bmi).toFixed(1)}
                  </span>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${bmiClass(Number(member.bmi)).cls}`}>
                    {bmiClass(Number(member.bmi)).label}
                  </span>
                </div>
              </div>
              {member.bmi_date && (
                <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                  Measured {formatDate(member.bmi_date)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Not recorded</p>
            <EditMemberHealthDialog
              memberId={member.id}
              initialHeight={null}
              initialWeight={null}
              triggerLabel="Add metrics"
            />
          </div>
        )}
      </div>

      {/* ── Active Conditions card ────────────────────────── */}
      <div style={CARD}>
        <div className="flex items-center justify-between mb-3">
          <p style={SECTION_LABEL}>
            CONDITIONS
            {conditions.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5"
                style={{ fontSize: 9, background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)' }}>
                {conditions.length}
              </span>
            )}
          </p>
          <AddConditionDialog memberId={member.id} icd10Conditions={icd10Conditions} />
        </div>

        {conditions.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No conditions recorded</p>
        ) : (
          <div className="space-y-4">
            {conditionGroups.map((group) => (
              <div key={group.key}>
                <p className="mb-2" style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                  {group.label}
                </p>
                <div className="space-y-0">
                  {group.items.map((condition, ci) => (
                    <div
                      key={condition.id}
                      className="flex items-start gap-2.5 py-3"
                      style={{
                        borderBottom: ci < group.items.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                      }}
                    >
                      {/* Status dot */}
                      <div
                        className="rounded-full shrink-0 mt-1.5"
                        style={{ width: 6, height: 6, background: group.color }}
                      />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium" style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                          {condition.icd10_conditions?.common_name ??
                            condition.icd10_conditions?.name ??
                            condition.custom_name}
                        </p>
                        {condition.icd10_conditions?.category && (
                          <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                            {condition.icd10_conditions.category}
                          </p>
                        )}
                        {/* Consultations */}
                        {(condition.diagnosed_by || condition.condition_consultations.length > 0) && (
                          <div className="mt-1.5 space-y-1">
                            {condition.diagnosed_by && condition.condition_consultations.length === 0 && (
                              <div className="flex items-center gap-1.5"
                                style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                <UserIcon size={11} />
                                <span
                                  className="inline-flex items-center rounded-full px-1.5"
                                  style={{ fontSize: 9, background: '#E1F5EE', color: '#085041', height: 16 }}
                                >
                                  Initial
                                </span>
                                <span>{condition.diagnosed_by}</span>
                                {condition.diagnosed_on && (
                                  <span>· {formatDate(condition.diagnosed_on)}</span>
                                )}
                              </div>
                            )}
                            {condition.condition_consultations.map((c) => {
                              const typeCfg = CONSULTATION_TYPE_BADGE[c.consultation_type ?? ''] ?? CONSULTATION_TYPE_BADGE.other
                              return (
                                <div key={c.id} className="flex items-center gap-1.5"
                                  style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                  <UserIcon size={11} />
                                  <span
                                    className="inline-flex items-center rounded-full px-1.5 shrink-0"
                                    style={{ fontSize: 9, background: typeCfg.bg, color: typeCfg.color, height: 16 }}
                                  >
                                    {typeCfg.label}
                                  </span>
                                  <span className="truncate">{c.doctor_name}</span>
                                  {c.hospital_name && (
                                    <>
                                      <span>·</span>
                                      <BuildingIcon size={10} />
                                      <span className="truncate">{c.hospital_name}</span>
                                    </>
                                  )}
                                  {c.consultation_date && (
                                    <>
                                      <span>·</span>
                                      <span>{formatDate(c.consultation_date)}</span>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {condition.notes && (
                          <p className="mt-1" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                            {condition.notes}
                          </p>
                        )}
                        <SecondOpinionButton
                          memberId={member.id}
                          conditionId={condition.id}
                          conditionName={
                            condition.icd10_conditions?.common_name ??
                            condition.icd10_conditions?.name ??
                            condition.custom_name ?? 'this condition'
                          }
                          icd10ConditionId={condition.icd10_condition_id ?? null}
                          secondOpinionRequested={condition.second_opinion_requested}
                        />
                      </div>
                      {/* Status badge + edit */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="inline-flex items-center rounded-full px-2 capitalize"
                          style={{
                            fontSize: 10, fontWeight: 500, height: 18,
                            ...(STATUS_BADGE[condition.status] ?? STATUS_BADGE.monitoring),
                          }}
                        >
                          {condition.status}
                        </span>
                        <EditConditionDialog condition={condition} memberId={member.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Medications card ──────────────────────────────── */}
      <div style={{ ...CARD, marginBottom: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <p style={SECTION_LABEL}>
            MEDICATIONS
            {activeMedications.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5"
                style={{ fontSize: 9, background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)' }}>
                {activeMedications.length}
              </span>
            )}
          </p>
          <Link
            href={`/medications/add?memberId=${id}`}
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ fontSize: 12, color: '#0F6E56' }}
          >
            + Add
          </Link>
        </div>

        {medications.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No medications recorded</p>
        ) : (
          <div className="space-y-0">
            {medications.map((med, mi) => {
              const active = isMedicationActive(med)
              const dosageFreq = [
                med.dosage,
                med.frequency ? frequencyLabel(med.frequency) : null,
              ].filter(Boolean).join(' · ')
              return (
                <Link
                  key={med.id}
                  href={`/medications/${med.id}`}
                  className="flex items-center gap-3 py-3 hover:opacity-80 transition-opacity"
                  style={{
                    borderBottom: mi < medications.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-[7px] shrink-0"
                    style={{ width: 28, height: 28, background: '#E1F5EE' }}
                  >
                    <Pill size={13} color="#0F6E56" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                      {med.name}
                    </p>
                    {dosageFreq && (
                      <p className="truncate" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        {dosageFreq}
                      </p>
                    )}
                  </div>
                  <span
                    className="shrink-0 inline-flex items-center rounded-full px-2"
                    style={{
                      fontSize: 10, fontWeight: 500, height: 18,
                      background: active ? '#E1F5EE' : 'var(--color-background-secondary)',
                      color: active ? '#0F6E56' : 'var(--color-text-tertiary)',
                    }}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </span>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}
