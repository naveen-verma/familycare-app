import { getShareViewData } from '@/lib/share'
import { ConditionsAccordion } from '@/components/share/ConditionsAccordion'
import { Lock, Pill, Activity } from 'lucide-react'
import Link from 'next/link'

// ── Helpers ────────────────────────────────────────────────────────────────

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatExpiry(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function bmiClass(bmi: number): { label: string; cls: string } {
  if (bmi < 18.5) return { label: 'Underweight', cls: 'bg-blue-100 text-blue-700' }
  if (bmi < 23.0) return { label: 'Normal', cls: 'bg-green-100 text-green-700' }
  if (bmi < 25.0) return { label: 'Overweight', cls: 'bg-yellow-100 text-yellow-700' }
  if (bmi < 30.0) return { label: 'Obese Class I', cls: 'bg-orange-100 text-orange-700' }
  return { label: 'Obese Class II', cls: 'bg-red-100 text-red-700' }
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  active:     { background: '#FAEEDA', color: '#633806' },
  chronic:    { background: '#FAEEDA', color: '#633806' },
  monitoring: { background: '#E6F1FB', color: '#0C447C' },
  resolved:   { background: '#F1EFE8', color: '#444441' },
}
const STATUS_DOT: Record<string, string> = {
  active: '#E24B4A', chronic: '#BA7517', monitoring: '#378ADD', resolved: '#888780',
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 9, fontWeight: 500, textTransform: 'uppercase',
  letterSpacing: '0.07em', color: 'var(--color-text-tertiary)',
  marginBottom: 10,
}
const CARD: React.CSSProperties = {
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '14px 16px',
  marginBottom: 10,
}
const ROW_BORDER: React.CSSProperties = {
  borderBottom: '0.5px solid var(--color-border-tertiary)',
  padding: '6px 0',
}

const EVENT_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  diagnosis:       { label: 'Diagnosis',      bg: '#FCEBEB', color: '#791F1F' },
  visit:           { label: 'Visit',          bg: '#E1F5EE', color: '#085041' },
  surgery:         { label: 'Surgery',        bg: '#FCEBEB', color: '#791F1F' },
  test:            { label: 'Test',           bg: '#EEEDFE', color: '#3C3489' },
  vaccination:     { label: 'Vaccination',    bg: '#E6F1FB', color: '#185FA5' },
  hospitalization: { label: 'Hospitalization',bg: '#FEF3C7', color: '#92400E' },
  therapy:         { label: 'Therapy',        bg: '#E6F1FB', color: '#0C447C' },
  document:        { label: 'Document',       bg: '#E1F5EE', color: '#085041' },
  other:           { label: 'Other',          bg: '#F1EFE8', color: '#444441' },
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function ShareViewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getShareViewData(token)

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--color-background-secondary)' }}
      >
        <div className="w-full max-w-sm text-center py-16">
          <div
            className="flex items-center justify-center rounded-full mx-auto mb-4"
            style={{ width: 56, height: 56, background: 'var(--color-background-secondary)' }}
          >
            <Lock size={24} style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
          <h1 className="font-medium mb-2" style={{ fontSize: 16, color: 'var(--color-text-primary)' }}>
            This link has expired
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Ask your patient to share a new link via FamilyCare.
          </p>
          <p className="mt-6" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Powered by FamilyCare · familycare.co.in
          </p>
        </div>
      </div>
    )
  }

  const { shareLink, member, conditions, medications, documents, events } = data
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null
  const hasBmi = member.bmi != null && member.height_cm != null && member.weight_kg != null
  const isNewMode = Array.isArray(shareLink.selected_condition_ids) &&
    shareLink.selected_condition_ids.length > 0
  const demographics = [
    age !== null ? `${age} years old` : null,
    member.blood_group ?? null,
    member.gender ?? null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-secondary)' }}>

      {/* ── Hero header ─────────────────────────────── */}
      <div style={{ background: '#0F6E56', padding: '24px 20px 20px' }}>
        <p className="font-medium" style={{ fontSize: 18, color: 'white', marginBottom: 4 }}>
          Medical Summary
        </p>
        <p style={{ fontSize: 14, color: '#9FE1CB', marginBottom: 2 }}>{member.full_name}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
          Shared via FamilyCare
          {shareLink.doctor_name && ` · For ${shareLink.doctor_name}`}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          Valid until {formatExpiry(shareLink.expires_at)}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-0">

        {/* ── Patient overview ─────────────────────── */}
        <div style={CARD}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full font-semibold shrink-0 text-white"
              style={{ width: 48, height: 48, background: '#1D9E75', fontSize: 15 }}
            >
              {getInitials(member.full_name)}
            </div>
            <div>
              <p className="font-medium" style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>
                {member.full_name}
              </p>
              {demographics && (
                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {demographics}
                </p>
              )}
            </div>
          </div>

          {hasBmi && (
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3"
              style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
              {[
                { label: 'Height', value: `${member.height_cm} cm` },
                { label: 'Weight', value: `${member.weight_kg} kg` },
                { label: 'BMI', value: Number(member.bmi).toFixed(1) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-[8px] text-center"
                  style={{ background: 'var(--color-background-secondary)', padding: '6px 4px' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</p>
                  <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{label}</p>
                </div>
              ))}
              {member.bmi && (
                <div className="col-span-3 flex justify-end">
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${bmiClass(Number(member.bmi)).cls}`}>
                    {bmiClass(Number(member.bmi)).label}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Active Conditions ─────────────────────── */}
        {(isNewMode || shareLink.include_conditions) && (
          <div style={CARD}>
            <p style={SECTION_LABEL}>
              Active Conditions
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5"
                style={{ fontSize: 9, background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)' }}>
                {conditions.length}
              </span>
            </p>

            {isNewMode ? (
              <ConditionsAccordion
                conditions={conditions}
                medications={medications}
                documents={documents}
                includeDocuments={shareLink.include_documents}
              />
            ) : conditions.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No conditions recorded.</p>
            ) : (
              <div className="space-y-0">
                {conditions.map((c, ci) => {
                  const name = c.icd10_conditions?.common_name ?? c.icd10_conditions?.name ?? c.custom_name ?? '—'
                  return (
                    <div key={c.id} className="flex items-start gap-2.5 py-2.5"
                      style={ci < conditions.length - 1 ? { borderBottom: '0.5px solid var(--color-border-tertiary)' } : {}}>
                      <div className="rounded-full shrink-0 mt-1.5"
                        style={{ width: 6, height: 6, background: STATUS_DOT[c.status] ?? STATUS_DOT.monitoring }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                          {name}
                        </p>
                        <div className="flex flex-wrap gap-x-3 mt-0.5"
                          style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                          {c.diagnosed_on && <span>Diagnosed {formatDate(c.diagnosed_on)}</span>}
                          {c.diagnosed_by && <span>by {c.diagnosed_by}</span>}
                        </div>
                      </div>
                      <span className="shrink-0 inline-flex items-center rounded-full px-2 capitalize"
                        style={{ fontSize: 10, fontWeight: 500, height: 18, ...(STATUS_BADGE[c.status] ?? STATUS_BADGE.monitoring) }}>
                        {c.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Current Medications (legacy mode) ─────── */}
        {!isNewMode && shareLink.include_medications && (
          <div style={CARD}>
            <p style={SECTION_LABEL}>
              Current Medications
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5"
                style={{ fontSize: 9, background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)' }}>
                {medications.length}
              </span>
            </p>
            {medications.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No active medications.</p>
            ) : (
              <div className="space-y-0">
                {medications.map((m, mi) => (
                  <div key={m.id} className="flex items-center gap-2.5 py-2.5"
                    style={mi < medications.length - 1 ? { borderBottom: '0.5px solid var(--color-border-tertiary)' } : {}}>
                    <div className="flex items-center justify-center rounded-[6px] shrink-0"
                      style={{ width: 24, height: 24, background: '#E1F5EE' }}>
                      <Pill size={12} color="#0F6E56" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                        {m.name}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                        {[m.dosage, m.frequency, m.prescribed_by ? `Dr. ${m.prescribed_by}` : null]
                          .filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Health Timeline ───────────────────────── */}
        <div style={CARD}>
          <p style={SECTION_LABEL}>
            Health Timeline
            <span className="ml-1" style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(complete history)</span>
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5"
              style={{ fontSize: 9, background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)' }}>
              {events.length}
            </span>
          </p>
          {events.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              No health history recorded yet.
            </p>
          ) : (
            <div className="space-y-0">
              {events.map((e, ei) => {
                const badge = EVENT_BADGE[e.event_type] ?? EVENT_BADGE.other
                return (
                  <div key={e.id} className="flex items-start gap-2.5 py-2.5"
                    style={ei < events.length - 1 ? { borderBottom: '0.5px solid var(--color-border-tertiary)' } : {}}>
                    <span className="inline-flex items-center shrink-0 rounded-full px-2 mt-0.5"
                      style={{ height: 18, fontSize: 9, fontWeight: 500, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                        {e.title}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                        {[formatDate(e.event_date), e.doctor_name, e.hospital_name]
                          .filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────── */}
        <div className="text-center pt-4 pb-8 space-y-1">
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Powered by FamilyCare · familycare.co.in
          </p>
          <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
            This summary was shared by the patient and is valid until{' '}
            {formatExpiry(shareLink.expires_at)}
          </p>
          <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
            For complete medical history, please consult the patient directly.
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            {[
              { href: '/terms', label: 'Terms' },
              { href: '/privacy', label: 'Privacy' },
              { href: '/disclaimer', label: 'Disclaimer' },
            ].map(({ href, label }, i, arr) => (
              <span key={href} className="flex items-center gap-3">
                <a href={href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}
                  className="hover:opacity-70">
                  {label}
                </a>
                {i < arr.length - 1 && (
                  <span style={{ color: 'var(--color-border-tertiary)' }}>·</span>
                )}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
