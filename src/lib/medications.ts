import { createClient } from '@/lib/supabase/server'
import type { MedicationWithCondition, MedicationLog } from '@/lib/medication-utils'

// Re-export everything from utils so server code can import from one place
export type { MedicationWithCondition, MedicationLog } from '@/lib/medication-utils'
export { getConditionName, isMedicationActive, frequencyLabel } from '@/lib/medication-utils'

// ---- Server queries ----

export async function getMedication(id: string): Promise<MedicationWithCondition | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('medications')
    .select(`
      id, name, dosage, frequency, time_of_day,
      start_date, end_date, prescribed_by,
      is_active, reminder_enabled, notes,
      family_member_id, medical_condition_id,
      created_at, updated_at, deleted_at,
      medical_conditions (
        id, custom_name, status, diagnosed_on,
        icd10_conditions (common_name)
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('[getMedication] Supabase error:', JSON.stringify(error))
    return null
  }
  if (!data) return null
  return data as unknown as MedicationWithCondition
}

export async function getMedicationsForMember(memberId: string): Promise<MedicationWithCondition[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('medications')
    .select(`
      id, name, dosage, frequency, time_of_day,
      start_date, end_date, prescribed_by,
      is_active, reminder_enabled, notes,
      family_member_id, medical_condition_id,
      created_at, updated_at, deleted_at,
      medical_conditions (
        id, custom_name, status, diagnosed_on,
        icd10_conditions (common_name)
      )
    `)
    .eq('family_member_id', memberId)
    .is('deleted_at', null)
    .order('is_active', { ascending: false })
    .order('name', { ascending: true })

  if (error || !data) return []
  return data as unknown as MedicationWithCondition[]
}

export async function getMedicationLogs(medicationId: string): Promise<MedicationLog[]> {
  const supabase = await createClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('medication_logs')
    .select('id, scheduled_time, status, responded_at')
    .eq('medication_id', medicationId)
    .gte('scheduled_time', sevenDaysAgo.toISOString())
    .order('scheduled_time', { ascending: false })

  if (error || !data) return []
  return data as MedicationLog[]
}
