'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DocumentType } from '@/types/database'

export type UploadDocumentInput = {
  familyMemberId: string
  documentType: DocumentType
  title: string
  fileUrl: string
  fileType: string
  fileSizeKb: number
  doctorName?: string
  hospitalName?: string
  documentDate?: string
  notes?: string
  medicalConditionId?: string
}

export async function saveDocumentAction(input: UploadDocumentInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .single()

  if (userError || !userProfile) throw new Error('User profile not found')

  const { error } = await supabase.from('documents').insert({
    family_member_id: input.familyMemberId,
    medical_condition_id: input.medicalConditionId || null,
    uploaded_by: userProfile.id,
    document_type: input.documentType,
    title: input.title,
    file_url: input.fileUrl,
    file_type: input.fileType,
    file_size_kb: input.fileSizeKb,
    doctor_name: input.doctorName || null,
    hospital_name: input.hospitalName || null,
    document_date: input.documentDate || null,
    notes: input.notes || null,
    phase2_ready: false, // DB trigger sets this when condition linked
  })

  if (error) throw error

  revalidatePath('/documents')
}

export async function deleteDocumentAction(documentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', documentId)

  if (error) throw error

  revalidatePath('/documents')
}

export async function toggleConditionPinAction(conditionId: string, currentlyPinned: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('medical_conditions')
    .update({ is_pinned: !currentlyPinned })
    .eq('id', conditionId)

  if (error) throw error

  revalidatePath('/documents')
}

export async function getFamilyGroupId(): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .single()

  if (!userProfile) return null

  const { data: familyGroup } = await supabase
    .from('family_groups')
    .select('id')
    .eq('owner_id', userProfile.id)
    .single()

  return familyGroup?.id ?? null
}
