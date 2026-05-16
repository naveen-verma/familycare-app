'use client'

import { useState, useRef } from 'react'
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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDocumentExtraction } from '@/hooks/useDocumentExtraction'
import type { FamilyMemberSummary } from '@/components/dashboard/QuickActionsBar'
import type { ConsultationType, DocumentType } from '@/types/database'
import type { ExtractedDocumentData } from '@/hooks/useDocumentExtraction'
import { saveHealthEventAction } from '@/app/(dashboard)/visits/actions'

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

const MEDICATION_FREQUENCIES = [
  { value: 'once daily',          label: 'Once Daily' },
  { value: 'twice daily',         label: 'Twice Daily' },
  { value: 'three times daily',   label: 'Three Times Daily' },
  { value: 'four times daily',    label: 'Four Times Daily' },
  { value: 'every alternate day', label: 'Every Alternate Day' },
  { value: 'weekly',              label: 'Weekly' },
  { value: 'as needed',           label: 'As Needed' },
  { value: 'other',               label: 'Other' },
]

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  active:     { dot: 'bg-teal-500',   badge: 'bg-teal-50 text-teal-700 border-teal-200',     label: 'Active' },
  chronic:    { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Chronic' },
  monitoring: { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Monitoring' },
  resolved:   { dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 border-gray-200',     label: 'Resolved' },
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
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function getFirstName(name: string) {
  return name.split(' ')[0]
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Normalize extracted frequency to a known value
function matchFrequency(raw: string): string {
  const s = (raw ?? '').toLowerCase()
  if (s.includes('once') || s.includes('1x') || s.includes('od')) return 'once daily'
  if (s.includes('twice') || s.includes('2x') || s.includes('bd')) return 'twice daily'
  if (s.includes('three') || s.includes('3x') || s.includes('td')) return 'three times daily'
  if (s.includes('four') || s.includes('4x') || s.includes('qid')) return 'four times daily'
  if (s.includes('alternate')) return 'every alternate day'
  if (s.includes('week')) return 'weekly'
  if (s.includes('need') || s.includes('prn')) return 'as needed'
  return 'once daily'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ConditionOption = {
  id: string
  name: string
  status: string
}

type ExtractedMedEntry = {
  id: string
  name: string
  dosage: string
  frequency: string
  enabled: boolean
  reminderEnabled: boolean
}

type VisitDetails = {
  doctor_name: string
  hospital_name: string
  visit_date: string
  visit_type: ConsultationType
  notes: string
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mt-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < current ? 'bg-teal-500' : 'bg-muted'
          }`}
        />
      ))}
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

export default function HealthEventLogger({
  isOpen,
  onClose,
  familyMembers,
  onSuccess,
}: HealthEventLoggerProps) {
  const [step, setStep] = useState(1)

  // Step 1 state
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [memberConditions, setMemberConditions] = useState<ConditionOption[]>([])
  const [loadingConditions, setLoadingConditions] = useState(false)
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null)
  const [isNewCondition, setIsNewCondition] = useState(false)
  const [newConditionName, setNewConditionName] = useState('')

  // Step 2 state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isExtractingAll, setIsExtractingAll] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMedEntry[]>([])
  const [extractionUsed, setExtractionUsed] = useState(false)

  // Step 3 state
  const [visitDetails, setVisitDetails] = useState<VisitDetails>({
    doctor_name: '',
    hospital_name: '',
    visit_date: todayISO(),
    visit_type: 'visit',
    notes: '',
  })

  // Step 4 state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { extractFromFile } = useDocumentExtraction()

  // ── Reset when closed ──────────────────────────────────────────────────────
  function resetAll() {
    setStep(1)
    setSelectedMemberId('')
    setMemberConditions([])
    setLoadingConditions(false)
    setSelectedConditionId(null)
    setIsNewCondition(false)
    setNewConditionName('')
    setUploadedFiles([])
    setFileError(null)
    setIsExtractingAll(false)
    setExtractedData(null)
    setExtractionError(null)
    setExtractedMeds([])
    setExtractionUsed(false)
    setVisitDetails({ doctor_name: '', hospital_name: '', visit_date: todayISO(), visit_type: 'visit', notes: '' })
    setIsSaving(false)
    setSaveError(null)
  }

  function handleOpenChange(v: boolean) {
    if (!v) resetAll()
    if (!v) onClose()
  }

  // ── Load conditions when member is selected ────────────────────────────────
  async function loadConditions(memberId: string) {
    setLoadingConditions(true)
    setMemberConditions([])
    setSelectedConditionId(null)
    setIsNewCondition(false)
    setNewConditionName('')
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
    } finally {
      setLoadingConditions(false)
    }
  }

  function handleMemberSelect(id: string) {
    setSelectedMemberId(id)
    loadConditions(id)
  }

  // ── Step 1 validation ──────────────────────────────────────────────────────
  const step1Valid =
    !!selectedMemberId &&
    (!!selectedConditionId || (isNewCondition && newConditionName.trim().length > 0))

  // ── File handling ──────────────────────────────────────────────────────────
  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return
    setFileError(null)
    const toAdd: File[] = []
    for (const f of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setFileError('Only PDF, JPG, and PNG files are accepted')
        return
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`Each file must be under ${MAX_FILE_SIZE_MB} MB`)
        return
      }
      toAdd.push(f)
    }
    const merged = [...uploadedFiles, ...toAdd].slice(0, MAX_FILES)
    if (uploadedFiles.length + toAdd.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} files allowed`)
    }
    setUploadedFiles(merged)
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    if (extractedData) {
      setExtractedData(null)
      setExtractedMeds([])
      setExtractionUsed(false)
    }
  }

  // ── AI extraction ──────────────────────────────────────────────────────────
  async function runExtraction() {
    const imageFiles = uploadedFiles.filter((f) => IMAGE_TYPES.includes(f.type))
    if (imageFiles.length === 0) {
      setExtractionError('Upload at least one image (JPG/PNG) for AI extraction. PDF extraction coming soon.')
      return
    }

    setIsExtractingAll(true)
    setExtractionError(null)
    setExtractedData(null)
    setExtractedMeds([])

    let merged: ExtractedDocumentData | null = null

    for (const file of imageFiles) {
      const result = await extractFromFile(file)
      if (!result) continue
      if (!merged) {
        merged = { ...result }
      } else {
        const prev: ExtractedDocumentData = merged
        merged = {
          ...prev,
          doctor_name: prev.doctor_name || result.doctor_name,
          hospital_name: prev.hospital_name || result.hospital_name,
          visit_date: prev.visit_date || result.visit_date,
          condition_name: prev.condition_name || result.condition_name,
          condition_notes: prev.condition_notes || result.condition_notes,
          medications: [...prev.medications, ...result.medications],
        }
      }
    }

    if (merged) {
      setExtractedData(merged)
      setExtractionUsed(true)
      // Pre-fill visit details
      setVisitDetails((prev) => ({
        ...prev,
        doctor_name: merged!.doctor_name || prev.doctor_name,
        hospital_name: merged!.hospital_name || prev.hospital_name,
        visit_date: merged!.visit_date || prev.visit_date,
      }))
      // Build med entries
      setExtractedMeds(
        merged.medications.map((m, i) => ({
          id: `xmed-${i}`,
          name: m.name,
          dosage: m.dosage,
          frequency: matchFrequency(m.frequency),
          enabled: true,
          reminderEnabled: true,
        }))
      )
    } else {
      setExtractionError('Could not read the documents. Fill in details manually below.')
    }

    setIsExtractingAll(false)
  }

  // ── Step 3 helpers ─────────────────────────────────────────────────────────
  function updateVisit<K extends keyof VisitDetails>(key: K, value: VisitDetails[K]) {
    setVisitDetails((prev) => ({ ...prev, [key]: value }))
  }

  function toggleMedEnabled(id: string, enabled: boolean) {
    setExtractedMeds((prev) => prev.map((m) => (m.id === id ? { ...m, enabled } : m)))
  }

  function updateMed<K extends keyof ExtractedMedEntry>(id: string, key: K, value: ExtractedMedEntry[K]) {
    setExtractedMeds((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: value } : m)))
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()

      // Get familyGroupId for storage path construction
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .single()
      if (!profile) throw new Error('User profile not found')

      const { data: group } = await supabase
        .from('family_groups')
        .select('id')
        .eq('owner_id', profile.id)
        .single()
      if (!group) throw new Error('Family group not found')

      const familyGroupId = group.id

      // Upload files to storage
      const savedDocs: Array<{
        fileUrl: string
        mimeType: string
        fileSizeKb: number
        title: string
        documentType: DocumentType
      }> = []

      for (const file of uploadedFiles) {
        const sanitized = file.name.replace(/\s+/g, '_')
        const filePath = `${familyGroupId}/${selectedMemberId}/${Date.now()}_${sanitized}`
        const { error: uploadErr } = await supabase.storage
          .from('familycare-docs')
          .upload(filePath, file, { upsert: false })
        if (uploadErr) throw uploadErr
        savedDocs.push({
          fileUrl: filePath,
          mimeType: file.type,
          fileSizeKb: Math.round(file.size / 1024),
          title: file.name.replace(/\.[^.]+$/, ''),
          documentType: 'prescription',
        })
      }

      // Call server action for all DB writes
      await saveHealthEventAction({
        memberId: selectedMemberId,
        conditionType: isNewCondition ? 'new' : selectedConditionId ? 'existing' : 'skip',
        conditionName: isNewCondition ? newConditionName : undefined,
        existingConditionId: selectedConditionId ?? undefined,
        visitDetails,
        documents: savedDocs,
        medications: extractedMeds
          .filter((m) => m.enabled && m.name.trim())
          .map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
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

  // ── Derived values ─────────────────────────────────────────────────────────
  const selectedMember = familyMembers.find((m) => m.id === selectedMemberId)
  const enabledMeds = extractedMeds.filter((m) => m.enabled)

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!isOpen) return null

  return (
    // Backdrop — full-screen overlay, sheet sits at bottom
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
      onClick={() => handleOpenChange(false)}
    >
      {/* Sheet — fixed height, never resizes */}
      <div
        className="w-full bg-white flex flex-col rounded-t-2xl overflow-hidden"
        style={{ height: '85vh', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Zone 1: Fixed header — never scrolls ──────────────────────── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="p-1 -ml-1 rounded-lg hover:bg-gray-100 shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <h2 className="text-base font-semibold flex-1 leading-tight">
              {step === 1 && 'Log a visit'}
              {step === 2 && 'Upload documents'}
              {step === 3 && 'Review visit details'}
              {step === 4 && 'Ready to save'}
            </h2>
            <button
              onClick={() => handleOpenChange(false)}
              className="p-1 rounded-lg hover:bg-gray-100 shrink-0"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <ProgressDots current={step} total={4} />
        </div>

        {/* ── Zone 2: Scrollable content ────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-5"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >

          {/* ─── STEP 1: Who and what condition? ────────────────────────── */}
          {step === 1 && (
            <>
              {/* Member chips */}
              <div className="space-y-2">
                <Label>Who visited the doctor?</Label>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6">
                  {familyMembers.map((m) => {
                    const selected = m.id === selectedMemberId
                    const color = AVATAR_COLORS[m.relation ?? 'other'] ?? AVATAR_COLORS.other
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleMemberSelect(m.id)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-colors ${
                          selected
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-border bg-white hover:bg-muted/30'
                        }`}
                      >
                        <div
                          className={`size-9 rounded-full flex items-center justify-center font-semibold text-xs ${
                            selected ? 'bg-teal-500 text-white' : color
                          }`}
                        >
                          {getInitials(m.full_name)}
                        </div>
                        <span className="text-xs font-medium">{getFirstName(m.full_name)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Condition list */}
              {selectedMemberId && (
                <div className="space-y-2">
                  <Label>Which condition?</Label>
                  {loadingConditions && (
                    <p className="text-xs text-muted-foreground">Loading conditions…</p>
                  )}
                  {!loadingConditions && memberConditions.length === 0 && !isNewCondition && (
                    <p className="text-xs text-muted-foreground">
                      No conditions yet — enter a new one below.
                    </p>
                  )}
                  {memberConditions.map((cond) => {
                    const cfg = STATUS_CONFIG[cond.status] ?? STATUS_CONFIG.active
                    const selected = cond.id === selectedConditionId
                    return (
                      <button
                        key={cond.id}
                        onClick={() => {
                          setSelectedConditionId(cond.id)
                          setIsNewCondition(false)
                          setNewConditionName('')
                        }}
                        className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                          selected
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-border hover:bg-muted/20'
                        }`}
                      >
                        <span className={`size-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className="flex-1 text-sm font-medium min-w-0 truncate">
                          {cond.name}
                        </span>
                        <span
                          className={`text-xs font-medium border rounded-full px-2 py-0.5 shrink-0 ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}

                  {/* New condition */}
                  {!isNewCondition ? (
                    <button
                      onClick={() => {
                        setIsNewCondition(true)
                        setSelectedConditionId(null)
                      }}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 pt-1"
                    >
                      + This is a new condition
                    </button>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label>New condition name</Label>
                        <button
                          onClick={() => { setIsNewCondition(false); setNewConditionName('') }}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                      <Input
                        autoFocus
                        value={newConditionName}
                        onChange={(e) => setNewConditionName(e.target.value)}
                        placeholder="e.g. Diabetes Type 2"
                      />
                      <p className="text-xs text-muted-foreground">
                        We'll match this to ICD-10 automatically
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── STEP 2: Upload + AI extraction ─────────────────────────── */}
          {step === 2 && (
            <>
              {/* Upload area */}
              {uploadedFiles.length < MAX_FILES && (
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 py-6 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                  <Upload className="size-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Tap to upload</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, PDF — multiple files supported</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="sr-only"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                </label>
              )}

              {/* Uploaded file chips */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5 bg-muted/20"
                    >
                      {file.type.startsWith('image/') ? (
                        <FileImage className="size-4 text-teal-600 shrink-0" />
                      ) : (
                        <FileText className="size-4 text-indigo-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <button onClick={() => removeFile(idx)} className="shrink-0 p-1 rounded hover:bg-muted">
                        <X className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {fileError && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3 shrink-0" /> {fileError}
                </p>
              )}

              {/* Extract with AI button */}
              {uploadedFiles.length > 0 && !extractedData && (
                <button
                  type="button"
                  onClick={runExtraction}
                  disabled={isExtractingAll}
                  className="flex items-start gap-3 rounded-xl border border-teal-400 bg-teal-50 px-4 py-3 text-left w-full hover:bg-teal-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExtractingAll ? (
                    <Loader2 className="size-4 text-teal-600 shrink-0 mt-0.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-4 text-teal-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-teal-800">
                      {isExtractingAll ? 'Reading documents…' : 'Extract details from all documents'}
                    </p>
                    {!isExtractingAll && (
                      <p className="text-xs text-teal-600 mt-0.5">
                        AI reads all files and fills the form below
                      </p>
                    )}
                  </div>
                </button>
              )}

              {extractionError && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="size-3 shrink-0 mt-0.5" /> {extractionError}
                </p>
              )}

              {/* Extraction result panel */}
              {extractedData && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-teal-600" />
                      <p className="text-sm font-semibold text-teal-900">
                        Extracted from {uploadedFiles.filter((f) => IMAGE_TYPES.includes(f.type)).length} document
                        {uploadedFiles.filter((f) => IMAGE_TYPES.includes(f.type)).length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium border rounded-full px-2 py-0.5 ${
                        extractedData.confidence === 'high'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : extractedData.confidence === 'medium'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}
                    >
                      {extractedData.confidence === 'high'
                        ? 'High confidence'
                        : extractedData.confidence === 'medium'
                        ? 'Review carefully'
                        : 'Low confidence'}
                    </span>
                  </div>

                  {/* Extracted field chips */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Doctor', value: extractedData.doctor_name },
                      { label: 'Hospital', value: extractedData.hospital_name },
                      { label: 'Date', value: extractedData.visit_date },
                      { label: 'Type', value: extractedData.document_type },
                    ]
                      .filter((f) => f.value)
                      .map((f) => (
                        <div
                          key={f.label}
                          className="rounded-lg bg-white border border-teal-100 px-2.5 py-1.5"
                        >
                          <p className="text-xs text-teal-600 font-medium">{f.label}</p>
                          <p className="text-xs text-teal-900 truncate">{f.value}</p>
                        </div>
                      ))}
                  </div>

                  {/* Medication toggles */}
                  {extractedMeds.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-semibold text-teal-800">
                        Medications ({extractedMeds.filter((m) => m.enabled).length} of{' '}
                        {extractedMeds.length} selected)
                      </p>
                      {extractedMeds.map((med) => (
                        <div
                          key={med.id}
                          className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                            med.enabled
                              ? 'border-teal-200 bg-white'
                              : 'border-border bg-muted/20 opacity-60'
                          }`}
                        >
                          <Pill className="size-3.5 text-teal-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{med.name}</p>
                            {med.dosage && (
                              <p className="text-xs text-muted-foreground">{med.dosage}</p>
                            )}
                          </div>
                          <Switch
                            checked={med.enabled}
                            onCheckedChange={(v) => toggleMedEnabled(med.id, v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-teal-600 italic text-center">
                    Review all fields — tap to edit
                  </p>
                </div>
              )}
            </>
          )}

          {/* ─── STEP 3: Review and edit ─────────────────────────────────── */}
          {step === 3 && (
            <>
              {extractionUsed && (
                <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
                  <Sparkles className="size-3.5 text-teal-600 shrink-0" />
                  <p className="text-xs text-teal-700">Pre-filled by AI — tap to edit</p>
                </div>
              )}

              {/* Visit fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="doctor_name">Doctor Name</Label>
                  <Input
                    id="doctor_name"
                    value={visitDetails.doctor_name}
                    onChange={(e) => updateVisit('doctor_name', e.target.value)}
                    placeholder="e.g. Dr. Anjali Sharma"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hospital_name">Hospital / Clinic</Label>
                  <Input
                    id="hospital_name"
                    value={visitDetails.hospital_name}
                    onChange={(e) => updateVisit('hospital_name', e.target.value)}
                    placeholder="e.g. Apollo Hospitals, Mumbai"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="visit_date">Date</Label>
                    <Input
                      id="visit_date"
                      type="date"
                      value={visitDetails.visit_date}
                      max={todayISO()}
                      onChange={(e) => updateVisit('visit_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Visit Type</Label>
                    <Select
                      value={visitDetails.visit_type}
                      onValueChange={(v) => updateVisit('visit_type', v as ConsultationType)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={visitDetails.notes}
                    onChange={(e) => updateVisit('notes', e.target.value)}
                    placeholder="Any notes about the visit…"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Medications */}
              {enabledMeds.length > 0 ? (
                <div className="space-y-2">
                  <Label>Medications from this visit</Label>
                  {enabledMeds.map((med) => (
                    <div key={med.id} className="rounded-xl border p-3 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Pill className="size-3.5 text-teal-600 shrink-0" />
                        <p className="text-sm font-medium flex-1 truncate">{med.name}</p>
                        {med.dosage && (
                          <span className="text-xs text-muted-foreground shrink-0">{med.dosage}</span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Frequency</Label>
                        <Select
                          value={med.frequency}
                          onValueChange={(v) => updateMed(med.id, 'frequency', v)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MEDICATION_FREQUENCIES.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium">WhatsApp reminder</p>
                          <p className="text-xs text-muted-foreground">Send at scheduled times</p>
                        </div>
                        <Switch
                          checked={med.reminderEnabled}
                          onCheckedChange={(v) => updateMed(med.id, 'reminderEnabled', v)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground rounded-lg bg-muted/30 px-3 py-2.5">
                  No medications extracted. Add medications later from the Medications page.
                </p>
              )}
            </>
          )}

          {/* ─── STEP 4: Save everything ─────────────────────────────────── */}
          {step === 4 && (
            <>
              {saveError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{saveError}</p>
                </div>
              )}

              {/* Summary card */}
              <div className="rounded-xl border divide-y">
                {/* Visit */}
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Visit
                  </p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <span className="font-medium">
                        {VISIT_TYPES.find((t) => t.value === visitDetails.visit_type)?.label}
                      </span>
                      {visitDetails.doctor_name && ` — ${visitDetails.doctor_name}`}
                      {visitDetails.hospital_name && ` · ${visitDetails.hospital_name}`}
                      {visitDetails.visit_date && ` · ${new Date(visitDetails.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                  </div>
                </div>

                {/* Condition */}
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Condition
                  </p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      {isNewCondition ? (
                        <>New condition: <span className="font-medium">{newConditionName}</span></>
                      ) : selectedConditionId ? (
                        <span className="font-medium">
                          {memberConditions.find((c) => c.id === selectedConditionId)?.name ?? 'Selected condition'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No condition linked</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Documents
                  </p>
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="size-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <p className="text-sm truncate">{f.name}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents</p>
                  )}
                </div>

                {/* Medications */}
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Medications
                  </p>
                  {enabledMeds.length > 0 ? (
                    enabledMeds.map((m) => (
                      <div key={m.id} className="flex items-start gap-2">
                        <CheckCircle className="size-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <p className="text-sm">
                          <span className="font-medium">{m.name}</span>
                          {m.dosage && ` ${m.dosage}`}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No medications</p>
                  )}
                </div>

                {/* Member */}
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    For
                  </p>
                  <p className="text-sm font-medium">{selectedMember?.full_name ?? '—'}</p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* ── Zone 3: Fixed footer — always visible ─────────────────────── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
          {step === 1 && (
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              Next →
            </Button>
          )}
          {step === 2 && (
            uploadedFiles.length === 0 ? (
              <button
                onClick={() => setStep(3)}
                className="w-full text-sm text-center text-muted-foreground hover:text-foreground py-2"
              >
                Skip, continue manually →
              </button>
            ) : (
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => setStep(3)}
              >
                Next →
              </Button>
            )
          )}
          {step === 3 && (
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={() => setStep(4)}
            >
              Review summary →
            </Button>
          )}
          {step === 4 && (
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </span>
              ) : (
                'Save visit'
              )}
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
