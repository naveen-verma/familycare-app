import { createClient } from '@/lib/supabase/server'
import type { TimelineEvent, TimelineYearGroup, TimelineFamilyMember } from '@/lib/timeline-types'

export type { TimelineEvent, TimelineYearGroup, TimelineFamilyMember }
export { groupEventsByYearMonth } from '@/lib/timeline-types'

// ---- Fetch all events for the current user's family ----

export async function getTimelineData(
  memberIdFilter?: string,
  eventTypeFilter?: string
): Promise<TimelineEvent[]> {
  const supabase = await createClient()

  let query = supabase
    .from('medical_events')
    .select(`
      id,
      event_type,
      title,
      event_date,
      hospital_name,
      doctor_name,
      notes,
      follow_up_date,
      follow_up_sent,
      is_pinned,
      family_member_id,
      medical_condition_id,
      family_members (
        id,
        full_name,
        relation,
        height_cm,
        weight_kg,
        bmi,
        bmi_date
      ),
      medical_conditions (
        id,
        custom_name,
        status,
        diagnosed_on,
        icd10_conditions (
          common_name
        )
      )
    `)
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('event_date', { ascending: false })

  if (memberIdFilter) {
    query = query.eq('family_member_id', memberIdFilter)
  }
  if (eventTypeFilter) {
    query = query.eq('event_type', eventTypeFilter)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data as unknown as TimelineEvent[]
}

// ---- Get a single event by ID ----

export async function getTimelineEvent(eventId: string): Promise<TimelineEvent | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('medical_events')
    .select(`
      id,
      event_type,
      title,
      event_date,
      hospital_name,
      doctor_name,
      notes,
      follow_up_date,
      follow_up_sent,
      is_pinned,
      family_member_id,
      medical_condition_id,
      family_members (
        id,
        full_name,
        relation,
        height_cm,
        weight_kg,
        bmi,
        bmi_date
      ),
      medical_conditions (
        id,
        custom_name,
        status,
        diagnosed_on,
        icd10_conditions (
          common_name
        )
      )
    `)
    .eq('id', eventId)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null
  return data as unknown as TimelineEvent
}
