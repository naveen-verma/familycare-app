// Client-safe types and helpers for medications.
// No server-only imports here — safe to use in client components.

// ---- Types ----

export type MedicationWithCondition = {
  id: string
  family_member_id: string
  medical_condition_id: string | null
  name: string
  dosage: string | null
  frequency: string | null
  time_of_day: string[] | null
  start_date: string | null
  end_date: string | null
  prescribed_by: string | null
  is_active: boolean
  reminder_enabled: boolean
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  medical_conditions: {
    id: string
    custom_name: string | null
    status: string
    diagnosed_on: string | null
    icd10_conditions: { common_name: string | null } | null
  } | null
}

export type MedicationLog = {
  id: string
  scheduled_time: string
  status: 'taken' | 'skipped' | 'snoozed' | 'pending'
  responded_at: string | null
}

// ---- Helpers ----

export function getConditionName(med: MedicationWithCondition): string | null {
  const mc = med.medical_conditions
  if (!mc) return null
  return mc.icd10_conditions?.common_name ?? mc.custom_name ?? null
}

export function isMedicationActive(
  med: Pick<MedicationWithCondition, 'is_active' | 'end_date'>
): boolean {
  if (!med.is_active) return false
  if (!med.end_date) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(med.end_date) >= today
}

export function frequencyLabel(freq: string | null): string {
  if (!freq) return ''
  const map: Record<string, string> = {
    'once daily': 'Once Daily',
    'twice daily': 'Twice Daily',
    'three times daily': 'Three Times Daily',
    'four times daily': 'Four Times Daily',
    'every alternate day': 'Every Alternate Day',
    weekly: 'Weekly',
    'as needed': 'As Needed',
    other: 'Other',
  }
  return map[freq] ?? freq
}
