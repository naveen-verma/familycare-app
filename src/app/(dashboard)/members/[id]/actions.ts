'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMemberHealthAction(
  memberId: string,
  data: {
    height_cm: number | null
    weight_kg: number | null
    bmi: number | null
    bmi_date: string | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('family_members')
    .update({
      height_cm: data.height_cm,
      weight_kg: data.weight_kg,
      bmi: data.bmi,
      bmi_date: data.bmi_date,
    })
    .eq('id', memberId)

  if (error) throw error

  revalidatePath(`/members/${memberId}`)
  revalidatePath('/documents')
}

export async function addConditionAction(
  memberId: string,
  formData: {
    icd10_condition_id?: string
    custom_name?: string
    status: string
    diagnosed_on?: string
    diagnosed_by?: string
    notes?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('medical_conditions')
    .insert({
      family_member_id: memberId,
      icd10_condition_id: formData.icd10_condition_id || null,
      custom_name: formData.custom_name || null,
      status: formData.status,
      diagnosed_on: formData.diagnosed_on || null,
      diagnosed_by: formData.diagnosed_by || null,
      notes: formData.notes || null,
      specialist_matched: false,
      second_opinion_requested: false,
    })

  if (error) throw error

  revalidatePath(`/members/${memberId}`)
  revalidatePath('/dashboard')
}

export async function editConditionAction(
  conditionId: string,
  memberId: string,
  formData: {
    status: string
    diagnosed_by?: string
    notes?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('medical_conditions')
    .update({
      status: formData.status,
      diagnosed_by: formData.diagnosed_by || null,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conditionId)

  if (error) throw error

  revalidatePath(`/members/${memberId}`)
  revalidatePath('/dashboard')
}

export async function deleteConditionAction(conditionId: string, memberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('medical_conditions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', conditionId)

  if (error) throw error

  revalidatePath(`/members/${memberId}`)
  revalidatePath('/dashboard')
}

export async function addConsultationAction(
  conditionId: string,
  memberId: string,
  formData: {
    doctor_name: string
    hospital_name?: string
    consultation_date?: string
    notes?: string
    consultation_type?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('condition_consultations')
    .insert({
      medical_condition_id: conditionId,
      doctor_name: formData.doctor_name,
      hospital_name: formData.hospital_name || null,
      consultation_date: formData.consultation_date || null,
      notes: formData.notes || null,
      consultation_type: formData.consultation_type || 'visit',
    })

  if (error) throw error

  revalidatePath(`/members/${memberId}`)
}

export async function deleteConsultationAction(
  consultationId: string,
  memberId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('condition_consultations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', consultationId)

  if (error) throw error

  revalidatePath(`/members/${memberId}`)
}
