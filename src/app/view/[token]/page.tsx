import { getShareViewData } from '@/lib/share'
import { ConditionsAccordion } from '@/components/share/ConditionsAccordion'
import {
  CalendarIcon,
  HeartIcon,
  RulerIcon,
  ScaleIcon,
  ActivityIcon,
  ClipboardListIcon,
} from 'lucide-react'

// ---- Helpers ----

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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatExpiry(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function bmiClass(bmi: number): { label: string; badgeClass: string } {
  if (bmi < 18.5) return { label: 'Underweight', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' }
  if (bmi < 23.0) return { label: 'Normal', badgeClass: 'bg-green-100 text-green-700 border-green-200' }
  if (bmi < 25.0) return { label: 'Overweight', badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  if (bmi < 30.0) return { label: 'Obese Class I', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' }
  return { label: 'Obese Class II', badgeClass: 'bg-red-100 text-red-700 border-red-200' }
}

const EVENT_BADGE: Record<string, { label: string; cls: string }> = {
  diagnosis:       { label: 'Diagnosis',        cls: 'bg-red-100 text-red-700' },
  visit:           { label: 'Visit',             cls: 'bg-blue-100 text-blue-700' },
  surgery:         { label: 'Surgery',           cls: 'bg-red-100 text-red-700' },
  test:            { label: 'Test',              cls: 'bg-purple-100 text-purple-700' },
  vaccination:     { label: 'Vaccination',       cls: 'bg-green-100 text-green-700' },
  hospitalization: { label: 'Hospitalization',   cls: 'bg-orange-100 text-orange-700' },
  therapy:         { label: 'Therapy',           cls: 'bg-teal-100 text-teal-700' },
  document:        { label: 'Document',          cls: 'bg-indigo-100 text-indigo-700' },
  other:           { label: 'Other',             cls: 'bg-gray-100 text-gray-700' },
}

// ---- Page ----

export default async function ShareViewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getShareViewData(token)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm w-full text-center py-16">
          <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardListIcon className="size-6 text-gray-400" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800 mb-2">Link not available</h1>
          <p className="text-sm text-gray-500">
            This link has expired or is no longer valid. Please ask the patient to share a new link.
          </p>
          <p className="text-xs text-gray-400 mt-6">Powered by FamilyCare</p>
        </div>
      </div>
    )
  }

  const { shareLink, member, conditions, medications, documents, events } = data
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null
  const hasBmi = member.bmi != null && member.height_cm != null && member.weight_kg != null

  // Determine if this is a new-mode link (specific conditions selected)
  const isNewMode = Array.isArray(shareLink.selected_condition_ids) &&
    shareLink.selected_condition_ids.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <HeartIcon className="size-4 text-white" />
            </div>
            <span className="font-semibold text-sm">FamilyCare</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">Shared Medical Summary</p>
            <p className="text-xs text-muted-foreground">
              Valid until {formatExpiry(shareLink.expires_at)}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Shared-by banner */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800 font-medium">
            Shared by: {member.full_name}
          </p>
          {shareLink.doctor_name && (
            <p className="text-xs text-blue-700 mt-0.5">For: {shareLink.doctor_name}</p>
          )}
        </div>

        {/* SECTION 1 — Patient Details */}
        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Patient Details</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="size-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
                {member.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <h3 className="font-semibold text-base">{member.full_name}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
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
                </div>
              </div>
            </div>

            {hasBmi && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                    <RulerIcon className="size-3" /> Height
                  </p>
                  <p className="text-sm font-medium">{member.height_cm} cm</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                    <ScaleIcon className="size-3" /> Weight
                  </p>
                  <p className="text-sm font-medium">{member.weight_kg} kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">BMI</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold">
                      {Number(member.bmi).toFixed(1)}
                    </span>
                    <span
                      className={`inline-flex h-5 items-center rounded-full border px-1.5 text-[11px] font-medium ${bmiClass(Number(member.bmi)).badgeClass}`}
                    >
                      {bmiClass(Number(member.bmi)).label}
                    </span>
                  </div>
                  {member.bmi_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      as of {formatDate(member.bmi_date)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2 — Medical Conditions (Accordion) */}
        {(isNewMode || shareLink.include_conditions) && (
          <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <ActivityIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-gray-700">Medical Conditions</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {conditions.length}
              </span>
            </div>

            <div className="p-4">
              {isNewMode ? (
                /* New mode: accordion per condition with nested meds + docs */
                <ConditionsAccordion
                  conditions={conditions}
                  medications={medications}
                  documents={documents}
                  includeDocuments={shareLink.include_documents}
                />
              ) : (
                /* Legacy mode: flat condition list */
                conditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No conditions recorded.</p>
                ) : (
                  <ul className="divide-y -mx-4">
                    {conditions.map((c) => {
                      const conditionName =
                        c.icd10_conditions?.common_name ?? c.icd10_conditions?.name ?? c.custom_name ?? '—'
                      return (
                        <li key={c.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{conditionName}</span>
                                <span className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize ${{
                                  active: 'bg-blue-100 text-blue-700 border-blue-200',
                                  chronic: 'bg-orange-100 text-orange-700 border-orange-200',
                                  monitoring: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                  resolved: 'bg-gray-100 text-gray-600 border-gray-200',
                                }[c.status] ?? 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                  {c.status}
                                </span>
                              </div>
                              {c.icd10_conditions && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {c.icd10_conditions.icd10_code} · {c.icd10_conditions.name}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-muted-foreground">
                                {c.diagnosed_on && <span>Diagnosed {formatDate(c.diagnosed_on)}</span>}
                                {c.diagnosed_by && <span>by {c.diagnosed_by}</span>}
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )
              )}
            </div>
          </section>
        )}

        {/* Legacy: flat medications (only shown for old-mode links) */}
        {!isNewMode && shareLink.include_medications && (
          <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <ActivityIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-gray-700">Current Medications</h2>
              <span className="ml-auto text-xs text-muted-foreground">{medications.length}</span>
            </div>
            {medications.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">No active medications.</p>
            ) : (
              <ul className="divide-y">
                {medications.map((m) => (
                  <li key={m.id} className="px-4 py-3">
                    <p className="text-sm font-medium">{m.name}</p>
                    <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-muted-foreground">
                      {m.dosage && <span>{m.dosage}</span>}
                      {m.frequency && <span>{m.frequency}</span>}
                      {m.prescribed_by && <span>Prescribed by {m.prescribed_by}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* SECTION 3 — Health Timeline (always shown, complete history) */}
        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            <ActivityIcon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-gray-700">Health Timeline</h2>
            <span className="text-xs text-muted-foreground">(complete history)</span>
            <span className="ml-auto text-xs text-muted-foreground">{events.length}</span>
          </div>
          {events.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              No health history recorded for this patient yet.
            </p>
          ) : (
            <ul className="divide-y">
              {events.map((e) => {
                const badge = EVENT_BADGE[e.event_type] ?? EVENT_BADGE.other
                return (
                  <li key={e.id} className="px-4 py-3 flex items-start gap-3">
                    <span
                      className={`inline-flex h-5 shrink-0 mt-0.5 items-center rounded-full px-2 text-[11px] font-medium ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.title}</p>
                      <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{formatDate(e.event_date)}</span>
                        {e.doctor_name && <span>{e.doctor_name}</span>}
                        {e.hospital_name && <span>{e.hospital_name}</span>}
                      </div>
                      {e.condition_name && e.source !== 'diagnosis' && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                          {e.condition_name}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center space-y-1 pt-2 pb-6">
          <p className="text-xs text-muted-foreground">
            This summary was shared via FamilyCare.
            For complete medical history, please consult the patient directly.
          </p>
          <p className="text-xs text-muted-foreground">
            Link expires: {formatExpiry(shareLink.expires_at)}
          </p>
          <p className="text-xs text-gray-400 mt-3">Powered by FamilyCare</p>
        </footer>
      </main>
    </div>
  )
}
