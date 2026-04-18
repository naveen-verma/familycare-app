'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logSecondOpinionInterestAction(data: {
  memberId: string
  conditionId: string
  icd10ConditionId: string | null
}): Promise<{ success: boolean; alreadyLogged: boolean }> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Check for existing signal today before inserting
  const { data: existing } = await supabase
    .from('interest_signals')
    .select('id')
    .eq('family_member_id', data.memberId)
    .eq('medical_condition_id', data.conditionId)
    .eq('signal_type', 'second_opinion')
    .eq('signal_date', today)
    .maybeSingle()

  if (existing) {
    return { success: true, alreadyLogged: true }
  }

  const { error } = await supabase.from('interest_signals').insert({
    family_member_id: data.memberId,
    medical_condition_id: data.conditionId,
    icd10_condition_id: data.icd10ConditionId,
    signal_type: 'second_opinion',
    notified: false,
    digest_included: false,
    signal_date: today,
  })

  if (error) return { success: false, alreadyLogged: false }

  await supabase
    .from('medical_conditions')
    .update({ second_opinion_requested: true })
    .eq('id', data.conditionId)

  revalidatePath(`/members/${data.memberId}`)

  return { success: true, alreadyLogged: false }
}
