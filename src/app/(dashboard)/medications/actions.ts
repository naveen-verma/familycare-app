'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type MedicationFormInput = {
  family_member_id: string
  medical_condition_id?: string
  name: string
  dosage?: string
  frequency?: string
  time_of_day?: string[]
  start_date?: string
  end_date?: string
  prescribed_by?: string
  reminder_enabled: boolean
  notes?: string
}

export async function addMedicationAction(input: MedicationFormInput) {
  const supabase = await createClient()

  const { error } = await supabase.from('medications').insert({
    family_member_id: input.family_member_id,
    medical_condition_id: input.medical_condition_id || null,
    name: input.name.trim(),
    dosage: input.dosage?.trim() || null,
    frequency: input.frequency || null,
    time_of_day: input.time_of_day?.filter(Boolean).length ? input.time_of_day.filter(Boolean) : null,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    prescribed_by: input.prescribed_by?.trim() || null,
    is_active: true,
    reminder_enabled: input.reminder_enabled,
    notes: input.notes?.trim() || null,
  })

  if (error) throw error
  revalidatePath('/medications')
}

export async function updateMedicationAction(id: string, input: Omit<MedicationFormInput, 'family_member_id'>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('medications')
    .update({
      medical_condition_id: input.medical_condition_id || null,
      name: input.name.trim(),
      dosage: input.dosage?.trim() || null,
      frequency: input.frequency || null,
      time_of_day: input.time_of_day?.filter(Boolean).length ? input.time_of_day.filter(Boolean) : null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      prescribed_by: input.prescribed_by?.trim() || null,
      reminder_enabled: input.reminder_enabled,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/medications')
  revalidatePath(`/medications/${id}`)
}

export async function toggleReminderAction(medicationId: string, currentlyEnabled: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('medications')
    .update({ reminder_enabled: !currentlyEnabled })
    .eq('id', medicationId)

  if (error) throw error
  revalidatePath('/medications')
  revalidatePath(`/medications/${medicationId}`)
}

export async function setMedicationActiveAction(medicationId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('medications')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', medicationId)

  if (error) throw error
  revalidatePath('/medications')
  revalidatePath(`/medications/${medicationId}`)
}
