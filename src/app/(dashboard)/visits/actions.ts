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
    fileType: string   // raw MIME type from browser e.g. "image/png"
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
    endDate?: string
    timeOfDay?: string[]
    reminderEnabled?: boolean
  }>
}

export type LogVisitResult = {
  conditionCreated: boolean
  documentSaved: boolean
  medicationCount: number
}

// Maps browser MIME type to the values accepted by documents_file_type_check:
// CHECK (file_type = ANY (ARRAY['pdf','jpg','jpeg','png']))
function toDbFileType(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png':       'png',
    'image/jpeg':      'jpeg',
    'image/jpg':       'jpg',
  }
  return map[mimeType] ?? 'pdf'
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
      file_type: toDbFileType(input.document.fileType),
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
      end_date: med.endDate || null,
      prescribed_by: input.doctorName || null,
      is_active: true,
      reminder_enabled: med.reminderEnabled ?? true,
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

// ─── Health Event Logger — new 4-step flow ────────────────────────────────────

export type SaveHealthEventInput = {
  memberId: string
  conditionType: 'new' | 'existing' | 'skip'
  conditionName?: string
  icd10ConditionId?: string | null
  existingConditionId?: string
  visitDetails: {
    doctor_name: string
    hospital_name: string
    visit_date: string
    visit_type: ConsultationType
    notes: string
  }
  documents: Array<{
    fileUrl: string
    mimeType: string
    fileSizeKb: number
    title: string
    documentType: DocumentType
  }>
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    timeOfDay?: string[]
    notes?: string
    startDate?: string
    endDate?: string
    prescribedBy?: string
    reminderEnabled: boolean
  }>
}

export type SaveHealthEventResult = {
  conditionCreated: boolean
  documentCount: number
  medicationCount: number
}

export async function saveHealthEventAction(
  input: SaveHealthEventInput
): Promise<SaveHealthEventResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .single()
  if (profileErr || !profile) throw new Error('User profile not found')

  let medicalConditionId: string | null = null
  let conditionCreated = false

  // 1 — Create new condition (ICD-10 or custom; WF5 will ICD-10 match custom in background)
  if (input.conditionType === 'new' && (input.conditionName?.trim() || input.icd10ConditionId)) {
    const { data: condition, error } = await supabase
      .from('medical_conditions')
      .insert({
        family_member_id: input.memberId,
        icd10_condition_id: input.icd10ConditionId ?? null,
        custom_name: input.icd10ConditionId ? null : (input.conditionName?.trim() ?? null),
        status: 'active',
        diagnosed_on: input.visitDetails.visit_date || null,
        diagnosed_by: input.visitDetails.doctor_name || null,
        specialist_matched: false,
        second_opinion_requested: false,
      })
      .select('id')
      .single()
    if (error) throw error
    medicalConditionId = condition.id
    conditionCreated = true
  } else if (input.conditionType === 'existing' && input.existingConditionId) {
    medicalConditionId = input.existingConditionId
  }

  // 2 — Create consultation record
  const { error: consultError } = await supabase.from('condition_consultations').insert({
    medical_condition_id: medicalConditionId,
    doctor_name: input.visitDetails.doctor_name || null,
    hospital_name: input.visitDetails.hospital_name || null,
    consultation_date: input.visitDetails.visit_date || null,
    consultation_type: input.visitDetails.visit_type,
    notes: input.visitDetails.notes || null,
  })
  if (consultError) throw consultError

  // 3 — Save document records (files already uploaded to storage by caller)
  let documentCount = 0
  for (const doc of input.documents) {
    const { error: docError } = await supabase.from('documents').insert({
      family_member_id: input.memberId,
      medical_condition_id: medicalConditionId,
      uploaded_by: profile.id,
      document_type: doc.documentType,
      title: doc.title,
      file_url: doc.fileUrl,
      file_type: toDbFileType(doc.mimeType),
      file_size_kb: doc.fileSizeKb,
      doctor_name: input.visitDetails.doctor_name || null,
      hospital_name: input.visitDetails.hospital_name || null,
      document_date: input.visitDetails.visit_date || null,
      phase2_ready: false,
    })
    if (docError) throw docError
    documentCount++
  }

  // 4 — Create medication records
  let medicationCount = 0
  for (const med of input.medications) {
    if (!med.name.trim()) continue
    const { error: medError } = await supabase.from('medications').insert({
      family_member_id: input.memberId,
      medical_condition_id: medicalConditionId,
      name: med.name.trim(),
      dosage: med.dosage?.trim() || null,
      frequency: med.frequency || null,
      time_of_day: med.timeOfDay?.length ? med.timeOfDay : ['08:00'],
      notes: med.notes?.trim() || null,
      start_date: med.startDate || input.visitDetails.visit_date || null,
      end_date: med.endDate || null,
      prescribed_by: med.prescribedBy?.trim() || input.visitDetails.doctor_name || null,
      is_active: true,
      reminder_enabled: med.reminderEnabled ?? false,
    })
    if (medError) throw medError
    medicationCount++
  }

  revalidatePath('/dashboard')
  revalidatePath(`/members/${input.memberId}`)
  revalidatePath('/documents')
  revalidatePath('/medications')

  return { conditionCreated, documentCount, medicationCount }
}
