'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserProfile } from '@/lib/user'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClockIcon, EyeIcon, UserIcon, XCircleIcon } from 'lucide-react'

type ShareLinkRow = {
  id: string
  token: string
  doctor_name: string | null
  created_at: string
  expires_at: string
  is_active: boolean
  view_count: number
  family_members: { id: string; full_name: string } | null
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function linkStatus(link: ShareLinkRow): 'active' | 'expired' | 'revoked' {
  if (!link.is_active) return 'revoked'
  if (new Date(link.expires_at) < new Date()) return 'expired'
  return 'active'
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  revoked: 'bg-red-100 text-red-700 border-red-200',
}

export function ShareLinkHistory() {
  const [links, setLinks] = useState<ShareLinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    loadLinks()
  }, [])

  async function loadLinks() {
    setLoading(true)
    try {
      const supabase = createClient()
      const profile = await getCurrentUserProfile()
      if (!profile) return

      const userId: string = profile.user?.id ?? profile.id

      const { data, error } = await supabase
        .from('share_links')
        .select(`
          id, token, doctor_name, created_at, expires_at,
          is_active, view_count,
          family_members(id, full_name)
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setLinks(data as unknown as ShareLinkRow[])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(link: ShareLinkRow) {
    const memberName = link.family_members?.full_name ?? 'this member'
    const confirmed = window.confirm(
      `Revoke this link? ${memberName}'s doctor will no longer be able to view their summary.`
    )
    if (!confirmed) return
    setRevoking(link.id)
    const supabase = createClient()
    await supabase.from('share_links').update({ is_active: false }).eq('id', link.id)
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, is_active: false } : l))
    )
    setRevoking(null)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">No share links created yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Go to a member&apos;s profile to generate a secure link for a doctor.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {links.map((link) => {
        const status = linkStatus(link)
        return (
          <Card key={link.id} size="sm">
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Member + doctor row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {link.family_members?.full_name ?? 'Unknown member'}
                    </span>
                    {link.doctor_name && (
                      <>
                        <span className="text-muted-foreground text-sm">→</span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <UserIcon className="size-3" />
                          {link.doctor_name}
                        </span>
                      </>
                    )}
                    <span
                      className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize ${STATUS_BADGE[status]}`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Dates + views */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      Created {formatDate(link.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      Expires {formatDate(link.expires_at)}
                    </span>
                    {link.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <EyeIcon className="size-3" />
                        {link.view_count} view{link.view_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Revoke */}
                {status === 'active' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={revoking === link.id}
                    onClick={() => handleRevoke(link)}
                  >
                    <XCircleIcon className="size-4" />
                    <span className="sr-only">Revoke</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <p className="text-center pt-2">
        <Link href="/members" className="text-xs text-muted-foreground hover:underline">
          Go to Family Members to share again
        </Link>
      </p>
    </div>
  )
}
