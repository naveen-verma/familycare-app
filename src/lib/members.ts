import { createClient } from '@/lib/supabase/server'

export type MemberWithConditions = {
  id: string
  full_name: string
  date_of_birth: string | null
  gender: string | null
  blood_group: string | null
  relation: string | null
  mobile: string | null
  is_primary: boolean
  profile_photo_url: string | null
  created_at: string
  medical_conditions: Array<{
    id: string
    status: string
    custom_name: string | null
    deleted_at: string | null
    icd10_conditions: { name: string; common_name: string | null } | null
  }>
}

export async function getFamilyMembers(): Promise<MemberWithConditions[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('family_members')
    .select(`
      id, full_name, date_of_birth, gender, blood_group, relation,
      mobile, is_primary, profile_photo_url, created_at,
      medical_conditions(
        id, status, custom_name, deleted_at,
        icd10_conditions(name, common_name)
      )
    `)
    .is('deleted_at', null)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) return []

  return (data || []).map(member => ({
    ...member,
    medical_conditions: ((member.medical_conditions as any[]) || []).filter(
      (c) => !c.deleted_at
    ),
  })) as MemberWithConditions[]
}

export async function getMember(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data
}
