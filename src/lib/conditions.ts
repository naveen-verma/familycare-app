import { createClient } from '@/lib/supabase/server'
import type { ICD10Condition, MedicalCondition, ConditionConsultation } from '@/types/database'

export type ConditionWithICD10 = MedicalCondition & {
  icd10_conditions: ICD10Condition | null
  condition_consultations: ConditionConsultation[]
}

export async function getMemberConditions(memberId: string): Promise<ConditionWithICD10[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('medical_conditions')
    .select(`
      *,
      icd10_conditions(*),
      condition_consultations(*)
    `)
    .eq('family_member_id', memberId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return []

  return (data || []).map((c) => ({
    ...c,
    condition_consultations: ((c.condition_consultations as any[]) || [])
      .filter((con) => !con.deleted_at)
      .sort(
        (a, b) =>
          new Date(b.consultation_date ?? b.created_at).getTime() -
          new Date(a.consultation_date ?? a.created_at).getTime()
      ),
  })) as ConditionWithICD10[]
}

export async function getICD10Conditions(): Promise<ICD10Condition[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('icd10_conditions')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) return []
  return (data || []) as ICD10Condition[]
}
