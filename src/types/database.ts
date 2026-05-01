export type UserRole = 'owner' | 'caregiver' | 'viewer'
export type Gender = 'male' | 'female' | 'other'
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'
export type Relation = 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
export type ConditionStatus = 'active' | 'resolved' | 'chronic' | 'monitoring'
export type DocumentType = 'prescription' | 'report' | 'scan' | 'insurance' | 'vaccination' | 'other'
export type EventType = 'visit' | 'surgery' | 'test' | 'vaccination' | 'hospitalization' | 'therapy' | 'other'
export type MedicationFrequency = 'once daily' | 'twice daily' | 'three times daily' | 'four times daily' | 'every alternate day' | 'weekly' | 'as needed' | 'other'
export type ConsultationType = 'visit' | 'surgery' | 'test' | 'vaccination' | 'hospitalization' | 'therapy' | 'other'

export interface User {
  id: string
  supabase_auth_id: string
  full_name: string
  mobile: string
  email?: string
  city?: string
  state?: string
  role: UserRole
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface FamilyGroup {
  id: string
  owner_id: string
  group_name: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface FamilyMember {
  id: string
  family_group_id: string
  full_name: string
  date_of_birth?: string
  gender?: Gender
  blood_group?: BloodGroup
  relation?: Relation
  mobile?: string
  is_primary: boolean
  profile_photo_url?: string
  height_cm?: number | null
  weight_kg?: number | null
  bmi?: number | null
  bmi_date?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface ICD10Condition {
  id: string
  icd10_code: string
  name: string
  common_name?: string
  category?: string
  is_critical: boolean
}

export interface MedicalCondition {
  id: string
  family_member_id: string
  icd10_condition_id?: string
  custom_name?: string
  diagnosed_on?: string
  diagnosed_by?: string
  status: ConditionStatus
  notes?: string
  is_pinned: boolean
  specialist_matched: boolean
  second_opinion_requested: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  icd10_conditions?: ICD10Condition
}

export interface Document {
  id: string
  family_member_id: string
  medical_condition_id?: string
  uploaded_by: string
  document_type: DocumentType
  title: string
  file_url: string
  file_type?: string
  file_size_kb?: number
  doctor_name?: string
  hospital_name?: string
  document_date?: string
  notes?: string
  phase2_ready: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Medication {
  id: string
  family_member_id: string
  medical_condition_id?: string
  name: string
  dosage?: string
  frequency?: MedicationFrequency
  time_of_day?: string[]
  start_date?: string
  end_date?: string
  prescribed_by?: string
  is_active: boolean
  reminder_enabled: boolean
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface ConditionConsultation {
  id: string
  medical_condition_id: string | null
  consultation_type: ConsultationType
  doctor_name: string
  hospital_name?: string
  consultation_date?: string
  notes?: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface MedicalEvent {
  id: string
  family_member_id: string
  medical_condition_id?: string
  event_type: EventType
  title: string
  event_date: string
  hospital_name?: string
  doctor_name?: string
  notes?: string
  follow_up_date?: string
  follow_up_sent: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface InterestSignal {
  id: string
  family_member_id: string
  medical_condition_id: string
  icd10_condition_id: string | null
  signal_type: string
  notified: boolean
  digest_included: boolean
  signal_date: string
  created_at: string
}

export interface ShareLink {
  id: string
  family_member_id: string
  created_by: string
  token: string
  expires_at: string
  is_active: boolean
  recipient_mobile?: string | null
  recipient_name?: string | null
  doctor_name?: string | null
  opened_at?: string | null
  open_count: number
  view_count: number
  include_conditions: boolean
  include_medications: boolean
  include_documents: boolean
  include_timeline: boolean
  selected_condition_ids: string[]
  created_at: string
}