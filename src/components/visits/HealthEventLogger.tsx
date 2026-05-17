'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
function getInitials(name: string) { return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) }
function getFirstName(name: string) { return name.split(' ')[0] }
function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function fmtDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ConditionOption = { id: string; name: string; status: string }
type ICD10Condition  = { id: string; name: string; category: string }

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

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mt-3">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < current ? 'bg-teal-500' : 'bg-muted'}`} />
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
  const [fileError, setFileError] = useState<string | null>(null)
  const [isExtractingAll, setIsExtractingAll] = useState(false)
  const [showSlowWarning, setShowSlowWarning] = useState(false)
  const [extractionDone, setExtractionDone] = useState(false)
  const [extractionMedCount, setExtractionMedCount] = useState<number | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  // Shared extraction result (used by Step 3)
  const [visitDetails, setVisitDetails] = useState<VisitDetails>({
    doctor_name: '', hospital_name: '', visit_date: todayISO(), visit_type: 'visit', notes: '',
  })
  const [meds, setMeds] = useState<MedEntry[]>([])

  // Step 4
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { extractFromFiles } = useDocumentExtraction()

  // Fetch ICD-10 on mount
  useEffect(() => {
    async function fetchIcd10() {
      setLoadingIcd10(true)
      try {
        const supabase = createClient()
        const { data } = await supabase.from('icd10_conditions').select('id, name, category').order('name')
        if (data) setIcd10Conditions(data as ICD10Condition[])
      } finally {
        setLoadingIcd10(false)
      }
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
    setFileError(null)
    setIsExtractingAll(false)
    setShowSlowWarning(false)
    if (slowWarningTimerRef.current) clearTimeout(slowWarningTimerRef.current)
    setExtractionDone(false)
    setExtractionMedCount(null)
    setExtractionError(null)
    setVisitDetails({ doctor_name: '', hospital_name: '', visit_date: todayISO(), visit_type: 'visit', notes: '' })
    setMeds([])
    setIsSaving(false)
    setSaveError(null)
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
    } finally {
      setLoadingConditions(false)
    }
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
      if (!ACCEPTED_TYPES.includes(f.type)) { setFileError('Only PDF, JPG, and PNG files are accepted'); return }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) { setFileError(`Each file must be under ${MAX_FILE_SIZE_MB} MB`); return }
      toAdd.push(f)
    }
    const merged = [...uploadedFiles, ...toAdd].slice(0, MAX_FILES)
    if (uploadedFiles.length + toAdd.length > MAX_FILES) setFileError(`Maximum ${MAX_FILES} files allowed`)
    setUploadedFiles(merged)
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    setExtractionDone(false)
    setExtractionMedCount(null)
    setMeds([])
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
    setExtractionMedCount(null)
    setShowSlowWarning(false)
    slowWarningTimerRef.current = setTimeout(() => setShowSlowWarning(true), 8000)

    try {
      const result = await extractFromFiles(uploadedFiles)
      if (result) {
        // Pre-fill visit details from extraction
        setVisitDetails((prev) => ({
          ...prev,
          doctor_name: result.prescribed_by || prev.doctor_name,
          visit_date:  result.visit_date    || prev.visit_date,
        }))
        // Build medication entries
        setMeds(result.medications.map((m, i) => ({
          id:            `xmed-${i}`,
          name:          m.name ?? '',
          dosage:        m.dose ?? '',
          frequency:     m.frequency ?? 'once daily',
          time_of_day:   m.time_of_day,
          notes:         m.notes ?? '',
          start_date:    m.start_date ?? todayISO(),
          end_date:      m.end_date ?? '',
          prescribed_by: result.prescribed_by ?? '',
          reminderEnabled: false,
        })))
        setExtractionMedCount(result.medications.length)
        setExtractionDone(true)
      } else {
        setExtractionError('Extraction failed. You can add medications manually in the next step.')
      }
    } finally {
      if (slowWarningTimerRef.current) clearTimeout(slowWarningTimerRef.current)
      setIsExtractingAll(false)
    }
  }

  // ── Med helpers (Step 3) ───────────────────────────────────────────────────
  function addMed() {
    setMeds((prev) => [
      ...prev,
      {
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
      },
    ])
  }

  function removeMed(id: string) {
    setMeds((prev) => prev.filter((m) => m.id !== id))
  }

  function updateMed<K extends keyof MedEntry>(id: string, key: K, value: MedEntry[K]) {
    setMeds((prev) => prev.map((m) => {
      if (m.id !== id) return m
      const updated = { ...m, [key]: value }
      if (key === 'frequency') {
        updated.time_of_day = TIME_DEFAULTS[value as string] ?? ['08:00']
      }
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

      const savedDocs: Array<{ fileUrl: string; mimeType: string; fileSizeKb: number; title: string; documentType: DocumentType }> = []
      for (const file of uploadedFiles) {
        const sanitized = file.name.replace(/\s+/g, '_')
        const filePath = `${group.id}/${selectedMemberId}/${Date.now()}_${sanitized}`
        const { error: uploadErr } = await supabase.storage.from('familycare-docs').upload(filePath, file, { upsert: false })
        if (uploadErr) throw uploadErr
        savedDocs.push({ fileUrl: filePath, mimeType: file.type, fileSizeKb: Math.round(file.size / 1024), title: file.name.replace(/\.[^.]+$/, ''), documentType: 'prescription' })
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
            name:           m.name,
            dosage:         m.dosage,
            frequency:      m.frequency,
            timeOfDay:      m.time_of_day,
            notes:          m.notes || undefined,
            startDate:      m.start_date || undefined,
            endDate:        m.end_date   || undefined,
            prescribedBy:   m.prescribed_by || undefined,
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
  const step3HasEmptyName = meds.some((m) => !m.name.trim())

  // Step 4 incomplete-field warnings
  const incompleteWarnings = meds
    .filter((m) => m.name.trim())
    .map((m) => {
      const missing: string[] = []
      if (!m.dosage) missing.push('dose')
      if (!m.end_date) missing.push('end date')
      if (!m.prescribed_by) missing.push('prescribed by')
      return missing.length > 0 ? { name: m.name, missing } : null
    })
    .filter((x): x is { name: string; missing: string[] } => x !== null)

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
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 shrink-0" aria-label="Back">
                <ArrowLeft className="size-4" />
              </button>
            )}
            <h2 className="text-base font-semibold flex-1 leading-tight">
              {step === 1 && 'Log a visit'}
              {step === 2 && 'Upload documents'}
              {step === 3 && 'Medications'}
              {step === 4 && 'Ready to save'}
            </h2>
            <button onClick={() => handleOpenChange(false)} className="p-1 rounded-lg hover:bg-gray-100 shrink-0" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <ProgressDots current={step} total={4} />
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
                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-colors ${selected ? 'border-teal-500 bg-teal-50' : 'border-border bg-white hover:bg-muted/30'}`}>
                        <div className={`size-9 rounded-full flex items-center justify-center font-semibold text-xs ${selected ? 'bg-teal-500 text-white' : color}`}>
                          {getInitials(m.full_name)}
                        </div>
                        <span className="text-xs font-medium">{getFirstName(m.full_name)}</span>
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
                        className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? 'border-teal-500 bg-teal-50' : 'border-border hover:bg-muted/20'}`}>
                        <span className={`size-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className="flex-1 text-sm font-medium min-w-0 truncate">{cond.name}</span>
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
                              onChange={(e) => { setNewConditionName(e.target.value); setNewConditionIcd10Id(null); setComboboxOpen(true) }}
                              onFocus={() => setComboboxOpen(true)}
                              onBlur={() => setTimeout(() => setComboboxOpen(false), 200)}
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
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 py-6 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
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

              {fileError && (
                <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3 shrink-0" /> {fileError}</p>
              )}

              {/* Extract button — shown while extraction not yet done */}
              {uploadedFiles.length > 0 && !extractionDone && (
                <>
                  <button type="button" onClick={runExtraction} disabled={isExtractingAll}
                    className="flex items-start gap-3 rounded-xl border border-teal-400 bg-teal-50 px-4 py-3 text-left w-full hover:bg-teal-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {isExtractingAll ? <Loader2 className="size-4 text-teal-600 shrink-0 mt-0.5 animate-spin" /> : <Sparkles className="size-4 text-teal-600 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-teal-800">
                        {isExtractingAll ? 'Extracting…' : 'Extract medications from documents'}
                      </p>
                      {!isExtractingAll && <p className="text-xs text-teal-600 mt-0.5">AI reads all files and pre-fills medications in the next step</p>}
                    </div>
                  </button>
                  {isExtractingAll && showSlowWarning && (
                    <p className="text-xs text-muted-foreground text-center">This is taking longer than usual — large files may take up to 30 seconds.</p>
                  )}
                  <p className="text-xs text-muted-foreground text-center">Documents are processed by Anthropic&apos;s AI and are not stored or used for training.</p>
                </>
              )}

              {/* Extraction success summary */}
              {extractionDone && extractionMedCount !== null && (
                <div className="flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                  <CheckCircle className="size-4 text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-teal-800">
                    {extractionMedCount > 0
                      ? <>Found <span className="font-semibold">{extractionMedCount} medication{extractionMedCount > 1 ? 's' : ''}</span> — review and complete details in the next step</>
                      : 'No medications found. You can add them manually in the next step.'
                    }
                  </p>
                </div>
              )}

              {/* Extraction error */}
              {extractionError && !isExtractingAll && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="size-3 shrink-0 mt-0.5" /> {extractionError}
                </p>
              )}
            </>
          )}

          {/* ─── STEP 3: Medication review ────────────────────────────── */}
          {step === 3 && (
            <>
              <div>
                <p className="text-sm font-semibold">Medications from this visit</p>
                {meds.length > 0 ? (
                  <p className="text-xs text-muted-foreground mt-0.5">Review AI-filled details and complete any missing fields</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Add medications prescribed during this visit</p>
                )}
              </div>

              {meds.length === 0 && (
                <div className="rounded-xl border border-dashed px-4 py-8 text-center">
                  <Pill className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No medications added for this visit</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap &apos;Add medication&apos; to add one, or tap Next to skip</p>
                </div>
              )}

              <div className="space-y-4">
                {meds.map((med) => (
                  <div key={med.id} className="rounded-xl border p-4 space-y-3">

                    {/* Name */}
                    <div className="space-y-1">
                      <Label className="text-xs">Medication name <span className="text-destructive">*</span></Label>
                      <Input value={med.name} onChange={(e) => updateMed(med.id, 'name', e.target.value)}
                        placeholder="e.g. Metformin"
                        className={!med.name.trim() ? 'border-destructive' : ''} />
                    </div>

                    {/* Dose + Frequency */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Dose</Label>
                        <Input value={med.dosage} onChange={(e) => updateMed(med.id, 'dosage', e.target.value)} placeholder="e.g. 500mg" />
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

                    {/* Time chips */}
                    {med.frequency !== 'as needed' && med.time_of_day.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs">Times</Label>
                        <div className="flex flex-wrap gap-2">
                          {med.time_of_day.map((t, ti) => (
                            <input key={ti} type="time" value={t}
                              onChange={(e) => updateMedTime(med.id, ti, e.target.value)}
                              className="px-2.5 py-1 rounded-full border text-xs font-medium bg-muted/40 focus:outline-none focus:ring-1 focus:ring-teal-400" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Start + End date */}
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

                    {/* Prescribed by */}
                    <div className="space-y-1">
                      <Label className="text-xs">Prescribed by</Label>
                      <Input value={med.prescribed_by} onChange={(e) => updateMed(med.id, 'prescribed_by', e.target.value)} placeholder="e.g. Dr. Anjali Sharma" />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Input value={med.notes} onChange={(e) => updateMed(med.id, 'notes', e.target.value)} placeholder="e.g. After food, before sleep" />
                    </div>

                    {/* Reminders — OFF by default, hidden for as-needed */}
                    {med.frequency !== 'as needed' && (
                      <div className="space-y-1.5 pt-1 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {med.reminderEnabled ? <Bell className="size-3.5 text-teal-600" /> : <BellOff className="size-3.5 text-muted-foreground" />}
                            <span className="text-xs font-medium">{med.reminderEnabled ? 'Reminders on' : 'Reminders off'}</span>
                          </div>
                          <Switch checked={med.reminderEnabled} onCheckedChange={(v) => updateMed(med.id, 'reminderEnabled', v)} />
                        </div>
                        {!med.reminderEnabled && (
                          <p className="text-xs text-amber-600">⚠ Turn on after verifying medication details</p>
                        )}
                      </div>
                    )}

                    {/* Remove */}
                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={() => removeMed(med.id)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                        <Trash2 className="size-3" /> Remove this medication
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addMed}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium text-teal-600 hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                <Plus className="size-4" /> Add medication
              </button>
            </>
          )}

          {/* ─── STEP 4: Review + save ─────────────────────────────────── */}
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

                {/* Condition */}
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      {isNewCondition
                        ? <></>
                        : selectedConditionId
                          ? <span className="font-medium">{memberConditions.find((c) => c.id === selectedConditionId)?.name ?? 'Selected condition'}</span>
                          : <span className="text-muted-foreground">No condition linked</span>
                      }
                      {isNewCondition && <>New condition: <span className="font-medium">{newConditionName}</span></>}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documents</p>
                  {uploadedFiles.length > 0
                    ? uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="size-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <p className="text-sm truncate">{f.name}</p>
                        </div>
                      ))
                    : <p className="text-sm text-muted-foreground">No documents</p>
                  }
                </div>

                {/* Medications */}
                <div className="p-3.5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medications from this visit</p>
                  {meds.filter((m) => m.name.trim()).length === 0
                    ? <p className="text-sm text-muted-foreground">No medications</p>
                    : meds.filter((m) => m.name.trim()).map((m) => (
                        <div key={m.id} className="rounded-lg bg-muted/30 px-3 py-2.5 space-y-0.5">
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
                      ))
                  }
                </div>

                {/* Member */}
                <div className="p-3.5 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">For</p>
                  <p className="text-sm font-medium">{selectedMember?.full_name ?? '—'}</p>
                </div>
              </div>

              {/* Incomplete field warnings */}
              {incompleteWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-800">⚠ Some medication details are incomplete:</p>
                  {incompleteWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-700">
                      • <span className="font-medium">{w.name}</span> — missing: {w.missing.join(', ')}
                    </p>
                  ))}
                </div>
              )}

              {/* Reminder summary */}
              {medsWithReminderOff > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-xs text-blue-800">
                    💊 Reminders are off for <span className="font-semibold">{medsWithReminderOff} medication{medsWithReminderOff > 1 ? 's' : ''}</span>.
                    Go to Medications to enable reminders after saving.
                  </p>
                </div>
              )}
            </>
          )}

        </div>

        {/* ── Zone 3: Fixed footer ──────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
          {step === 1 && (
            <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled={!step1Valid} onClick={() => setStep(2)}>
              Next →
            </Button>
          )}
          {step === 2 && (
            uploadedFiles.length === 0 ? (
              <button onClick={() => setStep(3)} className="w-full text-sm text-center text-muted-foreground hover:text-foreground py-2">
                Skip, continue manually →
              </button>
            ) : (
              <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled={isExtractingAll} onClick={() => setStep(3)}>
                Next →
              </Button>
            )
          )}
          {step === 3 && (
            <div className="space-y-2">
              {step3HasEmptyName && (
                <p className="text-xs text-center text-amber-600">Please enter a name for all medications before continuing</p>
              )}
              <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled={step3HasEmptyName} onClick={() => setStep(4)}>
                Review summary →
              </Button>
            </div>
          )}
          {step === 4 && (
            <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Saving…</span> : 'Save visit'}
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
