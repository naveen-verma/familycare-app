'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  FileImage,
  FolderOpen,
  ChevronDown,
  Upload,
  Plus,
  Calendar,
  Stethoscope,
  Building2,
  Zap,
} from 'lucide-react'
import type { VaultMember, VaultDocument, VaultCondition } from '@/lib/vault-types'
import { DOC_TYPE_ORDER, DOC_TYPE_LABELS } from '@/lib/vault-types'
import type { DocumentType } from '@/types/database'

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
  const isImage = doc.file_type === 'jpg' || doc.file_type === 'jpeg' || doc.file_type === 'png'
  const href = `/documents/${memberId}/${conditionId}`

  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors group"
    >
      <div className="mt-0.5 size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {isImage ? (
          <FileImage className="size-4 text-muted-foreground" />
        ) : (
          <FileText className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {doc.title}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {doc.document_date && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {formatDate(doc.document_date)}
            </span>
          )}
          {doc.doctor_name && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Stethoscope className="size-3" />
              {doc.doctor_name}
            </span>
          )}
          {doc.hospital_name && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="size-3" />
              {doc.hospital_name}
            </span>
          )}
        </div>
      </div>
      {doc.phase2_ready && (
        <span className="shrink-0 flex items-center gap-0.5 text-xs text-amber-600 mt-0.5">
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
}: {
  condition: VaultCondition
  memberId: string
}) {
  const [open, setOpen] = useState(false)
  const totalDocs = condition.documents.length

  const docsByType = DOC_TYPE_ORDER.reduce<Record<DocumentType, VaultDocument[]>>(
    (acc, type) => {
      acc[type] = condition.documents.filter((d) => d.document_type === type)
      return acc
    },
    {} as Record<DocumentType, VaultDocument[]>
  )

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
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
          </div>
          <div className="flex items-center gap-3 mt-0.5">
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
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t bg-background px-1 py-2">
          {totalDocs === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground">No documents for this condition</p>
              <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs">
                <Link href="/documents/upload">Upload</Link>
              </Button>
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
}: {
  docs: VaultDocument[]
  memberId: string
}) {
  const [open, setOpen] = useState(false)

  const docsByType = DOC_TYPE_ORDER.reduce<Record<DocumentType, VaultDocument[]>>(
    (acc, type) => {
      acc[type] = docs.filter((d) => d.document_type === type)
      return acc
    },
    {} as Record<DocumentType, VaultDocument[]>
  )

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-muted-foreground">General Documents</span>
          <div className="mt-0.5">
            <span className="text-xs text-muted-foreground">
              {docs.length} {docs.length === 1 ? 'document' : 'documents'} · Not linked to a condition
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

// ---- Member section (collapsible) ----

function MemberSection({
  member,
  open,
  onToggle,
}: {
  member: VaultMember
  open: boolean
  onToggle: () => void
}) {
  const age = calculateAge(member.date_of_birth)
  const avatarColor = avatarColors[member.relation ?? 'other'] ?? avatarColors.other
  const initials = getInitials(member.full_name)
  const totalDocs =
    member.conditions.reduce((sum, c) => sum + c.documents.length, 0) +
    member.general_documents.length
  const hasContent =
    member.conditions.length > 0 || member.general_documents.length > 0

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Member header */}
      <button
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
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/documents/upload">
                  <Upload className="size-3.5 mr-1.5" />
                  Upload document
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {member.conditions.map((condition) => (
                <ConditionGroup
                  key={condition.id}
                  condition={condition}
                  memberId={member.id}
                />
              ))}
              {member.general_documents.length > 0 && (
                <GeneralDocsGroup docs={member.general_documents} memberId={member.id} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Main VaultView ----

export function VaultView({ members }: { members: VaultMember[] }) {
  const [openMemberIds, setOpenMemberIds] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  )
  const [filterMemberId, setFilterMemberId] = useState('all')

  function handleFilterChange(value: string) {
    setFilterMemberId(value)
    if (value === 'all') {
      setOpenMemberIds(new Set(members.map((m) => m.id)))
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
        <Button asChild size="sm">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Member filter */}
      <div className="mb-4">
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

      {/* Member sections */}
      <div className="space-y-3">
        {visibleMembers.map((member) => (
          <MemberSection
            key={member.id}
            member={member}
            open={openMemberIds.has(member.id)}
            onToggle={() => toggleMember(member.id)}
          />
        ))}
      </div>

      {/* FAB upload button */}
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
