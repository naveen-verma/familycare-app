import { createClient } from '@/lib/supabase/client'

export async function updateUserProfile(data: {
  full_name: string
  mobile: string
  city?: string
  state?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('users')
    .update({
      full_name: data.full_name,
      mobile: data.mobile,
      city: data.city,
      state: data.state,
      updated_at: new Date().toISOString()
    })
    .eq('supabase_auth_id', user.id)

  if (error) throw error
}

export async function createPrimaryFamilyMember(data: {
  full_name: string
  date_of_birth?: string
  gender?: string
  blood_group?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get family group for this user
  const { data: profile } = await supabase
    .from('users')
    .select(`
      id,
      family_groups (id)
    `)
    .eq('supabase_auth_id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  const familyGroup = (profile.family_groups as any[])?.[0]
  if (!familyGroup) throw new Error('Family group not found')

  const { error } = await supabase
    .from('family_members')
    .insert({
      family_group_id: familyGroup.id,
      full_name: data.full_name,
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || null,
      blood_group: data.blood_group || null,
      relation: 'self',
      is_primary: true
    })

  if (error) throw error
}