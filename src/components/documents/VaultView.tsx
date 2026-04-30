'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  FileImage,
  FolderOpen,
  ChevronDown,
  Plus,
  Zap,
  Pin,
  AlertTriangle,
} from 'lucide-react'
import type { VaultMember, VaultDocument, VaultCondition } from '@/lib/vault-types'
import { DOC_TYPE_ORDER, DOC_TYPE_LABELS } from '@/lib/vault-types'
import type { DocumentType } from '@/types/database'

type PinToggleFn = (conditionId: string, currentlyPinned: boolean) => Promise<void>

// ---- Helpers ----

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const avatarColors: Record<string, string> = {
  self: 'bg-blue-100 text-blue-700',
  spouse: 'bg-pink-100 text-pink-700',
  child: 'bg-green-100 text-green-700',
  parent: 'bg-purple-100 text-purple-700',
  sibling: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

const statusStyles: Record<string, string> = {
  active: 'bg-red-100 text-red-700 border-red-200',
  chronic: 'bg-orange-100 text-orange-700 border-orange-200',
  monitoring: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
}

// ---- Filter chips config ----

const filterChips: { label: string; value: DocumentType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Prescriptions', value: 'prescription' },
  { label: 'Reports', value: 'report' },
  { label: 'Scans', value: 'scan' },
  { label: 'Other', value: 'other' },
]

// ---- File type icon ----

function FileTypeIcon({ fileType }: { fileType: string | null | undefined }) {
  const isImage = fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png'
  const isPdf = fileType === 'pdf'
  const bgClass = isPdf ? 'bg-red-100' : isImage ? 'bg-blue-100' : 'bg-gray-100'
  const iconClass = isPdf ? 'text-red-600' : isImage ? 'text-blue-600' : 'text-gray-500'
  const Icon = isImage ? FileImage : FileText
  return (
    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
      <Icon className={`size-5 ${iconClass}`} />
    </div>
  )
}

// ---- Document row ----

function DocumentRow({
  doc,
  memberId,
  conditionId,
}: {
  doc: VaultDocument
  memberId: string
  conditionId: string
}) {
  const href = `/documents/${memberId}/${conditionId}`

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[56px] hover:bg-muted/60 transition-colors group"
    >
      <FileTypeIcon fileType={doc.file_type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {doc.title}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {[
            DOC_TYPE_LABELS[doc.document_type as DocumentType] ?? doc.document_type,
            doc.doctor_name,
            doc.document_date ? formatDate(doc.document_date) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      {doc.phase2_ready && (
        <span className="shrink-0 flex items-center gap-0.5 text-xs text-amber-600">
          <Zap className="size-3" />
          <span className="hidden sm:inline">Phase 2</span>
        </span>
      )}
    </Link>
  )
}

// ---- Document type sub-group ----

function DocTypeGroup({
  type,
  docs,
  memberId,
  conditionId,
}: {
  type: DocumentType
  docs: VaultDocument[]
  memberId: string
  conditionId: string
}) {
  if (!docs.length) return null

  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-1">
        {DOC_TYPE_LABELS[type]}
      </p>
      <div className="space-y-0.5">
        {docs.map((doc) => (
          <DocumentRow key={doc.id} doc={doc} memberId={memberId} conditionId={conditionId} />
        ))}
      </div>
    </div>
  )
}

// ---- Condition group (collapsible) ----

function ConditionGroup({
  condition,
  memberId,
  onPinToggle,
  docTypeFilter,
}: {
  condition: VaultCondition
  memberId: string
  onPinToggle: PinToggleFn
  docTypeFilter: DocumentType | 'all'
}) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(condition.is_pinned)
  const [pinning, setPinning] = useState(false)

  const visibleDocs =
    docTypeFilter === 'all'
      ? condition.documents
      : condition.documents.filter((d) => d.document_type === docTypeFilter)

  const totalDocs = visibleDocs.length

  if (docTypeFilter !== 'all' && totalDocs === 0) return null

  const docsByType = DOC_TYPE_ORDER.reduce<Record<DocumentType, VaultDocument[]>>(
    (acc, type) => {
      acc[type] = visibleDocs.filter((d) => d.document_type === type)
      return acc
    },
    {} as Record<DocumentType, VaultDocument[]>
  )

  async function handlePin(e: React.MouseEvent) {
    e.stopPropagation()
    if (pinning) return
    setPinning(true)
    const prev = pinned
    setPinned(!prev)
    try {
      await onPinToggle(condition.id, prev)
    } catch {
      setPinned(prev)
    } finally {
      setPinning(false)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header row — div with two interactive zones to avoid nested <button> */}
      <div className="flex items-center gap-1 hover:bg-muted/40 transition-colors">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex-1 flex items-start gap-3 px-4 py-3 text-left min-w-0"
          aria-expanded={open}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{condition.name}</span>
              <span
                className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize ${statusStyles[condition.status] ?? statusStyles.monitoring}`}
              >
                {condition.status}
              </span>
              {condition.is_critical && (
                <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-medium">
                  <AlertTriangle className="size-3" />
                  Critical
                </span>
              )}
              {pinned && (
                <span className="inline-flex h-5 items-center rounded-full bg-indigo-100 text-indigo-700 px-2 text-xs font-medium">
                  Pinned
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {condition.category && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {condition.category}
                </span>
              )}
              {condition.diagnosed_on && (
                <span className="text-xs text-muted-foreground">
                  Diagnosed {formatDate(condition.diagnosed_on)}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {totalDocs} {totalDocs === 1 ? 'document' : 'documents'}
              </span>
            </div>
          </div>
          <ChevronDown
            className={`size-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Pin button — sits outside the accordion button */}
        <button
          type="button"
          onClick={handlePin}
          disabled={pinning}
          aria-label={pinned ? 'Unpin condition' : 'Pin condition to top'}
          className="shrink-0 p-2 mr-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Pin
            className={`size-4 transition-colors ${pinned ? 'fill-indigo-500 text-indigo-500' : 'text-muted-foreground'}`}
          />
        </button>
      </div>

      {open && (
        <div className="border-t bg-background px-1 py-2">
          {totalDocs === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground">No documents for this condition</p>
            </div>
          ) : (
            DOC_TYPE_ORDER.map((type) => (
              <DocTypeGroup
                key={type}
                type={type}
                docs={docsByType[type]}
                memberId={memberId}
                conditionId={condition.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ---- General documents group ----

function GeneralDocsGroup({
  docs,
  memberId,
  docTypeFilter,
}: {
  docs: VaultDocument[]
  memberId: string
  docTypeFilter: DocumentType | 'all'
}) {
  const [open, setOpen] = useState(false)

  const visibleDocs =
    docTypeFilter === 'all' ? docs : docs.filter((d) => d.document_type === docTypeFilter)

  if (docTypeFilter !== 'all' && visibleDocs.length === 0) return null

  const docsByType = DOC_TYPE_ORDER.reduce<Record<DocumentType, VaultDocument[]>>(
    (acc, type) => {
      acc[type] = visibleDocs.filter((d) => d.document_type === type)
      return acc
    },
    {} as Record<DocumentType, VaultDocument[]>
  )

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-muted-foreground">General Documents</span>
          <div className="mt-0.5">
            <span className="text-xs text-muted-foreground">
              {docs.length} {docs.length === 1 ? 'document' : 'documents'} · Not linked to a
              condition
            </span>
          </div>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t bg-background px-1 py-2">
          {DOC_TYPE_ORDER.map((type) => (
            <DocTypeGroup
              key={type}
              type={type}
              docs={docsByType[type]}
              memberId={memberId}
              conditionId="general"
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Member section (accordion) ----

function MemberSection({
  member,
  open,
  onToggle,
  onPinToggle,
  docTypeFilter,
}: {
  member: VaultMember
  open: boolean
  onToggle: () => void
  onPinToggle: PinToggleFn
  docTypeFilter: DocumentType | 'all'
}) {
  const age = calculateAge(member.date_of_birth)
  const avatarColor = avatarColors[member.relation ?? 'other'] ?? avatarColors.other
  const initials = getInitials(member.full_name)

  const visibleConditions =
    docTypeFilter === 'all'
      ? member.conditions
      : member.conditions.filter((c) =>
          c.documents.some((d) => d.document_type === docTypeFilter)
        )

  const visibleGeneralDocs =
    docTypeFilter === 'all'
      ? member.general_documents
      : member.general_documents.filter((d) => d.document_type === docTypeFilter)

  const totalDocs =
    member.conditions.reduce((sum, c) => sum + c.documents.length, 0) +
    member.general_documents.length

  const hasContent =
    member.conditions.length > 0 || member.general_documents.length > 0

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Member header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <div
          className={`size-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${avatarColor}`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{member.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {[
              age !== null ? `${age} yrs` : null,
              member.blood_group,
              member.relation
                ? member.relation === 'self'
                  ? 'You'
                  : member.relation
                : null,
              `${totalDocs} ${totalDocs === 1 ? 'doc' : 'docs'}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t px-4 py-4 space-y-3 bg-muted/20">
          {!hasContent ? (
            <div className="text-center py-8">
              <FolderOpen className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No medical records yet</p>
            </div>
          ) : (
            <>
              {visibleConditions.map((condition) => (
                <ConditionGroup
                  key={condition.id}
                  condition={condition}
                  memberId={member.id}
                  onPinToggle={onPinToggle}
                  docTypeFilter={docTypeFilter}
                />
              ))}
              {visibleGeneralDocs.length > 0 && (
                <GeneralDocsGroup
                  docs={visibleGeneralDocs}
                  memberId={member.id}
                  docTypeFilter={docTypeFilter}
                />
              )}
              {docTypeFilter !== 'all' &&
                visibleConditions.length === 0 &&
                visibleGeneralDocs.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="size-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No {DOC_TYPE_LABELS[docTypeFilter as DocumentType]?.toLowerCase() ?? 'documents'} for this member
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Main VaultView ----

export function VaultView({
  members,
  onPinToggle,
}: {
  members: VaultMember[]
  onPinToggle: PinToggleFn
}) {
  const [openMemberIds, setOpenMemberIds] = useState<Set<string>>(
    () => (members.length > 0 ? new Set([members[0].id]) : new Set())
  )
  const [filterMemberId, setFilterMemberId] = useState('all')
  const [docTypeFilter, setDocTypeFilter] = useState<DocumentType | 'all'>('all')

  function handleFilterChange(value: string) {
    setFilterMemberId(value)
    if (value === 'all') {
      setOpenMemberIds(new Set(members.length > 0 ? [members[0].id] : []))
    } else {
      setOpenMemberIds(new Set([value]))
    }
  }

  function toggleMember(id: string) {
    setOpenMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visibleMembers =
    filterMemberId === 'all'
      ? members
      : members.filter((m) => m.id === filterMemberId)

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpen className="size-12 text-muted-foreground mb-3" />
        <p className="font-medium text-sm">No family members yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Add family members to get started
        </p>
        <Link href="/dashboard" className="text-sm text-primary underline underline-offset-2">
          Go to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Member filter */}
      <div className="mb-3">
        <Select value={filterMemberId} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filterChips.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setDocTypeFilter(value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px] ${
              docTypeFilter === value
                ? 'bg-teal-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Member sections */}
      <div className="space-y-3">
        {visibleMembers.map((member) => (
          <MemberSection
            key={member.id}
            member={member}
            open={openMemberIds.has(member.id)}
            onToggle={() => toggleMember(member.id)}
            onPinToggle={onPinToggle}
            docTypeFilter={docTypeFilter}
          />
        ))}
      </div>

      {/* FAB */}
      <Link
        href="/documents/upload"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 size-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-40"
        aria-label="Upload document"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  )
}
