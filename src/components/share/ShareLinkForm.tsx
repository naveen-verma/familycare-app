'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserProfile } from '@/lib/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LinkIcon,
  CopyIcon,
  CheckIcon,
  MessageCircleIcon,
  ClockIcon,
  HistoryIcon,
  ShareIcon,
  ActivityIcon,
} from 'lucide-react'

type Props = {
  memberId: string
  memberName: string
}

type Condition = {
  id: string
  custom_name: string | null
  status: string
  diagnosed_on: string | null
  is_pinned: boolean
  icd10_conditions: { common_name: string | null } | null
}

type GeneratedLink = {
  url: string
  expiresAt: string
  selectedConditionIds: string[]
  includeDocuments: boolean
  includeTimeline: boolean
  doctorName: string
  doctorMobile: string
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  chronic: 'bg-orange-100 text-orange-700 border-orange-200',
  monitoring: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-gray-100 text-gray-600 border-gray-200',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatExpiry(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ShareLinkForm({ memberId, memberName }: Props) {
  const [doctorName, setDoctorName] = useState('')
  const [doctorMobile, setDoctorMobile] = useState('')
  const [includeDocuments, setIncludeDocuments] = useState(false)
  const [includeTimeline, setIncludeTimeline] = useState(false)
  const [validFor, setValidFor] = useState('24')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null)
  const [copied, setCopied] = useState(false)

  // Conditions state
  const [conditions, setConditions] = useState<Condition[]>([])
  const [loadingConditions, setLoadingConditions] = useState(true)
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([])

  useEffect(() => {
    async function fetchConditions() {
      setLoadingConditions(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('medical_conditions')
        .select(`
          id, custom_name, status, diagnosed_on, is_pinned,
          icd10_conditions (common_name)
        `)
        .eq('family_member_id', memberId)
        .is('deleted_at', null)
        .order('is_pinned', { ascending: false })
        .order('diagnosed_on', { ascending: false })
      setConditions((data as unknown as Condition[]) ?? [])
      setLoadingConditions(false)
    }
    fetchConditions()
  }, [memberId])

  function toggleCondition(id: string) {
    setSelectedConditionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleAllConditions() {
    if (selectedConditionIds.length === conditions.length) {
      setSelectedConditionIds([])
    } else {
      setSelectedConditionIds(conditions.map((c) => c.id))
    }
  }

  async function handleGenerate() {
    if (selectedConditionIds.length === 0) {
      setError('Please select at least one medical condition to share.')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const supabase = createClient()
      const profile = await getCurrentUserProfile()
      if (!profile) throw new Error('Could not load your profile. Please refresh and try again.')

      const userId: string = profile.user?.id ?? profile.id
      if (!userId) throw new Error('Could not resolve user ID. Please refresh and try again.')

      const token = crypto.randomUUID()
      const hours = parseInt(validFor, 10)
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

      const cleanMobile = doctorMobile.replace(/\D/g, '').slice(-10)

      const { error: insertError } = await supabase.from('share_links').insert({
        family_member_id: memberId,
        created_by: userId,
        token,
        expires_at: expiresAt,
        is_active: true,
        recipient_mobile: cleanMobile || null,
        recipient_name: doctorName.trim() || null,
        doctor_name: doctorName.trim() || null,
        // Legacy flags kept for backward compat — always false in new mode
        include_conditions: false,
        include_medications: false,
        include_documents: includeDocuments,
        include_timeline: includeTimeline,
        selected_condition_ids: selectedConditionIds,
        view_count: 0,
        open_count: 0,
      })

      if (insertError) throw new Error(insertError.message)

      const shareUrl = `${window.location.origin}/view/${token}`
      setGeneratedLink({
        url: shareUrl,
        expiresAt,
        selectedConditionIds,
        includeDocuments,
        includeTimeline,
        doctorName: doctorName.trim(),
        doctorMobile: cleanMobile,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    if (!generatedLink) return
    const hours = parseInt(validFor, 10)
    const durationLabel = hours === 24 ? '24 hours' : hours === 48 ? '48 hours' : '7 days'
    const docLabel = generatedLink.doctorName ? `Dr. ${generatedLink.doctorName}` : 'Doctor'
    const condCount = generatedLink.selectedConditionIds.length
    const message = encodeURIComponent(
      `${docLabel}, ${memberName} has shared their medical summary (${condCount} condition${condCount !== 1 ? 's' : ''}) with you.\n\nView here: ${generatedLink.url}\n\nValid for ${durationLabel}. Shared via FamilyCare.`
    )
    const waUrl = `https://wa.me/91${generatedLink.doctorMobile}?text=${message}`
    window.open(waUrl, '_blank')
  }

  // ---- Generated link view ----

  if (generatedLink) {
    const selectedNames = conditions
      .filter((c) => generatedLink.selectedConditionIds.includes(c.id))
      .map((c) => c.icd10_conditions?.common_name ?? c.custom_name ?? 'Unknown')

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckIcon className="size-4 shrink-0" />
          <span className="text-sm font-medium">Share link generated successfully</span>
        </div>

        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* URL row */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Share link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 rounded-md border bg-muted px-3 py-2">
                  <p className="text-xs font-mono truncate text-muted-foreground">
                    {generatedLink.url}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? (
                    <>
                      <CheckIcon className="size-3.5 mr-1.5 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3.5 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <ClockIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="font-medium text-xs">{formatExpiry(generatedLink.expiresAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ActivityIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Conditions shared</p>
                  <p className="text-xs">{selectedNames.join(', ') || 'None'}</p>
                </div>
              </div>
            </div>

            {/* WhatsApp button */}
            {generatedLink.doctorMobile && (
              <Button
                variant="outline"
                className="w-full border-green-300 text-green-700 hover:bg-green-50"
                onClick={handleWhatsApp}
              >
                <MessageCircleIcon className="size-4 mr-2" />
                Send via WhatsApp to +91 {generatedLink.doctorMobile}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setGeneratedLink(null)}
          >
            <ShareIcon className="size-4 mr-2" />
            Generate another link
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/share/history">
              <HistoryIcon className="size-4 mr-2" />
              View all share links
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // ---- Form ----

  const allSelected =
    conditions.length > 0 && selectedConditionIds.length === conditions.length

  return (
    <div className="space-y-5">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Member (read-only) */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Family Member</label>
        <div className="rounded-md border bg-muted px-3 py-2 flex items-center gap-2">
          <span className="text-sm font-medium">{memberName}</span>
          <Badge variant="outline" className="text-xs">Pre-filled</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          To share a different member, go to their profile.
        </p>
      </div>

      {/* Doctor name */}
      <div>
        <label className="text-sm font-medium block mb-1.5">
          Doctor / Recipient Name{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          placeholder="Dr. Sharma"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label className="text-sm font-medium block mb-1.5">
          Doctor&apos;s WhatsApp Number{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
            +91
          </span>
          <input
            type="tel"
            value={doctorMobile}
            onChange={(e) => setDoctorMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="98765 43210"
            maxLength={10}
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          If entered, you&apos;ll get a one-tap WhatsApp send button after generating.
        </p>
      </div>

      {/* Select Medical Conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-sm font-medium">Select Medical Conditions to Share</label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only selected conditions and their related medications and documents will be shared
            </p>
          </div>
          {conditions.length > 0 && (
            <button
              type="button"
              onClick={toggleAllConditions}
              className="text-xs text-indigo-600 hover:underline shrink-0 ml-3"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>

        {loadingConditions ? (
          <div className="rounded-lg border px-3 py-4 text-sm text-muted-foreground text-center">
            Loading conditions…
          </div>
        ) : conditions.length === 0 ? (
          <div className="rounded-lg border px-3 py-4 text-sm text-muted-foreground text-center">
            No medical conditions recorded for this member
          </div>
        ) : (
          <div className="space-y-2">
            {conditions.map((condition) => {
              const name = condition.icd10_conditions?.common_name ?? condition.custom_name ?? 'Unknown condition'
              const isSelected = selectedConditionIds.includes(condition.id)
              return (
                <label
                  key={condition.id}
                  className={`flex items-start gap-3 cursor-pointer rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors ${
                    isSelected ? 'border-indigo-300 bg-indigo-50/50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCondition(condition.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{name}</span>
                      <span
                        className={`inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium capitalize ${
                          STATUS_BADGE[condition.status] ?? STATUS_BADGE.active
                        }`}
                      >
                        {condition.status}
                      </span>
                    </div>
                    {condition.diagnosed_on && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Diagnosed {formatDate(condition.diagnosed_on)}
                      </p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Additional toggles */}
      <div>
        <label className="text-sm font-medium block mb-2">Additional Options</label>
        <div className="space-y-2.5">
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={includeTimeline}
              onChange={(e) => setIncludeTimeline(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-indigo-600"
            />
            <div>
              <p className="text-sm font-medium leading-none">Include Health Timeline</p>
              <p className="text-xs text-muted-foreground mt-0.5">Last 6 months of health events</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={includeDocuments}
              onChange={(e) => setIncludeDocuments(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-indigo-600"
            />
            <div>
              <p className="text-sm font-medium leading-none">Include Document Files</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow doctor to view uploaded document files
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Documents linked to selected conditions will always be listed. This toggle allows the actual files to be opened.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Valid for */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Link Valid For</label>
        <Select value={validFor} onValueChange={setValidFor}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24">24 hours</SelectItem>
            <SelectItem value="48">48 hours</SelectItem>
            <SelectItem value="168">7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Generate button */}
      <Button onClick={handleGenerate} disabled={generating} className="w-full">
        {generating ? (
          'Generating…'
        ) : (
          <>
            <LinkIcon className="size-4 mr-2" />
            Generate Share Link
            {selectedConditionIds.length > 0 && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                {selectedConditionIds.length}
              </span>
            )}
          </>
        )}
      </Button>

      <p className="text-center">
        <Link href="/share/history" className="text-xs text-muted-foreground hover:underline">
          View previous share links
        </Link>
      </p>
    </div>
  )
}
