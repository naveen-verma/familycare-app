'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckIcon,
  SearchIcon,
  XIcon,
  PlusIcon,
  UploadIcon,
  FileIcon,
  CheckCircleIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logVisitAction, type LogVisitInput, type LogVisitResult } from '@/app/(dashboard)/visits/actions'
import type { ICD10Condition, DocumentType, ConsultationType } from '@/types/database'
import type { FamilyMemberSummary } from '@/components/dashboard/QuickActionsBar'

// ─── Constants ──────────────────────────────────────────────────────────────

const CONSULTATION_TYPES: { value: ConsultationType; label: string }[] = [
  { value: 'visit', label: 'Visit' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'test', label: 'Test / Checkup' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'hospitalization', label: 'Hospitalisation' },
  { value: 'therapy', label: 'Therapy' },
  { value: 'other', label: 'Other' },
]

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'report', label: 'Lab Report' },
  { value: 'scan', label: 'Scan / Imaging' },
  { value: 'other', label: 'Discharge Summary / Other' },
]

const MEDICATION_FREQUENCIES = [
  { value: 'Once Daily', label: 'Once Daily' },
  { value: 'Twice Daily', label: 'Twice Daily' },
  { value: 'Three Times Daily', label: 'Three Times Daily' },
  { value: 'Four Times Daily', label: 'Four Times Daily' },
  { value: 'Every Alternate Day', label: 'Every Alternate Day' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'As Needed', label: 'As Needed' },
  { value: 'Other', label: 'Other' },
]

const MAX_FILE_SIZE_MB = 10
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function avatarColors(relation: string | null): string {
  const map: Record<string, string> = {
    self: 'bg-blue-100 text-blue-700',
    spouse: 'bg-pink-100 text-pink-700',
    child: 'bg-green-100 text-green-700',
    parent: 'bg-purple-100 text-purple-700',
    sibling: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-700',
  }
  return map[relation ?? 'other'] ?? map.other
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function defaultTimesForFrequency(freq: string): string[] {
  switch (freq) {
    case 'Once Daily':          return ['08:00']
    case 'Twice Daily':         return ['08:00', '18:00']
    case 'Three Times Daily':   return ['08:00', '13:00', '21:00']
    case 'Four Times Daily':    return ['08:00', '13:00', '18:00', '21:00']
    case 'Every Alternate Day': return ['08:00']
    case 'Weekly':              return ['08:00']
    case 'As Needed':           return []
    case 'Other':               return ['08:00']
    default:                    return []
  }
}

function timePickerLabels(freq: string): string[] {
  switch (freq) {
    case 'Once Daily':          return ['Time']
    case 'Twice Daily':         return ['Morning', 'Evening']
    case 'Three Times Daily':   return ['Morning', 'Afternoon', 'Night']
    case 'Four Times Daily':    return ['Morning', 'Afternoon', 'Evening', 'Night']
    case 'Every Alternate Day': return ['Time']
    case 'Weekly':              return ['Time']
    case 'As Needed':           return []
    case 'Other':               return ['Time']
    default:                    return []
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 'success'
type ConditionMode = 'new_icd10' | 'existing' | 'custom' | 'skip'

interface MedEntry {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  time_of_day: string[]
}

interface ExistingCondition {
  id: string
  name: string
}

let medEntryCounter = 0
function newMedEntry(): MedEntry {
  return {
    id: `med-${++medEntryCounter}`,
    name: '',
    dosage: '',
    frequency: 'Once Daily',
    startDate: todayISO(),
    time_of_day: ['08:00'],
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LogVisitSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: FamilyMemberSummary[]
  onSuccess: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LogVisitSheet({ open, onOpenChange, members, onSuccess }: LogVisitSheetProps) {
  const router = useRouter()

  // Navigation
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // Step 2
  const [doctorName, setDoctorName] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [consultationDate, setConsultationDate] = useState(todayISO())
  const [consultationType, setConsultationType] = useState<ConsultationType>('visit')
  const [visitNotes, setVisitNotes] = useState('')
  const [step2Errors, setStep2Errors] = useState<{ doctorName?: string; date?: string }>({})

  // Step 3
  const [conditionMode, setConditionMode] = useState<ConditionMode>('skip')
  const [icd10Conditions, setIcd10Conditions] = useState<ICD10Condition[]>([])
  const [icd10Loading, setIcd10Loading] = useState(false)
  const [icd10Search, setIcd10Search] = useState('')
  const [selectedIcd10, setSelectedIcd10] = useState<ICD10Condition | null>(null)
  const [existingConditions, setExistingConditions] = useState<ExistingCondition[]>([])
  const [existingConditionId, setExistingConditionId] = useState('')
  const [customConditionName, setCustomConditionName] = useState('')

  // Step 4
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('prescription')
  const [documentNotes, setDocumentNotes] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 5
  const [medications, setMedications] = useState<MedEntry[]>([])

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<LogVisitResult | null>(null)

  // ── Reset everything when sheet closes ──────────────────────────────────────
  function resetAll() {
    setStep(1)
    setSelectedMemberId(null)
    setDoctorName('')
    setHospitalName('')
    setConsultationDate(todayISO())
    setConsultationType('visit')
    setVisitNotes('')
    setStep2Errors({})
    setConditionMode('skip')
    setIcd10Conditions([])
    setIcd10Loading(false)
    setIcd10Search('')
    setSelectedIcd10(null)
    setExistingConditions([])
    setExistingConditionId('')
    setCustomConditionName('')
    setSelectedFile(null)
    setDocumentType('prescription')
    setDocumentNotes('')
    setFileError(null)
    setMedications([])
    setSaving(false)
    setSaveError(null)
    setSaveResult(null)
  }

  function handleOpenChange(v: boolean) {
    if (!v) resetAll()
    onOpenChange(v)
  }

  // ── Lazy load ICD-10 + existing conditions when step 3 opens ─────────────────
  useEffect(() => {
    if (step !== 3) return

    async function loadConditionData() {
      const supabase = createClient()

      if (icd10Conditions.length === 0) {
        setIcd10Loading(true)
        const { data } = await supabase
          .from('icd10_conditions')
          .select('id, icd10_code, name, common_name, category, is_critical')
          .order('name')
        setIcd10Conditions((data as ICD10Condition[]) ?? [])
        setIcd10Loading(false)
      }

      if (selectedMemberId && existingConditions.length === 0) {
        const { data } = await supabase
          .from('medical_conditions')
          .select('id, custom_name, icd10_conditions(common_name, name)')
          .eq('family_member_id', selectedMemberId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
        if (data) {
          setExistingConditions(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.map((c: any) => ({
              id: c.id,
              name: c.icd10_conditions?.common_name ?? c.icd10_conditions?.name ?? c.custom_name ?? 'Unknown',
            }))
          )
        }
      }
    }

    loadConditionData()
  }, [step, selectedMemberId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── ICD-10 search filter ─────────────────────────────────────────────────────
  const icd10Filtered =
    icd10Search.length > 1
      ? icd10Conditions
          .filter(
            (c) =>
              c.name.toLowerCase().includes(icd10Search.toLowerCase()) ||
              (c.common_name && c.common_name.toLowerCase().includes(icd10Search.toLowerCase())) ||
              c.icd10_code.toLowerCase().includes(icd10Search.toLowerCase())
          )
          .slice(0, 8)
      : []

  const icd10NoMatch = icd10Search.length > 1 && icd10Filtered.length === 0 && !icd10Loading

  // ── Step 2 validation ────────────────────────────────────────────────────────
  function validateStep2(): boolean {
    const errs: { doctorName?: string; date?: string } = {}
    if (!doctorName.trim()) errs.doctorName = 'Doctor name is required'
    if (!consultationDate) errs.date = 'Date is required'
    else if (consultationDate > todayISO()) errs.date = 'Date cannot be in the future'
    setStep2Errors(errs)
    return Object.keys(errs).length === 0
  }

  // ── File handling ────────────────────────────────────────────────────────────
  function handleFileChange(file: File | null) {
    setFileError(null)
    if (!file) { setSelectedFile(null); return }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFileError('Only PDF, JPG, and PNG files are accepted')
      return
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File must be smaller than ${MAX_FILE_SIZE_MB} MB`)
      return
    }
    setSelectedFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    handleFileChange(e.dataTransfer.files[0] ?? null)
  }

  // ── Medication helpers ────────────────────────────────────────────────────────
  function addMedication() {
    setMedications((prev) => [...prev, newMedEntry()])
  }

  function updateMedication(id: string, field: 'name' | 'dosage' | 'startDate', value: string) {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  function updateMedicationFrequency(id: string, freq: string) {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, frequency: freq, time_of_day: defaultTimesForFrequency(freq) }
          : m
      )
    )
  }

  function updateMedicationTime(id: string, index: number, value: string) {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const times = [...m.time_of_day]
        times[index] = value
        return { ...m, time_of_day: times }
      })
    )
  }

  function removeMedication(id: string) {
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    setSaveError(null)

    try {
      const supabase = createClient()
      let uploadedFileUrl: string | null = null
      let uploadedFileType = ''
      let uploadedFileSizeKb = 0

      // Upload file to Supabase Storage if one was selected
      if (selectedFile) {
        // Get family group ID for path construction
        const { data: userRes } = await supabase.auth.getUser()
        if (!userRes.user) throw new Error('Not authenticated')

        const { data: profileRes } = await supabase
          .from('users')
          .select('id')
          .eq('supabase_auth_id', userRes.user.id)
          .single()

        const { data: groupRes } = await supabase
          .from('family_groups')
          .select('id')
          .eq('owner_id', profileRes?.id)
          .single()

        const familyGroupId = groupRes?.id
        if (!familyGroupId || !selectedMemberId) throw new Error('Family group not found')

        const sanitizedName = selectedFile.name.replace(/\s+/g, '_')
        const filePath = `${familyGroupId}/${selectedMemberId}/${Date.now()}_${sanitizedName}`

        const { error: uploadError } = await supabase.storage
          .from('familycare-docs')
          .upload(filePath, selectedFile, { upsert: false })

        if (uploadError) throw uploadError

        uploadedFileUrl = filePath
        uploadedFileType = selectedFile.type
        uploadedFileSizeKb = Math.round(selectedFile.size / 1024)
      }

      // Determine condition mode details
      let resolvedConditionMode: LogVisitInput['conditionMode'] = 'skip'
      if (conditionMode === 'new_icd10' && selectedIcd10) {
        resolvedConditionMode = 'new_icd10'
      } else if (conditionMode === 'custom' && customConditionName.trim()) {
        resolvedConditionMode = 'custom'
      } else if (conditionMode === 'existing' && existingConditionId) {
        resolvedConditionMode = 'existing'
      }

      const result = await logVisitAction({
        memberId: selectedMemberId!,
        doctorName: doctorName.trim(),
        hospitalName: hospitalName.trim() || undefined,
        consultationDate,
        consultationType,
        visitNotes: visitNotes.trim() || undefined,
        conditionMode: resolvedConditionMode,
        existingConditionId: existingConditionId || undefined,
        icd10ConditionId: selectedIcd10?.id,
        customConditionName: customConditionName.trim() || undefined,
        document: uploadedFileUrl
          ? {
              title:
                selectedFile!.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') ||
                DOCUMENT_TYPES.find((d) => d.value === documentType)?.label ||
                'Document',
              fileUrl: uploadedFileUrl,
              fileType: uploadedFileType,
              fileSizeKb: uploadedFileSizeKb,
              documentType,
              notes: documentNotes.trim() || undefined,
            }
          : undefined,
        medications: medications
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name,
            dosage: m.dosage || undefined,
            frequency: m.frequency || undefined,
            startDate: m.startDate || undefined,
            timeOfDay: m.time_of_day,
          })),
      })

      setSaveResult(result)
      setStep('success')
      router.refresh()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Step navigation helpers ──────────────────────────────────────────────────
  function goNext() {
    if (step === 1) setStep(2)
    else if (step === 2) { if (validateStep2()) setStep(3) }
    else if (step === 3) setStep(4)
    else if (step === 4) setStep(5)
  }

  function goBack() {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
    else if (step === 4) setStep(3)
    else if (step === 5) setStep(4)
  }

  const stepNumber = step === 'success' ? 5 : (step as number)

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92vh] overflow-y-auto px-0 pb-safe"
      >
        {/* Progress bar */}
        {step !== 'success' && (
          <div className="px-5 pt-2 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Step {stepNumber} of 5
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${(stepNumber / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="px-5">
          {/* ─── STEP 1: Select Member ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <SheetHeader className="text-left">
                <SheetTitle>Who visited the doctor?</SheetTitle>
              </SheetHeader>
              <div className="space-y-2">
                {members.map((m) => {
                  const selected = m.id === selectedMemberId
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                        selected
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-border bg-white hover:bg-muted/30'
                      }`}
                    >
                      <div
                        className={`size-10 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${avatarColors(m.relation)}`}
                      >
                        {getInitials(m.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {m.relation === 'self' ? 'You' : (m.relation ?? '—')}
                        </p>
                      </div>
                      {selected && <CheckIcon className="size-4 text-teal-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              <div className="pt-2">
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={!selectedMemberId}
                  onClick={goNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Visit Details ─────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <SheetHeader className="text-left">
                <SheetTitle>Visit details</SheetTitle>
                <p className="text-sm text-muted-foreground">Tell us about the doctor visit</p>
              </SheetHeader>

              <div className="space-y-1.5">
                <Label htmlFor="doctorName">Doctor Name *</Label>
                <Input
                  id="doctorName"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Anjali Sharma"
                />
                {step2Errors.doctorName && (
                  <p className="text-xs text-destructive">{step2Errors.doctorName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hospitalName">Hospital / Clinic</Label>
                <Input
                  id="hospitalName"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. Apollo Hospitals, Mumbai"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="consultationDate">Date of Visit *</Label>
                  <Input
                    id="consultationDate"
                    type="date"
                    value={consultationDate}
                    max={todayISO()}
                    onChange={(e) => setConsultationDate(e.target.value)}
                  />
                  {step2Errors.date && (
                    <p className="text-xs text-destructive">{step2Errors.date}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Visit Type</Label>
                  <Select
                    value={consultationType}
                    onValueChange={(v) => setConsultationType(v as ConsultationType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSULTATION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="visitNotes">Notes</Label>
                <Textarea
                  id="visitNotes"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Any notes about the visit..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={goNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Condition ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <SheetHeader className="text-left">
                  <SheetTitle>Any diagnosis or condition?</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Skip if this was a routine visit
                  </p>
                </SheetHeader>
                <button
                  onClick={() => { setConditionMode('skip'); setStep(4) }}
                  className="text-xs font-medium text-teal-600 hover:underline mt-1 shrink-0"
                >
                  Skip →
                </button>
              </div>

              {icd10Loading && (
                <p className="text-xs text-muted-foreground">Loading conditions…</p>
              )}

              {/* ICD-10 search — shown unless "existing" mode active */}
              {conditionMode !== 'existing' && !icd10Loading && (
                <div className="space-y-1.5">
                  <Label>Search condition</Label>
                  {selectedIcd10 ? (
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-teal-50 border-teal-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {selectedIcd10.common_name ?? selectedIcd10.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedIcd10.icd10_code} · {selectedIcd10.name}
                        </p>
                      </div>
                      <button
                        onClick={() => { setSelectedIcd10(null); setConditionMode('skip') }}
                        className="shrink-0"
                      >
                        <XIcon className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Search ICD-10 conditions…"
                        value={icd10Search}
                        onChange={(e) => {
                          setIcd10Search(e.target.value)
                          setConditionMode('skip')
                          setCustomConditionName('')
                        }}
                        className="pl-8"
                      />
                      {icd10Filtered.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md max-h-44 overflow-y-auto">
                          {icd10Filtered.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedIcd10(c)
                                setConditionMode('new_icd10')
                                setIcd10Search('')
                              }}
                              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{c.common_name ?? c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.icd10_code}</p>
                              </div>
                              {c.is_critical && (
                                <span className="text-xs text-destructive font-medium shrink-0 mt-0.5">
                                  Critical
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom name fallback */}
                  {icd10NoMatch && !selectedIcd10 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        No ICD-10 match — enter a custom name:
                      </p>
                      <Input
                        placeholder="Custom condition name"
                        value={customConditionName}
                        onChange={(e) => {
                          setCustomConditionName(e.target.value)
                          setConditionMode(e.target.value.trim() ? 'custom' : 'skip')
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Existing conditions */}
              {existingConditions.length > 0 && !selectedIcd10 && (
                <div className="space-y-1.5">
                  <Label>Or link to an existing condition</Label>
                  <Select
                    value={existingConditionId}
                    onValueChange={(v) => {
                      setExistingConditionId(v)
                      setConditionMode(v ? 'existing' : 'skip')
                      setSelectedIcd10(null)
                      setCustomConditionName('')
                      setIcd10Search('')
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select existing condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingConditions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {existingConditionId && (
                    <button
                      onClick={() => { setExistingConditionId(''); setConditionMode('skip') }}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={goNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Document ─────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <SheetHeader className="text-left">
                  <SheetTitle>Upload a prescription or report?</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Skip if you have nothing to upload now
                  </p>
                </SheetHeader>
                <button
                  onClick={() => { setSelectedFile(null); setStep(5) }}
                  className="text-xs font-medium text-teal-600 hover:underline mt-1 shrink-0"
                >
                  Skip →
                </button>
              </div>

              {/* Drop zone */}
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-8 cursor-pointer hover:border-teal-400 hover:bg-teal-50/40 transition-colors"
                >
                  <UploadIcon className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Tap to select a file</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG · max 10 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3">
                  <FileIcon className="size-8 text-teal-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button onClick={() => setSelectedFile(null)}>
                    <XIcon className="size-4 text-muted-foreground" />
                  </button>
                </div>
              )}

              {fileError && <p className="text-xs text-destructive">{fileError}</p>}

              <div className="space-y-1.5">
                <Label>Document Type</Label>
                <Select
                  value={documentType}
                  onValueChange={(v) => setDocumentType(v as DocumentType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="docNotes">Notes</Label>
                <Input
                  id="docNotes"
                  value={documentNotes}
                  onChange={(e) => setDocumentNotes(e.target.value)}
                  placeholder="Optional note about this document"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={goNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 5: Medications ──────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <SheetHeader className="text-left">
                  <SheetTitle>Any new medications prescribed?</SheetTitle>
                  <p className="text-sm text-muted-foreground">Skip if no new medications</p>
                </SheetHeader>
              </div>

              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.id} className="rounded-xl border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Medication
                      </p>
                      <button onClick={() => removeMedication(med.id)}>
                        <XIcon className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Name *</Label>
                      <Input
                        value={med.name}
                        onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                        placeholder="e.g. Metformin"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label>Dosage</Label>
                        <Input
                          value={med.dosage}
                          onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Frequency</Label>
                        <Select
                          value={med.frequency}
                          onValueChange={(v) => updateMedicationFrequency(med.id, v)}
                        >
                          <SelectTrigger className="w-full">
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
                    </div>
                    {/* Time pickers — number driven by frequency */}
                    {(() => {
                      const labels = timePickerLabels(med.frequency)
                      if (labels.length === 0) return null
                      return (
                        <div className={`grid gap-2 ${labels.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {labels.map((label, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <Label>{label}</Label>
                              <Input
                                type="time"
                                value={med.time_of_day[idx] ?? '08:00'}
                                onChange={(e) => updateMedicationTime(med.id, idx, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    <div className="space-y-1.5">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={med.startDate}
                        onChange={(e) => updateMedication(med.id, 'startDate', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={addMedication}
                >
                  <PlusIcon className="size-4 mr-2" />
                  Add Medication
                </Button>
              </div>

              {saveError && (
                <p className="text-xs text-destructive">{saveError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={goBack} disabled={saving}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Visit'}
                </Button>
              </div>
            </div>
          )}

          {/* ─── SUCCESS STATE ────────────────────────────────────────── */}
          {step === 'success' && saveResult && (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div className="size-16 rounded-full bg-teal-50 flex items-center justify-center">
                <CheckCircleIcon className="size-8 text-teal-600" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">Visit logged!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {[
                    '1 visit',
                    saveResult.conditionCreated ? '1 condition' : null,
                    saveResult.documentSaved ? '1 document' : null,
                    saveResult.medicationCount > 0
                      ? `${saveResult.medicationCount} medication${saveResult.medicationCount > 1 ? 's' : ''}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  {' '}saved
                </p>
              </div>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  handleOpenChange(false)
                  onSuccess()
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>

        {/* Bottom safe area spacer for mobile */}
        <div className="h-4" />
      </SheetContent>
    </Sheet>
  )
}
