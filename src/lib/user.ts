import { createClient } from '@/lib/supabase/client'

export async function checkOnboardingStatus(): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .rpc('has_completed_onboarding', {
      user_auth_id: user.id
    })

  if (error) return false
  return data as boolean
}

export async function getCurrentUserProfile() {
  const supabase = createClient()

  const { data, error } = await supabase
    .rpc('get_current_user_profile')

  if (error) return null
  return data
}