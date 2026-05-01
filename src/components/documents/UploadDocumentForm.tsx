'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { saveDocumentAction } from '@/app/(dashboard)/documents/actions'
import type { DocumentType } from '@/types/database'
import { Upload, X, FileText, FileImage, AlertCircle, Sparkles, ChevronDown } from 'lucide-react'

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
}

function mimeToExt(mime: string): string {
  return MIME_TO_EXT[mime] ?? mime
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  chronic: 'Chronic',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'report', label: 'Lab Report' },
  { value: 'scan', label: 'Scan / Imaging' },
  { value: 'vaccination', label: 'Vaccination Record' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE_BYTES = 10 * 1024 * 1024

type Member = { id: string; full_name: string }
type ConditionOption = {
  id: string
  name: string
  status: string
  diagnosed_on: string | null
}

export function UploadDocumentForm({
  members,
  familyGroupId,
}: {
  members: Member[]
  familyGroupId: string
}) {
  const router = useRouter()
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [docType, setDocType] = useState<DocumentType>('report')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [doctorName, setDoctorName] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [conditionId, setConditionId] = useState('general')
  const [conditions, setConditions] = useState<ConditionOption[]>([])
  const [loadingConditions, setLoadingConditions] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [visitDetailsOpen, setVisitDetailsOpen] = useState(false)

  async function loadConditions(memberId: string) {
    setLoadingConditions(true)
    setConditionId('general')
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('medical_conditions')
        .select('id, custom_name, status, diagnosed_on, is_pinned, icd10_conditions(name, common_name)')
        .eq('family_member_id', memberId)
        .is('deleted_at', null)
        .order('is_pinned', { ascending: false })
        .order('diagnosed_on', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      const opts: ConditionOption[] = (data || []).map((c: any) => {
        const ic = c.icd10_conditions as { name: string; common_name: string | null } | null
        return {
          id: c.id,
          name: ic?.common_name ?? ic?.name ?? c.custom_name ?? 'Unknown',
          status: c.status,
          diagnosed_on: c.diagnosed_on,
        }
      })
      setConditions(opts)
    } finally {
      setLoadingConditions(false)
    }
  }

  function handleMemberChange(memberId: string) {
    setSelectedMemberId(memberId)
    loadConditions(memberId)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const f = e.target.files?.[0]
    if (!f) return
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError('Only PDF, JPG, JPEG, and PNG files are allowed.')
      return
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFileError('File size must be 10 MB or less.')
      return
    }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  function removeFile() {
    setFile(null)
    setFileError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedMemberId) { setError('Please select a family member.'); return }
    if (!file) { setError('Please select a file to upload.'); return }
    if (!title.trim()) { setError('Document title is required.'); return }
    if (title.trim().length > 100) { setError('Title must be 100 characters or less.'); return }

    setSubmitting(true)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      const filePath = `${familyGroupId}/${selectedMemberId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`

      const { error: uploadError } = await supabase.storage
        .from('familycare-docs')
        .upload(filePath, file, { upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      setUploadProgress(90)

      await saveDocumentAction({
        familyMemberId: selectedMemberId,
        documentType: docType,
        title: title.trim(),
        fileUrl: filePath,
        fileType: mimeToExt(file.type),
        fileSizeKb: Math.round(file.size / 1024),
        doctorName: doctorName.trim() || undefined,
        hospitalName: hospitalName.trim() || undefined,
        documentDate: documentDate || undefined,
        notes: notes.trim() || undefined,
        medicalConditionId: conditionId !== 'general' ? conditionId : undefined,
      })

      setUploadProgress(100)
      router.push('/documents')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Please try again.')
      setUploadProgress(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Section 1: Who & What ── */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Family Member *</Label>
          <Select value={selectedMemberId} onValueChange={handleMemberChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Document Type *</Label>
          <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Document Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Blood Test Report — Jan 2025"
            maxLength={100}
          />
          {title.length > 80 && (
            <p className="text-xs text-muted-foreground">{title.length}/100</p>
          )}
        </div>
      </div>

      <hr className="border-border" />

      {/* ── Section 2: The File ── */}
      <div className="space-y-1.5">
        <Label>File *</Label>
        {file ? (
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/40">
            {file.type.startsWith('image/') ? (
              <FileImage className="size-5 text-muted-foreground shrink-0" />
            ) : (
              <FileText className="size-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={removeFile} className="shrink-0">
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/40 transition-colors">
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground text-center">
              Click to select a file
              <br />
              <span className="text-xs">PDF, JPG, PNG · Max 10 MB</span>
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        )}
        {fileError && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3" /> {fileError}
          </p>
        )}

        {/* AI extraction entry point — functional in Phase 2 */}
        {file && !fileError && (
          <button
            type="button"
            disabled
            title="Coming soon in Phase 2"
            className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 opacity-70 cursor-not-allowed w-full"
          >
            <Sparkles className="size-3.5 shrink-0" />
            <span className="font-medium">Extract details from document</span>
            <span className="ml-auto text-amber-500 font-normal">Coming in Phase 2</span>
          </button>
        )}
      </div>

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : 'Saving…'}
          </p>
        </div>
      )}

      <hr className="border-border" />

      {/* ── Section 3: Visit Details (collapsed by default) ── */}
      <div>
        <button
          type="button"
          onClick={() => setVisitDetailsOpen((p) => !p)}
          className="flex items-center justify-between w-full py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Add visit details <span className="font-normal">(optional)</span></span>
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${visitDetailsOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {visitDetailsOpen && (
          <div className="mt-4 space-y-4">
            {/* Link to condition */}
            {selectedMemberId && (
              <div className="space-y-1.5">
                <Label>Link to Medical Condition</Label>
                <Select value={conditionId} onValueChange={setConditionId} disabled={loadingConditions}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingConditions ? 'Loading…' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Not linked to a condition (General)</SelectItem>
                    {conditions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.status ? ` · ${STATUS_LABELS[c.status] ?? c.status}` : ''}
                        {c.diagnosed_on ? ` · ${formatDate(c.diagnosed_on)}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {conditionId !== 'general' && (
                  <p className="text-xs text-muted-foreground">
                    Linking a condition enables second opinion matching in Phase 2.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="document_date">Document Date</Label>
                <Input
                  id="document_date"
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doctor_name">Doctor Name</Label>
                <Input
                  id="doctor_name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. Sharma"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hospital_name">Hospital / Clinic</Label>
              <Input
                id="hospital_name"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Apollo Hospitals, Mumbai"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes…"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Uploading…' : 'Upload Document'}
      </Button>
    </form>
  )
}
