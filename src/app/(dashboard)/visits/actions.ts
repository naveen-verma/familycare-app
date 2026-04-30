'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DocumentType, ConsultationType } from '@/types/database'

export type LogVisitInput = {
  memberId: string
  // Step 2
  doctorName: string
  hospitalName?: string
  consultationDate: string
  consultationType: ConsultationType
  visitNotes?: string
  // Step 3 — condition (optional)
  conditionMode: 'new_icd10' | 'existing' | 'custom' | 'skip'
  existingConditionId?: string
  icd10ConditionId?: string
  customConditionName?: string
  // Step 4 — document (optional, file already uploaded to storage)
  document?: {
    title: string
    fileUrl: string
    fileType: string
    fileSizeKb: number
    documentType: DocumentType
    notes?: string
  }
  // Step 5 — medications (optional)
  medications?: Array<{
    name: string
    dosage?: string
    frequency?: string
    startDate?: string
    timeOfDay?: string[]
  }>
}

export type LogVisitResult = {
  conditionCreated: boolean
  documentSaved: boolean
  medicationCount: number
}

export async function logVisitAction(input: LogVisitInput): Promise<LogVisitResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .single()
  if (profileError || !userProfile) throw new Error('User profile not found')

  let medicalConditionId: string | null = null
  let conditionCreated = false

  // Guard: condition_name_required CHECK constraint
  if (input.conditionMode === 'new_icd10' && !input.icd10ConditionId) {
    throw new Error('Please select a condition from the list')
  }
  if (input.conditionMode === 'custom' && !input.customConditionName?.trim()) {
    throw new Error('Please enter a condition name')
  }

  // 1 — Create a new condition if needed
  if (input.conditionMode === 'new_icd10' || input.conditionMode === 'custom') {
    const { data: condition, error } = await supabase
      .from('medical_conditions')
      .insert({
        family_member_id: input.memberId,
        icd10_condition_id:
          input.conditionMode === 'new_icd10' ? (input.icd10ConditionId ?? null) : null,
        custom_name:
          input.conditionMode === 'custom' ? (input.customConditionName?.trim() ?? null) : null,
        status: 'active',
        diagnosed_on: input.consultationDate || null,
        diagnosed_by: input.doctorName || null,
        specialist_matched: false,
        second_opinion_requested: false,
      })
      .select('id')
      .single()
    if (error) throw error
    medicalConditionId = condition.id
    conditionCreated = true
  } else if (input.conditionMode === 'existing' && input.existingConditionId) {
    medicalConditionId = input.existingConditionId
  }

  // 2 — Create consultation record (medical_condition_id may be null for routine visits)
  const { error: consultError } = await supabase.from('condition_consultations').insert({
    medical_condition_id: medicalConditionId,
    doctor_name: input.doctorName,
    hospital_name: input.hospitalName || null,
    consultation_date: input.consultationDate || null,
    consultation_type: input.consultationType,
    notes: input.visitNotes || null,
  })
  if (consultError) throw consultError

  // 3 — Save document record (file already uploaded to storage by caller)
  let documentSaved = false
  if (input.document) {
    const { error: docError } = await supabase.from('documents').insert({
      family_member_id: input.memberId,
      medical_condition_id: medicalConditionId,
      uploaded_by: userProfile.id,
      document_type: input.document.documentType,
      title: input.document.title,
      file_url: input.document.fileUrl,
      file_type: input.document.fileType,
      file_size_kb: input.document.fileSizeKb,
      doctor_name: input.doctorName,
      hospital_name: input.hospitalName || null,
      document_date: input.consultationDate || null,
      notes: input.document.notes || null,
      phase2_ready: false,
    })
    if (docError) throw docError
    documentSaved = true
  }

  // 4 — Create medication records
  let medicationCount = 0
  for (const med of input.medications ?? []) {
    if (!med.name.trim()) continue
    const { error: medError } = await supabase.from('medications').insert({
      family_member_id: input.memberId,
      medical_condition_id: medicalConditionId,
      name: med.name.trim(),
      dosage: med.dosage?.trim() || null,
      frequency: med.frequency || null,
      time_of_day: med.timeOfDay ?? [],
      start_date: med.startDate || null,
      prescribed_by: input.doctorName || null,
      is_active: true,
      reminder_enabled: false,
    })
    if (medError) throw medError
    medicationCount++
  }

  revalidatePath('/dashboard')
  revalidatePath(`/members/${input.memberId}`)
  revalidatePath('/documents')
  revalidatePath('/medications')

  return { conditionCreated, documentSaved, medicationCount }
}
