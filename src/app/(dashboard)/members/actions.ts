'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addMemberAction(formData: {
  full_name: string
  date_of_birth?: string
  gender?: string
  blood_group?: string
  relation?: string
  mobile?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .single()

  if (userError || !userProfile) throw new Error('User profile not found')

  const { data: familyGroup, error: groupError } = await supabase
    .from('family_groups')
    .select('id')
    .eq('owner_id', userProfile.id)
    .single()

  if (groupError || !familyGroup) throw new Error('Family group not found')

  const { error } = await supabase
    .from('family_members')
    .insert({
      family_group_id: familyGroup.id,
      full_name: formData.full_name,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      blood_group: formData.blood_group || null,
      relation: formData.relation || null,
      mobile: formData.mobile || null,
      is_primary: false,
    })

  if (error) throw error

  revalidatePath('/dashboard')
  revalidatePath('/members')
}

export async function deleteMemberAction(memberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('family_members')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) throw error

  revalidatePath('/dashboard')
  revalidatePath('/members')
}
