import type { DocumentType } from '@/types/database'

// ---- Shared types ----

export type VaultDocument = {
  id: string
  title: string
  document_type: DocumentType
  document_date: string | null
  doctor_name: string | null
  hospital_name: string | null
  notes: string | null
  file_url: string
  file_type: string | null
  file_size_kb: number | null
  phase2_ready: boolean
  medical_condition_id: string | null
}

export type VaultCondition = {
  id: string
  name: string
  status: string
  diagnosed_on: string | null
  documents: VaultDocument[]
}

export type VaultMember = {
  id: string
  full_name: string
  date_of_birth: string | null
  blood_group: string | null
  relation: string | null
  conditions: VaultCondition[]
  general_documents: VaultDocument[]
}

export type ViewReportDocument = VaultDocument & { signed_url: string | null }

export type ViewReportCondition = {
  id: string
  name: string
  status: string
  diagnosed_on: string | null
} | null

// ---- Shared constants (safe for client components) ----

export const DOC_TYPE_ORDER: DocumentType[] = [
  'prescription',
  'report',
  'scan',
  'vaccination',
  'insurance',
  'other',
]

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  prescription: 'Prescriptions',
  report: 'Lab Reports',
  scan: 'Scans',
  vaccination: 'Vaccinations',
  insurance: 'Insurance',
  other: 'Other',
}
