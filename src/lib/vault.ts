import { createClient } from '@/lib/supabase/server'
import type {
  VaultDocument,
  VaultCondition,
  VaultMember,
  ViewReportDocument,
  ViewReportCondition,
} from '@/lib/vault-types'

export type { VaultDocument, VaultCondition, VaultMember, ViewReportDocument, ViewReportCondition }
export { DOC_TYPE_ORDER, DOC_TYPE_LABELS } from '@/lib/vault-types'

export async function getVaultData(): Promise<VaultMember[]> {
  const supabase = await createClient()

  const { data: members, error: membersError } = await supabase
    .from('family_members')
    .select('id, full_name, date_of_birth, blood_group, relation')
    .is('deleted_at', null)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (membersError || !members?.length) return []

  const memberIds = members.map((m) => m.id)

  const [{ data: conditions }, { data: documents }] = await Promise.all([
    supabase
      .from('medical_conditions')
      .select(
        'id, family_member_id, custom_name, status, diagnosed_on, icd10_conditions(name, common_name)'
      )
      .in('family_member_id', memberIds)
      .is('deleted_at', null)
      .order('diagnosed_on', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('documents')
      .select(
        'id, family_member_id, medical_condition_id, title, document_type, document_date, doctor_name, hospital_name, notes, file_url, file_type, file_size_kb, phase2_ready'
      )
      .in('family_member_id', memberIds)
      .is('deleted_at', null)
      .order('document_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ])

  const docsByMember: Record<string, VaultDocument[]> = {}
  for (const doc of documents || []) {
    if (!docsByMember[doc.family_member_id]) docsByMember[doc.family_member_id] = []
    docsByMember[doc.family_member_id].push(doc as unknown as VaultDocument)
  }

  const condsByMember: Record<string, any[]> = {}
  for (const cond of conditions || []) {
    if (!condsByMember[cond.family_member_id]) condsByMember[cond.family_member_id] = []
    condsByMember[cond.family_member_id].push(cond)
  }

  return members.map((member) => {
    const memberDocs = docsByMember[member.id] || []
    const memberConds = condsByMember[member.id] || []

    const vaultConditions: VaultCondition[] = memberConds.map((cond) => {
      const ic = cond.icd10_conditions as { name: string; common_name: string | null } | null
      const name = ic?.common_name ?? ic?.name ?? cond.custom_name ?? 'Unknown Condition'
      return {
        id: cond.id,
        name,
        status: cond.status,
        diagnosed_on: cond.diagnosed_on,
        documents: memberDocs.filter((d) => d.medical_condition_id === cond.id),
      }
    })

    return {
      id: member.id,
      full_name: member.full_name,
      date_of_birth: member.date_of_birth,
      blood_group: member.blood_group,
      relation: member.relation,
      conditions: vaultConditions,
      general_documents: memberDocs.filter((d) => !d.medical_condition_id),
    }
  })
}

export async function getViewReportData(memberId: string, conditionId: string) {
  const supabase = await createClient()

  const [memberResult, conditionResult, docsResult] = await Promise.all([
    supabase
      .from('family_members')
      .select('id, full_name, date_of_birth, blood_group')
      .eq('id', memberId)
      .is('deleted_at', null)
      .single(),

    conditionId === 'general'
      ? Promise.resolve({ data: null })
      : supabase
          .from('medical_conditions')
          .select('id, custom_name, status, diagnosed_on, icd10_conditions(name, common_name)')
          .eq('id', conditionId)
          .is('deleted_at', null)
          .single(),

    conditionId === 'general'
      ? supabase
          .from('documents')
          .select(
            'id, family_member_id, medical_condition_id, title, document_type, document_date, doctor_name, hospital_name, notes, file_url, file_type, file_size_kb, phase2_ready'
          )
          .eq('family_member_id', memberId)
          .is('medical_condition_id', null)
          .is('deleted_at', null)
          .order('document_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
      : supabase
          .from('documents')
          .select(
            'id, family_member_id, medical_condition_id, title, document_type, document_date, doctor_name, hospital_name, notes, file_url, file_type, file_size_kb, phase2_ready'
          )
          .eq('family_member_id', memberId)
          .eq('medical_condition_id', conditionId)
          .is('deleted_at', null)
          .order('document_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }),
  ])

  if (memberResult.error || !memberResult.data) return null

  let condition: ViewReportCondition = null
  if (conditionId !== 'general' && conditionResult.data) {
    const raw = conditionResult.data as any
    const ic = raw.icd10_conditions as { name: string; common_name: string | null } | null
    condition = {
      id: raw.id,
      name: ic?.common_name ?? ic?.name ?? raw.custom_name ?? 'Unknown',
      status: raw.status,
      diagnosed_on: raw.diagnosed_on,
    }
  }

  const docs: ViewReportDocument[] = await Promise.all(
    (docsResult.data || []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from('familycare-docs')
        .createSignedUrl(doc.file_url, 3600)
      return { ...(doc as unknown as VaultDocument), signed_url: signed?.signedUrl ?? null }
    })
  )

  return { member: memberResult.data, condition, documents: docs }
}

export type UploadConditionOption = {
  id: string
  name: string
  status: string
  diagnosed_on: string | null
}

export async function getMemberConditionOptions(
  memberId: string
): Promise<UploadConditionOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('medical_conditions')
    .select('id, custom_name, status, diagnosed_on, icd10_conditions(name, common_name)')
    .eq('family_member_id', memberId)
    .is('deleted_at', null)
    .order('diagnosed_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return []

  return (data || []).map((c: any) => {
    const ic = c.icd10_conditions as { name: string; common_name: string | null } | null
    return {
      id: c.id,
      name: ic?.common_name ?? ic?.name ?? c.custom_name ?? 'Unknown',
      status: c.status,
      diagnosed_on: c.diagnosed_on,
    }
  })
}
