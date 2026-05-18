'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  X,
  Upload,
  FileText,
  FileImage,
  Sparkles,
  Loader2,
  AlertCircle,
  Pill,
  CheckCircle,
  Check,
  Plus,
  Trash2,
  Bell,
  BellOff,
} from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { createClient } from '@/lib/supabase/client'
import { useDocumentExtraction } from '@/hooks/useDocumentExtraction'
import type { FamilyMemberSummary } from '@/components/dashboard/QuickActionsBar'
import type { ConsultationType, DocumentType } from '@/types/database'
import { saveHealthEventAction } from '@/app/(dashboard)/visits/actions'
import {
  validateName,
  validateMedicationName,
  validateDosage,
  validateDocumentTitle,
} from '@/lib/validation/inputs'

// ─── Constants ────────────────────────────────────────────────────────────────

const VISIT_TYPES: { value: ConsultationType; label: string }[] = [
  { value: 'visit',           label: 'Consultation' },
  { value: 'surgery',         label: 'Surgery' },
  { value: 'test',            label: 'Test / Lab' },
  { value: 'vaccination',     label: 'Vaccination' },
  { value: 'hospitalization', label: 'Hospitalisation' },
  { value: 'therapy',         label: 'Therapy' },
  { value: 'other',           label: 'Other' },
]

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'report',       label: 'Lab Report' },
  { value: 'scan',         label: 'Scan' },
  { value: 'vaccination',  label: 'Vaccination' },
  { value: 'other',        label: 'Other' },
]

const MEDICATION_FREQUENCIES = [
  { value: 'once daily',          label: 'Once Daily' },
  { value: 'twice daily',         label: 'Twice Daily' },
  { value: 'three times daily',   label: 'Three Times Daily' },
  { value: 'four times daily',    label: 'Four Times Daily' },
  { value: 'every alternate day', label: 'Every Alternate Day' },
  { value: 'weekly',              label: 'Weekly' },
  { value: 'as needed',           label: 'As Needed' },
]

const TIME_DEFAULTS: Record<string, string[]> = {
  'once daily':          ['08:00'],
  'twice daily':         ['08:00', '20:00'],
  'three times daily':   ['08:00', '14:00', '20:00'],
  'four times daily':    ['08:00', '12:00', '16:00', '20:00'],
  'every alternate day': ['08:00'],
  'weekly':              ['08:00'],
  'as needed':           [],
}

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  active:     { dot: 'bg-teal-500',   badge: 'bg-teal-50 text-teal-700 border-teal-200',       label: 'Active' },
  chronic:    { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Chronic' },
  monitoring: { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Monitoring' },
  resolved:   { dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 border-gray-200',       label: 'Resolved' },
}

const AVATAR_COLORS: Record<string, string> = {
  self:    'bg-blue-100 text-blue-700',
  spouse:  'bg-pink-100 text-pink-700',
  child:   'bg-green-100 text-green-700',
  parent:  'bg-purple-100 text-purple-700',
  sibling: 'bg-orange-100 text-orange-700',
  other:   'bg-gray-100 text-gray-700',
}

const MAX_FILES = 5
const MAX_FILE_SIZE_MB = 10
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

function todayISO() { return new Date().toISOString().slice(0, 10) }
function getInitials(n: string) { return n.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) }
function getFirstName(n: string) { return n.split(' ')[0] }
function formatFileSize(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`
}
function fmtDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ConditionOption = { id: string; name: string; status: string }
type ICD10Condition  = { id: string; name: string; category: string }

type DocumentCard = {
  title: string
  document_date: string
  doctor_name: string
  hospital_name: string
  document_type: DocumentType | ''
  notes: string
}

type MedEntry = {
  id: string
  name: string
  dosage: string
  frequency: string
  time_of_day: string[]
  notes: string
  start_date: string
  end_date: string
  prescribed_by: string
  reminderEnabled: boolean
}

type VisitDetails = {
  doctor_name: string
  hospital_name: string
  visit_date: string
  visit_type: ConsultationType
  notes: string
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100
  return (
    <div className="w-full mt-3" style={{ height: 3, background: 'var(--color-border-tertiary)' }}>
      <div className="h-full transition-all duration-300"
        style={{ width: `${pct}%`, background: '#0F6E56' }}
      />
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HealthEventLoggerProps {
  isOpen: boolean
  onClose: () => void
  familyMembers: FamilyMemberSummary[]
  onSuccess: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HealthEventLogger({ isOpen, onClose, familyMembers, onSuccess }: HealthEventLoggerProps) {
  const [step, setStep] = useState(1)

  // Step 1
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [memberConditions, setMemberConditions] = useState<ConditionOption[]>([])
  const [loadingConditions, setLoadingConditions] = useState(false)
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null)
  const [isNewCondition, setIsNewCondition] = useState(false)
  const [newConditionName, setNewConditionName] = useState('')
  const [icd10Conditions, setIcd10Conditions] = useState<ICD10Condition[]>([])
  const [loadingIcd10, setLoadingIcd10] = useState(false)
  const [newConditionIcd10Id, setNewConditionIcd10Id] = useState<string | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)

  // Step 2
  const fileInputRef = useRef<HTMLInputElement>(null)
  const slowWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [documentCards, setDocumentCards] = useState<DocumentCard[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isExtractingAll, setIsExtractingAll] = useState(false)
  const [showSlowWarning, setShowSlowWarning] = useState(false)
  const [extractionDone, setExtractionDone] = useState(false)
  const [extractionFileCount, setExtractionFileCount] = useState<number | null>(null)
  const [extractionMedCount, setExtractionMedCount] = useState<number | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  // Step 3 shared state
  const [visitDetails, setVisitDetails] = useState<VisitDetails>({
    doctor_name: '', hospital_name: '', visit_date: todayISO(), visit_type: 'visit', notes: '',
  })
  const [meds, setMeds] = useState<MedEntry[]>([])

  // Step 4
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Validation error states
  const [newConditionNameError, setNewConditionNameError] = useState<string | null>(null)
  const [docCardErrors, setDocCardErrors] = useState<Array<{ title?: string }>>([])
  const [medErrors, setMedErrors] = useState<Record<string, { name?: string; dosage?: string }>>({})
  const [visitDoctorError, setVisitDoctorError] = useState<string | null>(null)

  const { extractFromFiles } = useDocumentExtraction()

  // Fetch ICD-10 on mount
  useEffect(() => {
    async function fetchIcd10() {
      setLoadingIcd10(true)
      try {
        const supabase = createClient()
        const { data } = await supabase.from('icd10_conditions').select('id, name, category').order('name')
        if (data) setIcd10Conditions(data as ICD10Condition[])
      } finally { setLoadingIcd10(false) }
    }
    fetchIcd10()
  }, [])

  // ── Reset ──────────────────────────────────────────────────────────────────
  function resetAll() {
    setStep(1)
    setSelectedMemberId('')
    setMemberConditions([])
    setLoadingConditions(false)
    setSelectedConditionId(null)
    setIsNewCondition(false)
    setNewConditionName('')
    setNewConditionIcd10Id(null)
    setComboboxOpen(false)
    setUploadedFiles([])
    setDocumentCards([])
    setFileError(null)
    setIsExtractingAll(false)
    setShowSlowWarning(false)
    if (slowWarningTimerRef.current) clearTimeout(slowWarningTimerRef.current)
    setExtractionDone(false)
    setExtractionFileCount(null)
    setExtractionMedCount(null)
    setExtractionError(null)
    setVisitDetails({ doctor_name: '', hospital_name: '', visit_date: todayISO(), visit_type: 'visit', notes: '' })
    setMeds([])
    setIsSaving(false)
    setSaveError(null)
    setNewConditionNameError(null)
    setDocCardErrors([])
    setMedErrors({})
    setVisitDoctorError(null)
  }

  function handleOpenChange(v: boolean) {
    if (!v) { resetAll(); onClose() }
  }

  // ── Load conditions ────────────────────────────────────────────────────────
  async function loadConditions(memberId: string) {
    setLoadingConditions(true)
    setMemberConditions([])
    setSelectedConditionId(null)
    setIsNewCondition(false)
    setNewConditionName('')
    setNewConditionIcd10Id(null)
    setComboboxOpen(false)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('medical_conditions')
        .select('id, custom_name, status, icd10_conditions(common_name, name)')
        .eq('family_member_id', memberId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMemberConditions(data.map((c: any) => ({
          id: c.id,
          name: c.icd10_conditions?.common_name ?? c.icd10_conditions?.name ?? c.custom_name ?? 'Unknown',
          status: c.status,
        })))
      }
    } finally { setLoadingConditions(false) }
  }

  // ── Step 1 validation ──────────────────────────────────────────────────────
  const step1Valid =
    !!selectedMemberId &&
    (!!selectedConditionId || (isNewCondition && validateName(newConditionName, 'Condition', true) === null))

  // ── File + card management ─────────────────────────────────────────────────
  function makeBlankCard(file: File): DocumentCard {
    return {
      title:         file.name.replace(/\.[^.]+$/, ''),
      document_date: '',
      doctor_name:   '',
      hospital_name: '',
      document_type: '',
      notes:         '',
    }
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return
    setFileError(null)
    const toAdd: File[] = []
    for (const f of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(f.type)) { setFileError('Only PDF, JPG, and PNG files are accepted'); return }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) { setFileError(`Each file must be under ${MAX_FILE_SIZE_MB} MB`); return }
      toAdd.push(f)
    }
    if (uploadedFiles.length + toAdd.length > MAX_FILES) setFileError(`Maximum ${MAX_FILES} files allowed`)
    const newFiles = [...uploadedFiles, ...toAdd].slice(0, MAX_FILES)
    const newCards = [...documentCards, ...toAdd.map(makeBlankCard)].slice(0, MAX_FILES)
    setUploadedFiles(newFiles)
    setDocumentCards(newCards)
    setDocCardErrors((prev) => [...prev, ...toAdd.map(() => ({}) as { title?: string })].slice(0, MAX_FILES))
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    setDocumentCards((prev) => prev.filter((_, i) => i !== index))
    setDocCardErrors((prev) => prev.filter((_, i) => i !== index))
    setExtractionDone(false)
    setExtractionFileCount(null)
    setExtractionMedCount(null)
    setMeds([])
  }

  function updateDocCard<K extends keyof DocumentCard>(index: number, key: K, value: DocumentCard[K]) {
    setDocumentCards((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  // ── AI extraction ──────────────────────────────────────────────────────────
  async function runExtraction() {
    if (uploadedFiles.length === 0) return
    const totalBytes = uploadedFiles.reduce((s, f) => s + f.size, 0)
    if (totalBytes > 20 * 1024 * 1024) {
      setExtractionError('Total file size is too large for extraction. Please extract files individually.')
      return
    }
    setIsExtractingAll(true)
    setExtractionError(null)
    setExtractionDone(false)
    setExtractionFileCount(null)
    setExtractionMedCount(null)
    setShowSlowWarning(false)
    slowWarningTimerRef.current = setTimeout(() => setShowSlowWarning(true), 8000)

    try {
      const result = await extractFromFiles(uploadedFiles)
      if (result) {
        // Pre-fill visit details
        setVisitDetails((prev) => ({
          ...prev,
          doctor_name:   result.doctor_name   || prev.doctor_name,
          hospital_name: result.hospital_name || prev.hospital_name,
          visit_date:    result.visit_date     || prev.visit_date,
        }))
        // Update document cards with extracted metadata
        setDocumentCards((prev) => prev.map((card, i) => {
          const ed = result.documents[i]
          if (!ed) return card
          return {
            ...card,
            document_date: ed.document_date ?? card.document_date,
            doctor_name:   ed.doctor_name   ?? card.doctor_name,
            hospital_name: ed.hospital_name ?? card.hospital_name,
            document_type: (ed.document_type as DocumentType | null) ?? card.document_type,
            notes:         ed.notes         ?? card.notes,
          }
        }))
        // Build medication entries
        setMeds(result.medications.map((m, i) => ({
          id:            `xmed-${i}`,
          name:          m.name       ?? '',
          dosage:        m.dose       ?? '',
          frequency:     m.frequency  ?? 'once daily',
          time_of_day:   m.time_of_day,
          notes:         m.notes      ?? '',
          start_date:    m.start_date ?? todayISO(),
          end_date:      m.end_date   ?? '',
          prescribed_by: result.doctor_name ?? '',
          reminderEnabled: false,
        })))
        setExtractionFileCount(uploadedFiles.length)
        setExtractionMedCount(result.medications.length)
        setExtractionDone(true)
      } else {
        setExtractionError('Extraction failed. You can fill in details manually in the next step.')
      }
    } finally {
      if (slowWarningTimerRef.current) clearTimeout(slowWarningTimerRef.current)
      setIsExtractingAll(false)
    }
  }

  // ── Visit details helper ───────────────────────────────────────────────────
  function updateVisit<K extends keyof VisitDetails>(key: K, value: VisitDetails[K]) {
    setVisitDetails((prev) => ({ ...prev, [key]: value }))
  }

  // ── Med helpers ────────────────────────────────────────────────────────────
  function addMed() {
    setMeds((prev) => [...prev, {
      id:            `med-${Date.now()}`,
      name:          '',
      dosage:        '',
      frequency:     'once daily',
      time_of_day:   ['08:00'],
      notes:         '',
      start_date:    todayISO(),
      end_date:      '',
      prescribed_by: visitDetails.doctor_name,
      reminderEnabled: false,
    }])
  }

  function removeMed(id: string) {
    setMeds((prev) => prev.filter((m) => m.id !== id))
    setMedErrors((prev) => { const n = { ...prev }; delete n[id]; return n })
  }

  function updateMed<K extends keyof MedEntry>(id: string, key: K, value: MedEntry[K]) {
    setMeds((prev) => prev.map((m) => {
      if (m.id !== id) return m
      const updated = { ...m, [key]: value }
      if (key === 'frequency') updated.time_of_day = TIME_DEFAULTS[value as string] ?? ['08:00']
      return updated
    }))
  }

  function updateMedTime(id: string, index: number, time: string) {
    setMeds((prev) => prev.map((m) => {
      if (m.id !== id) return m
      const times = [...m.time_of_day]
      times[index] = time
      return { ...m, time_of_day: times }
    }))
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase.from('users').select('id').eq('supabase_auth_id', user.id).single()
      if (!profile) throw new Error('User profile not found')
      const { data: group } = await supabase.from('family_groups').select('id').eq('owner_id', profile.id).single()
      if (!group) throw new Error('Family group not found')

      // Upload files then build documents array with per-card metadata
      const savedDocs: Array<{
        fileUrl: string; mimeType: string; fileSizeKb: number; title: string; documentType: DocumentType
        documentDate?: string; doctorName?: string; hospitalName?: string; docNotes?: string
      }> = []

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        const card = documentCards[i]
        const sanitized = file.name.replace(/\s+/g, '_')
        const filePath = `${group.id}/${selectedMemberId}/${Date.now()}_${sanitized}`
        const { error: uploadErr } = await supabase.storage.from('familycare-docs').upload(filePath, file, { upsert: false })
        if (uploadErr) throw uploadErr
        savedDocs.push({
          fileUrl:      filePath,
          mimeType:     file.type,
          fileSizeKb:   Math.round(file.size / 1024),
          title:        card?.title || file.name.replace(/\.[^.]+$/, ''),
          documentType: (card?.document_type || 'prescription') as DocumentType,
          documentDate: card?.document_date || undefined,
          doctorName:   card?.doctor_name   || undefined,
          hospitalName: card?.hospital_name || undefined,
          docNotes:     card?.notes         || undefined,
        })
      }

      await saveHealthEventAction({
        memberId: selectedMemberId,
        conditionType: isNewCondition ? 'new' : selectedConditionId ? 'existing' : 'skip',
        conditionName: isNewCondition && !newConditionIcd10Id ? newConditionName : undefined,
        icd10ConditionId: isNewCondition ? (newConditionIcd10Id ?? null) : undefined,
        existingConditionId: selectedConditionId ?? undefined,
        visitDetails,
        documents: savedDocs,
        medications: meds
          .filter((m) => m.name.trim())
          .map((m) => ({
            name:            m.name,
            dosage:          m.dosage,
            frequency:       m.frequency,
            timeOfDay:       m.time_of_day,
            notes:           m.notes      || undefined,
            startDate:       m.start_date || undefined,
            endDate:         m.end_date   || undefined,
            prescribedBy:    m.prescribed_by || undefined,
            reminderEnabled: m.reminderEnabled,
          })),
      })

      onSuccess()
      handleOpenChange(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedMember = familyMembers.find((m) => m.id === selectedMemberId)
  const step3HasDocErrors =
    documentCards.some((c) => validateDocumentTitle(c.title) !== null) ||
    docCardErrors.some((e) => !!e.title)
  const step3HasMedErrors =
    meds.some((m) => validateMedicationName(m.name) !== null) ||
    Object.values(medErrors).some((e) => !!e.name || !!e.dosage)
  const step3NotesOverLimit =
    visitDetails.notes.length > 500 ||
    documentCards.some((c) => c.notes.length > 500) ||
    meds.some((m) => m.notes.length > 500)
  const step3Blocked = step3HasDocErrors || step3HasMedErrors || step3NotesOverLimit || !!visitDoctorError

  // Step 4 warnings
  const medIncomplete = meds
    .filter((m) => m.name.trim())
    .some((m) => !m.dosage || !m.frequency)
  const medsWithReminderOff = meds.filter((m) => m.name.trim() && !m.reminderEnabled).length

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => handleOpenChange(false)}>
      <div
        className="w-full bg-white flex flex-col rounded-t-2xl overflow-hidden"
        style={{ height: '85vh', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Zone 1: Fixed header ──────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4"
          style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 shrink-0" aria-label="Back">
                <ArrowLeft className="size-4" />
              </button>
            )}
            <h2 className="font-medium flex-1 leading-tight"
              style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
              {step === 1 && 'Log a visit'}
              {step === 2 && 'Upload documents'}
              {step === 3 && 'Visit details'}
              {step === 4 && 'Review visit'}
            </h2>
            <button onClick={() => handleOpenChange(false)} className="p-1 rounded-lg hover:bg-gray-100 shrink-0" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <ProgressBar step={step} />
        </div>

        {/* ── Zone 2: Scrollable content ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-5" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

          {/* ─── STEP 1 ───────────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Who visited the doctor?</Label>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6">
                  {familyMembers.map((m) => {
                    const selected = m.id === selectedMemberId
                    const color = AVATAR_COLORS[m.relation ?? 'other'] ?? AVATAR_COLORS.other
                    return (
                      <button key={m.id} onClick={() => { setSelectedMemberId(m.id); loadConditions(m.id) }}
                        className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-[10px] px-3 py-2.5 transition-colors"
                        style={selected
                          ? { outline: '2px solid #0F6E56', background: 'white' }
                          : { border: '0.5px solid var(--color-border-tertiary)', background: 'white' }}>
                        <div className={`size-9 rounded-full flex items-center justify-center font-semibold text-xs ${selected ? 'bg-teal-500 text-white' : color}`}>
                          {getInitials(m.full_name)}
                        </div>
                        <span className="text-xs font-medium"
                          style={{ color: selected ? '#0F6E56' : 'var(--color-text-secondary)' }}>
                          {getFirstName(m.full_name)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedMemberId && (
                <div className="space-y-2">
                  <Label>Which condition?</Label>
                  {loadingConditions && <p className="text-xs text-muted-foreground">Loading conditions…</p>}
                  {!loadingConditions && memberConditions.length === 0 && !isNewCondition && (
                    <p className="text-xs text-muted-foreground">No conditions yet — enter a new one below.</p>
                  )}
                  {memberConditions.map((cond) => {
                    const cfg = STATUS_CONFIG[cond.status] ?? STATUS_CONFIG.active
                    const selected = cond.id === selectedConditionId
                    return (
                      <button key={cond.id}
                        onClick={() => { setSelectedConditionId(cond.id); setIsNewCondition(false); setNewConditionName('') }}
                        className="w-full flex items-center gap-3 rounded-[20px] text-left transition-colors"
                        style={{
                          padding: '5px 12px',
                          ...(selected
                            ? { background: '#E1F5EE', border: '0.5px solid #0F6E56' }
                            : { background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' })
                        }}>
                        <span className={`size-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className="flex-1 text-sm font-medium min-w-0 truncate"
                          style={{ color: cond.id === selectedConditionId ? '#0F6E56' : 'var(--color-text-primary)' }}>
                          {cond.name}
                        </span>
                        <span className={`text-xs font-medium border rounded-full px-2 py-0.5 shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                      </button>
                    )
                  })}

                  {!isNewCondition ? (
                    <button onClick={() => { setIsNewCondition(true); setSelectedConditionId(null) }}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 pt-1">
                      + This is a new condition
                    </button>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label>New condition name</Label>
                        <button onClick={() => { setIsNewCondition(false); setNewConditionName(''); setNewConditionIcd10Id(null); setComboboxOpen(false) }}
                          className="text-xs text-muted-foreground hover:underline">Cancel</button>
                      </div>
                      <PopoverPrimitive.Root open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverPrimitive.Anchor asChild>
                          <div className="relative">
                            <Input autoFocus value={newConditionName}
                              onChange={(e) => { setNewConditionName(e.target.value); setNewConditionIcd10Id(null); setComboboxOpen(true); if (newConditionNameError) setNewConditionNameError(null) }}
                              onFocus={() => setComboboxOpen(true)}
                              onBlur={() => { setTimeout(() => setComboboxOpen(false), 200); setNewConditionNameError(validateName(newConditionName, 'Condition', true)) }}
                              placeholder="e.g. Diabetes Type 2"
                              className={newConditionIcd10Id ? 'border-teal-400 pr-8' : ''}
                            />
                            {newConditionIcd10Id && <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-teal-600 pointer-events-none" />}
                          </div>
                        </PopoverPrimitive.Anchor>
                        <PopoverPrimitive.Portal>
                          <PopoverPrimitive.Content sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()}
                            className="z-[70] rounded-lg border bg-white shadow-lg outline-none overflow-hidden"
                            style={{ width: 'var(--radix-popper-anchor-width)' }}>
                            <div className="max-h-[240px] overflow-y-auto py-1">
                              {loadingIcd10 ? (
                                <p className="text-xs text-muted-foreground px-3 py-2">Loading conditions…</p>
                              ) : (
                                <>
                                  {(newConditionName.trim()
                                    ? icd10Conditions.filter((c) => c.name.toLowerCase().includes(newConditionName.toLowerCase())).slice(0, 8)
                                    : icd10Conditions.slice(0, 8)
                                  ).map((cond) => (
                                    <button key={cond.id} type="button"
                                      onMouseDown={(e) => { e.preventDefault(); setNewConditionName(cond.name); setNewConditionIcd10Id(cond.id); setComboboxOpen(false) }}
                                      className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-accent transition-colors ${newConditionIcd10Id === cond.id ? 'bg-teal-50' : ''}`}>
                                      <Check className={`size-3.5 mt-0.5 shrink-0 text-teal-600 ${newConditionIcd10Id === cond.id ? 'opacity-100' : 'opacity-0'}`} />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{cond.name}</p>
                                        {cond.category && <p className="text-xs text-muted-foreground">{cond.category}</p>}
                                      </div>
                                    </button>
                                  ))}
                                  {newConditionName.trim() && (
                                    <button type="button"
                                      onMouseDown={(e) => { e.preventDefault(); setNewConditionIcd10Id(null); setComboboxOpen(false) }}
                                      className="w-full text-left px-3 py-2 text-sm text-muted-foreground italic hover:bg-accent border-t mt-1 transition-colors">
                                      Add &ldquo;{newConditionName}&rdquo; as custom condition
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </PopoverPrimitive.Content>
                        </PopoverPrimitive.Portal>
                      </PopoverPrimitive.Root>
                      {newConditionNameError && !newConditionIcd10Id && (
                        <p className="text-red-500 text-xs mt-1">{newConditionNameError}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {newConditionIcd10Id ? 'ICD-10 condition selected' : 'Search ICD-10 list or type a custom condition name'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── STEP 2 ───────────────────────────────────────────────── */}
          {step === 2 && (
            <>
              {uploadedFiles.length < MAX_FILES && (
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl py-6 cursor-pointer transition-colors hover:opacity-80"
                  style={{ border: '0.5px dashed var(--color-border-secondary)', background: 'var(--color-background-secondary)' }}>
                  <Upload className="size-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Tap to upload</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, PDF — multiple files supported</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="sr-only"
                    onChange={(e) => handleFilesSelected(e.target.files)} />
                </label>
              )}

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 bg-muted/20">
                      {file.type.startsWith('image/') ? <FileImage className="size-4 text-teal-600 shrink-0" /> : <FileText className="size-4 text-indigo-600 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        {file.size > 4 * 1024 * 1024 && <p className="text-xs text-amber-600 mt-0.5">This file is large and may take longer to process</p>}
                      </div>
                      <button onClick={() => removeFile(idx)} className="shrink-0 p-1 rounded hover:bg-muted">
                        <X className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {fileError && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3 shrink-0" /> {fileError}</p>}

              {uploadedFiles.length > 0 && !extractionDone && (
                <>
                  <button type="button" onClick={runExtraction} disabled={isExtractingAll}
                    className="flex items-start gap-3 rounded-xl px-4 py-3 text-left w-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-80"
                    style={{ border: '0.5px solid #0F6E56', background: '#E1F5EE' }}>
                    {isExtractingAll ? <Loader2 className="size-4 text-teal-600 shrink-0 mt-0.5 animate-spin" /> : <Sparkles className="size-4 text-teal-600 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-teal-800">
                        {isExtractingAll ? 'Extracting…' : 'Extract details from documents'}
                      </p>
                      {!isExtractingAll && <p className="text-xs text-teal-600 mt-0.5">AI reads all files and pre-fills document and medication details</p>}
                    </div>
                  </button>
                  {isExtractingAll && showSlowWarning && (
                    <p className="text-xs text-muted-foreground text-center">Large files may take up to 30 seconds…</p>
                  )}
                  <p className="text-xs text-muted-foreground text-center">Documents are processed by Anthropic&apos;s AI and are not stored or used for training.</p>
                </>
              )}

              {extractionDone && extractionFileCount !== null && (
                <div className="flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                  <CheckCircle className="size-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-teal-800">
                      ✓ Extracted details from {extractionFileCount} file{extractionFileCount > 1 ? 's' : ''}
                    </p>
                    {extractionMedCount !== null && extractionMedCount > 0 && (
                      <p className="text-xs text-teal-600 mt-0.5">
                        Also found {extractionMedCount} medication{extractionMedCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {extractionError && !isExtractingAll && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="size-3 shrink-0 mt-0.5" /> {extractionError}
                </p>
              )}
            </>
          )}

          {/* ─── STEP 3 ───────────────────────────────────────────────── */}
          {step === 3 && (
            <>
              {/* ── Visit details ── */}
              <p className="uppercase font-medium tracking-[0.07em]"
                style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                Visit Details
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="doctor_name">Doctor Name</Label>
                  <Input id="doctor_name" value={visitDetails.doctor_name}
                    onChange={(e) => { updateVisit('doctor_name', e.target.value); if (visitDoctorError) setVisitDoctorError(null) }}
                    onBlur={() => setVisitDoctorError(validateName(visitDetails.doctor_name, 'Doctor name', false))}
                    placeholder="e.g. Dr. Anjali Sharma" />
                  {visitDoctorError && <p className="text-red-500 text-xs mt-1">{visitDoctorError}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="visit_date">Visit Date</Label>
                    <Input id="visit_date" type="date" value={visitDetails.visit_date}
                      max={todayISO()} onChange={(e) => updateVisit('visit_date', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Visit Type</Label>
                    <Select value={visitDetails.visit_type} onValueChange={(v) => updateVisit('visit_type', v as ConsultationType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VISIT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="visit_notes">Notes</Label>
                    <span className={`text-xs ${visitDetails.notes.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>{visitDetails.notes.length} / 500</span>
                  </div>
                  <Textarea id="visit_notes" value={visitDetails.notes}
                    onChange={(e) => updateVisit('notes', e.target.value)}
                    placeholder="Any notes about the visit…" rows={2} className="resize-none" />
                  {visitDetails.notes.length > 500 && <p className="text-red-500 text-xs mt-1">Notes must be under 500 characters</p>}
                </div>
              </div>

              {/* ── Documents section ── */}
              {uploadedFiles.length > 0 && (
                <>
                  <div className="border-t pt-4">
                    <p className="uppercase font-medium tracking-[0.07em] mb-3"
                      style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                      Documents to save
                    </p>
                    <div className="space-y-4">
                      {uploadedFiles.map((file, idx) => {
                        const card = documentCards[idx] ?? makeBlankCard(file)
                        return (
                          <div key={idx} className="rounded-[10px] p-4 space-y-3 mb-2"
                            style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                            <p className="truncate" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{file.name}</p>

                            <div className="space-y-1">
                              <Label className="text-xs">Document title <span className="text-destructive">*</span></Label>
                              <Input value={card.title}
                                onChange={(e) => { updateDocCard(idx, 'title', e.target.value); setDocCardErrors((prev) => { const n = [...prev]; if (n[idx]) n[idx] = { ...n[idx], title: undefined }; return n }) }}
                                onBlur={() => setDocCardErrors((prev) => { const n = [...prev]; n[idx] = { ...(n[idx] ?? {}), title: validateDocumentTitle(card.title) ?? undefined }; return n })}
                                placeholder="e.g. Blood test report"
                                className={validateDocumentTitle(card.title) ? 'border-destructive' : ''} />
                              {docCardErrors[idx]?.title && <p className="text-red-500 text-xs mt-1">{docCardErrors[idx].title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Document date</Label>
                                <Input type="date" value={card.document_date}
                                  onChange={(e) => updateDocCard(idx, 'document_date', e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Document type</Label>
                                <Select value={card.document_type}
                                  onValueChange={(v) => updateDocCard(idx, 'document_type', v as DocumentType)}>
                                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                                  <SelectContent>
                                    {DOCUMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Doctor who issued this document</Label>
                              <Input value={card.doctor_name}
                                onChange={(e) => updateDocCard(idx, 'doctor_name', e.target.value)}
                                placeholder="Doctor name" />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Hospital / Clinic</Label>
                              <Input value={card.hospital_name}
                                onChange={(e) => updateDocCard(idx, 'hospital_name', e.target.value)}
                                placeholder="Hospital or clinic name" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">Notes</Label>
                                <span className={`text-xs ${card.notes.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>{card.notes.length} / 500</span>
                              </div>
                              <Input value={card.notes}
                                onChange={(e) => updateDocCard(idx, 'notes', e.target.value)}
                                placeholder="Any additional notes" />
                              {card.notes.length > 500 && <p className="text-red-500 text-xs mt-1">Notes must be under 500 characters</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ── Medications section ── */}
              <div className="border-t pt-4 space-y-4">
                <p className="uppercase font-medium tracking-[0.07em]"
                  style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                  Medications from this visit
                </p>

                {meds.length === 0 && (
                  <div className="rounded-xl border border-dashed px-4 py-6 text-center">
                    <Pill className="size-7 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No medications yet</p>
                  </div>
                )}

                {meds.map((med) => (
                  <div key={med.id} className="rounded-[10px] p-4 space-y-3"
                    style={{
                      background: 'var(--color-background-secondary)',
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderLeft: '2px solid #E1F5EE',
                    }}>
                    <div className="space-y-1">
                      <Label className="text-xs">Medication name <span className="text-destructive">*</span></Label>
                      <Input value={med.name}
                        onChange={(e) => { updateMed(med.id, 'name', e.target.value); setMedErrors((p) => ({ ...p, [med.id]: { ...p[med.id], name: undefined } })) }}
                        onBlur={() => setMedErrors((p) => ({ ...p, [med.id]: { ...p[med.id], name: validateMedicationName(med.name) ?? undefined } }))}
                        placeholder="e.g. Metformin"
                        className={validateMedicationName(med.name) !== null ? 'border-destructive' : ''} />
                      {medErrors[med.id]?.name && <p className="text-red-500 text-xs mt-1">{medErrors[med.id].name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Dose</Label>
                        <Input value={med.dosage}
                          onChange={(e) => { updateMed(med.id, 'dosage', e.target.value); setMedErrors((p) => ({ ...p, [med.id]: { ...p[med.id], dosage: undefined } })) }}
                          onBlur={() => setMedErrors((p) => ({ ...p, [med.id]: { ...p[med.id], dosage: validateDosage(med.dosage) ?? undefined } }))}
                          placeholder="e.g. 500mg" />
                        {medErrors[med.id]?.dosage && <p className="text-red-500 text-xs mt-1">{medErrors[med.id].dosage}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Frequency</Label>
                        <Select value={med.frequency} onValueChange={(v) => updateMed(med.id, 'frequency', v)}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MEDICATION_FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {med.frequency !== 'as needed' && med.time_of_day.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs">Times</Label>
                        <div className="flex flex-wrap gap-2">
                          {med.time_of_day.map((t, ti) => (
                            <input key={ti} type="time" value={t}
                              onChange={(e) => updateMedTime(med.id, ti, e.target.value)}
                              className="focus:outline-none"
                              style={{
                                padding: '3px 10px', borderRadius: 20,
                                fontSize: 11, fontWeight: 500,
                                background: '#E1F5EE', color: '#0F6E56',
                                border: 'none',
                              }} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Start date</Label>
                        <Input type="date" value={med.start_date} max={todayISO()}
                          onChange={(e) => updateMed(med.id, 'start_date', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End date</Label>
                        <Input type="date" value={med.end_date} min={med.start_date || undefined}
                          onChange={(e) => updateMed(med.id, 'end_date', e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Prescribed by</Label>
                      <Input value={med.prescribed_by} onChange={(e) => updateMed(med.id, 'prescribed_by', e.target.value)} placeholder="e.g. Dr. Anjali Sharma" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Notes</Label>
                        <span className={`text-xs ${med.notes.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>{med.notes.length} / 500</span>
                      </div>
                      <Input value={med.notes} onChange={(e) => updateMed(med.id, 'notes', e.target.value)} placeholder="e.g. After food, before sleep" />
                      {med.notes.length > 500 && <p className="text-red-500 text-xs mt-1">Notes must be under 500 characters</p>}
                    </div>

                    {med.frequency !== 'as needed' && (
                      <div className="space-y-1.5 pt-1 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {med.reminderEnabled ? <Bell className="size-3.5 text-teal-600" /> : <BellOff className="size-3.5 text-muted-foreground" />}
                            <span className="text-xs font-medium">{med.reminderEnabled ? 'Reminders on' : 'Reminders off'}</span>
                          </div>
                          <Switch checked={med.reminderEnabled} onCheckedChange={(v) => updateMed(med.id, 'reminderEnabled', v)} />
                        </div>
                        {!med.reminderEnabled && <p className="text-xs text-amber-600">⚠ Verify details before enabling</p>}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={() => removeMed(med.id)}
                        className="text-xs text-destructive hover:underline flex items-center gap-1">
                        <Trash2 className="size-3" /> Remove this medication
                      </button>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addMed}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-medium transition-colors hover:opacity-80"
                  style={{
                    fontSize: 13, color: '#0F6E56',
                    border: '0.5px dashed var(--color-border-secondary)',
                    background: 'transparent',
                  }}>
                  <Plus className="size-4" /> Add medication from this visit
                </button>
              </div>
            </>
          )}

          {/* ─── STEP 4 ───────────────────────────────────────────────── */}
          {step === 4 && (
            <>
              {saveError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{saveError}</p>
                </div>
              )}

              <p className="uppercase font-medium tracking-[0.07em] mb-3"
                style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                Visit Summary
              </p>
              {/* Core summary */}
              <div className="rounded-[10px] divide-y"
                style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visit</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <span className="font-medium">{VISIT_TYPES.find((t) => t.value === visitDetails.visit_type)?.label}</span>
                      {visitDetails.doctor_name && ` — ${visitDetails.doctor_name}`}
                      {visitDetails.visit_date && ` · ${fmtDate(visitDetails.visit_date)}`}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      {isNewCondition
                        ? <>New condition: <span className="font-medium">{newConditionName}</span></>
                        : selectedConditionId
                          ? <span className="font-medium">{memberConditions.find((c) => c.id === selectedConditionId)?.name ?? 'Selected condition'}</span>
                          : <span className="text-muted-foreground">No condition linked</span>
                      }
                    </p>
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">For</p>
                  <p className="text-sm font-medium">{selectedMember?.full_name ?? '—'}</p>
                </div>
              </div>

              {/* Documents being saved */}
              {uploadedFiles.length > 0 && (
                <div>
                  <p className="uppercase font-medium tracking-[0.07em] mb-2"
                    style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>Documents being saved</p>
                  <div className="space-y-2">
                    {documentCards.map((card, i) => (
                      <div key={i} className="rounded-[8px] px-3 py-2.5 space-y-0.5"
                        style={{ background: 'var(--color-background-secondary)' }}>
                        <p className="text-sm font-semibold">{card.title || uploadedFiles[i]?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[DOCUMENT_TYPES.find((t) => t.value === card.document_type)?.label, card.document_date ? fmtDate(card.document_date) : '']
                            .filter(Boolean).join(' · ')}
                        </p>
                        {card.doctor_name   && <p className="text-xs text-muted-foreground">Dr: {card.doctor_name}</p>}
                        {card.hospital_name && <p className="text-xs text-muted-foreground">{card.hospital_name}</p>}
                        {card.notes        && <p className="text-xs text-muted-foreground italic">{card.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications from this visit */}
              {meds.filter((m) => m.name.trim()).length > 0 && (
                <div>
                  <p className="uppercase font-medium tracking-[0.07em] mb-2"
                    style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>Medications from this visit</p>
                  <div className="space-y-2">
                    {meds.filter((m) => m.name.trim()).map((m) => (
                      <div key={m.id} className="rounded-[8px] px-3 py-2.5 space-y-0.5"
                        style={{ background: 'var(--color-background-secondary)' }}>
                        <p className="text-sm font-semibold">{m.name}</p>
                        {(m.dosage || m.frequency) && (
                          <p className="text-xs text-muted-foreground">{[m.dosage, m.frequency].filter(Boolean).join(' · ')}</p>
                        )}
                        {m.frequency !== 'as needed' && m.time_of_day.length > 0 && (
                          <p className="text-xs text-muted-foreground">Times: {m.time_of_day.join(' · ')}</p>
                        )}
                        {m.prescribed_by && <p className="text-xs text-muted-foreground">Dr: {m.prescribed_by}</p>}
                        <p className="text-xs text-muted-foreground">
                          {m.start_date ? fmtDate(m.start_date) : ''}
                          {m.end_date ? ` → ${fmtDate(m.end_date)}` : m.start_date ? ' → Ongoing' : ''}
                        </p>
                        {m.notes && <p className="text-xs text-muted-foreground italic">{m.notes}</p>}
                        <span className={`inline-flex text-[10px] font-medium rounded-full px-1.5 py-0.5 ${m.reminderEnabled ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                          {m.reminderEnabled ? 'Reminders: On' : 'Reminders: Off'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {uploadedFiles.length > 0 && documentCards.some((c) => !c.title.trim()) && (
                <div className="rounded-[8px] px-4 py-3"
                style={{ background: '#FAEEDA', border: '0.5px solid rgba(186,117,23,0.2)' }}>
                  <p className="text-xs" style={{ color: '#854F0B' }}>⚠ Some documents are missing a title.</p>
                </div>
              )}

              {medIncomplete && (
                <div className="rounded-[8px] px-4 py-3"
                style={{ background: '#FAEEDA', border: '0.5px solid rgba(186,117,23,0.2)' }}>
                  <p className="text-xs" style={{ color: '#854F0B' }}>⚠ Some medication details are incomplete. You can update them in Medications after saving.</p>
                </div>
              )}

              {medsWithReminderOff > 0 && (
                <div className="rounded-[8px] px-4 py-3"
                style={{ background: '#E6F1FB', border: '0.5px solid rgba(24,95,165,0.15)' }}>
                  <p className="text-xs" style={{ color: '#185FA5' }}>
                    💊 Reminders are off for <span className="font-semibold">{medsWithReminderOff} medication{medsWithReminderOff > 1 ? 's' : ''}</span>.
                    Enable them in the Medications page after verifying details.
                  </p>
                </div>
              )}
            </>
          )}

        </div>

        {/* ── Zone 3: Fixed footer ──────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
          {step === 1 && (
            <Button className="w-full hover:opacity-90" style={{ background: '#0F6E56', color: 'white' }} disabled={!step1Valid} onClick={() => setStep(2)}>
              Next →
            </Button>
          )}
          {step === 2 && (
            uploadedFiles.length === 0 ? (
              <button onClick={() => setStep(3)} className="w-full text-sm text-center text-muted-foreground hover:text-foreground py-2">
                Skip, continue manually →
              </button>
            ) : (
              <Button className="w-full hover:opacity-90" style={{ background: '#0F6E56', color: 'white' }} disabled={isExtractingAll} onClick={() => setStep(3)}>
                Next →
              </Button>
            )
          )}
          {step === 3 && (
            <div className="space-y-2">
              {step3Blocked && (
                <p className="text-xs text-center text-amber-600">
                  {step3HasDocErrors ? 'Please enter a valid title for all documents'
                    : step3HasMedErrors ? 'Please enter a valid name for all medications'
                    : step3NotesOverLimit ? 'Notes must be under 500 characters'
                    : visitDoctorError ? 'Please fix the doctor name'
                    : ''}
                </p>
              )}
              <Button className="w-full hover:opacity-90" style={{ background: '#0F6E56', color: 'white' }} disabled={step3Blocked} onClick={() => setStep(4)}>
                Review summary →
              </Button>
            </div>
          )}
          {step === 4 && (
            <Button className="w-full hover:opacity-90" style={{ background: '#0F6E56', color: 'white' }} onClick={handleSave} disabled={isSaving}>
              {isSaving ? <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Saving…</span> : 'Save visit'}
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
