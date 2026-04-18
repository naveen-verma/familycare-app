import { createClient } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import type { ShareLink } from '@/types/database'

// Plain anon client — no cookie/session handling.
// Used for the public /view/[token] page (RPC call + public storage URLs).
function createPublicClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Generate public storage URLs for documents on the share view page.
// The familycare-docs bucket has a public read policy, so no auth
// or service role key is required.  getPublicUrl() is a pure URL
// constructor — it makes no network request.
function generatePublicUrls(filePaths: string[]): Record<string, string> {
  if (!filePaths.length) return {}
  const supabase = createPublicClient()
  return Object.fromEntries(
    filePaths.map((path) => {
      const { data } = supabase.storage.from('familycare-docs').getPublicUrl(path)
      return [path, data.publicUrl]
    })
  )
}

// ---- Types ----

export type ShareLinkWithMember = ShareLink & {
  family_members: {
    id: string
    full_name: string
    date_of_birth: string | null
    gender: string | null
    blood_group: string | null
    height_cm: number | null
    weight_kg: number | null
    bmi: number | null
    bmi_date: string | null
  }
}

export type ShareViewData = {
  shareLink: ShareLink
  member: {
    id: string
    full_name: string
    date_of_birth: string | null
    gender: string | null
    blood_group: string | null
    height_cm: number | null
    weight_kg: number | null
    bmi: number | null
    bmi_date: string | null
  }
  conditions: Array<{
    id: string
    custom_name: string | null
    status: string
    diagnosed_on: string | null
    diagnosed_by: string | null
    notes: string | null
    is_pinned: boolean
    icd10_conditions: { name: string; common_name: string | null; icd10_code: string } | null
  }>
  medications: Array<{
    id: string
    name: string
    dosage: string | null
    frequency: string | null
    prescribed_by: string | null
    is_active: boolean
    start_date: string | null
    medical_condition_id: string | null
  }>
  documents: Array<{
    id: string
    title: string
    document_type: string
    document_date: string | null
    doctor_name: string | null
    hospital_name: string | null
    file_url: string
    file_type: string | null
    file_size_kb: number | null
    medical_condition_id: string | null
    condition_name: string | null
    signed_url: string | null
  }>
  events: Array<{
    id: string
    event_type: string
    source: 'diagnosis' | 'consultation' | 'document'
    title: string
    event_date: string
    hospital_name: string | null
    doctor_name: string | null
    notes: string | null
    condition_name: string | null
  }>
}

// ---- Queries ----

export async function getShareLinksByUser(): Promise<ShareLinkWithMember[]> {
  const supabase = await createClient()

  const { data: authUser } = await supabase.auth.getUser()
  if (!authUser.user) return []

  // Get public user id
  const { data: profile } = await supabase
    .rpc('get_current_user_profile')

  if (!profile) return []

  const { data, error } = await supabase
    .from('share_links')
    .select(`
      *,
      family_members (
        id, full_name, date_of_birth, gender, blood_group,
        height_cm, weight_kg, bmi, bmi_date
      )
    `)
    .eq('created_by', profile.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as unknown as ShareLinkWithMember[]
}

export async function getShareViewData(token: string): Promise<ShareViewData | null> {
  const supabase = createPublicClient()

  // Single SECURITY DEFINER RPC call — validates token, increments view_count,
  // and returns all data. The anon client cannot read other tables directly
  // (no RLS policies for unauthenticated users), so the function runs with
  // elevated DB privileges while still requiring a valid active token.
  const { data, error } = await supabase
    .rpc('get_share_view_data_by_token', { p_token: token })

  if (error || !data) return null

  type RawDocument = Omit<ShareViewData['documents'][number], 'signed_url'>

  const payload = data as {
    share_link: ShareLink
    member: ShareViewData['member']
    conditions: ShareViewData['conditions']
    medications: ShareViewData['medications']
    documents: RawDocument[]
    events: ShareViewData['events']
  }

  if (!payload.share_link || !payload.member) return null

  // Generate public storage URLs for each document.
  // The familycare-docs bucket has a public read policy so no
  // service role key or auth is needed — getPublicUrl() is pure URL construction.
  const rawDocs: RawDocument[] = payload.documents ?? []
  const filePaths = rawDocs.map((d) => d.file_url).filter(Boolean)
  const publicUrls = generatePublicUrls(filePaths)

  const documents: ShareViewData['documents'] = rawDocs.map((d) => ({
    ...d,
    signed_url: publicUrls[d.file_url] ?? null,
  }))

  return {
    shareLink: payload.share_link,
    member: payload.member,
    conditions: payload.conditions ?? [],
    medications: payload.medications ?? [],
    documents,
    events: payload.events ?? [],
  }
}
