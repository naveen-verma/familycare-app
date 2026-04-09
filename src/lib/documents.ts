import { createClient } from '@/lib/supabase/server'
import type { Document, DocumentType } from '@/types/database'

export type DocumentWithMember = Document & {
  family_members: { full_name: string } | null
  medical_conditions: { custom_name: string | null; icd10_conditions: { name: string; common_name: string | null } | null } | null
}

export type DocumentFilters = {
  memberId?: string
  documentType?: DocumentType
  dateFrom?: string
  dateTo?: string
}

export async function getDocuments(filters?: DocumentFilters): Promise<DocumentWithMember[]> {
  const supabase = await createClient()

  let query = supabase
    .from('documents')
    .select(`
      *,
      family_members(full_name),
      medical_conditions(custom_name, icd10_conditions(name, common_name))
    `)
    .is('deleted_at', null)
    .order('document_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters?.memberId) {
    query = query.eq('family_member_id', filters.memberId)
  }
  if (filters?.documentType) {
    query = query.eq('document_type', filters.documentType)
  }
  if (filters?.dateFrom) {
    query = query.gte('document_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('document_date', filters.dateTo)
  }

  const { data, error } = await query

  if (error) return []
  return (data || []) as DocumentWithMember[]
}

export async function getDocument(id: string): Promise<DocumentWithMember | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      family_members(full_name),
      medical_conditions(custom_name, icd10_conditions(name, common_name))
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as DocumentWithMember
}

export async function getMemberConditionsForUpload(memberId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('medical_conditions')
    .select('id, custom_name, icd10_conditions(name, common_name)')
    .eq('family_member_id', memberId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []) as unknown as Array<{
    id: string
    custom_name: string | null
    icd10_conditions: { name: string; common_name: string | null } | null
  }>
}
