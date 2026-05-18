'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  Pill,
  Clock,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const COLLAPSED_KEY = 'fc_sidebar_collapsed'
const BRAND = '#085041'
const BRAND_AVATAR = '#1D9E75'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, countKey: null       },
  { href: '/members',     label: 'Family',       icon: Users,           countKey: 'members'  },
  { href: '/documents',   label: 'Documents',    icon: FileText,        countKey: 'documents'},
  { href: '/medications', label: 'Medications',  icon: Pill,            countKey: 'meds'     },
  { href: '/timeline',    label: 'Timeline',     icon: Clock,           countKey: null       },
] as const

interface Counts { members: number; documents: number; meds: number }
interface Profile { initials: string; name: string }

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [counts, setCounts] = useState<Counts>({ members: 0, documents: 0, meds: 0 })
  const [profile, setProfile] = useState<Profile>({ initials: 'U', name: 'User' })

  // Restore collapse state from localStorage after mount
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(COLLAPSED_KEY)
    if (saved === 'true') setCollapsed(true)
  }, [])

  // Fetch sidebar counts + user profile
  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [membersRes, docsRes, medsRes, profileRes] = await Promise.all([
        supabase.from('family_members').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('documents').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('medications').select('id', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
        supabase.rpc('get_current_user_profile'),
      ])
      setCounts({
        members:   membersRes.count ?? 0,
        documents: docsRes.count ?? 0,
        meds:      medsRes.count ?? 0,
      })
      const p = profileRes.data as { full_name?: string } | null
      const name = p?.full_name?.trim() || 'User'
      setProfile({ initials: getInitials(name), name })
    }

    load()
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })
  }

  const countMap: Record<string, number> = {
    members:   counts.members,
    documents: counts.documents,
    meds:      counts.meds,
  }

  // Avoid hydration mismatch — render in expanded state until JS runs
  const isCollapsed = mounted && collapsed

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 relative z-20 overflow-visible"
      style={{
        backgroundColor: BRAND,
        width: isCollapsed ? 52 : 164,
        minHeight: '100dvh',
        transition: 'width 200ms ease',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center overflow-hidden shrink-0"
        style={{ padding: '18px 14px 14px', gap: 8 }}
      >
        <div
          className="flex items-center justify-center shrink-0 rounded-[6px] font-bold text-white"
          style={{ width: 26, height: 26, background: BRAND_AVATAR, fontSize: 10 }}
        >
          FC
        </div>
        <span
          className="text-white font-semibold whitespace-nowrap overflow-hidden"
          style={{
            fontSize: 13,
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 150ms ease',
            pointerEvents: isCollapsed ? 'none' : 'auto',
          }}
        >
          FamilyCare
        </span>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────── */}
      <nav className="flex flex-col flex-1 px-[8px]" style={{ gap: 2 }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon, countKey }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
          const count = countKey ? (countMap[countKey] ?? 0) : 0
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={cn(
                'flex items-center rounded-[7px] text-white/75 hover:text-white transition-colors overflow-hidden',
                isActive && 'text-white'
              )}
              style={{
                gap: 10,
                padding: '7px 8px',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
            >
              <Icon size={16} className="shrink-0" />
              <span
                className="flex-1 whitespace-nowrap text-[12px] font-medium overflow-hidden"
                style={{
                  opacity: isCollapsed ? 0 : 1,
                  transition: 'opacity 150ms ease',
                  pointerEvents: isCollapsed ? 'none' : 'auto',
                }}
              >
                {label}
              </span>
              {!isCollapsed && count > 0 && (
                <span
                  className="font-medium rounded-[10px] shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: 8,
                    padding: '1px 6px',
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Divider + Coming soon ─────────────────────────────────── */}
      <div
        style={{
          opacity: isCollapsed ? 0 : 1,
          transition: 'opacity 150ms ease',
          pointerEvents: isCollapsed ? 'none' : 'auto',
        }}
      >
        <div style={{ margin: '6px 8px', height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ padding: '0 12px 6px' }}>
          <p
            className="uppercase font-medium tracking-[0.08em]"
            style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}
          >
            Coming Soon
          </p>
          <div
            className="flex items-center rounded-[7px]"
            style={{ gap: 10, padding: '7px 8px', opacity: 0.35 }}
          >
            <Stethoscope size={16} className="text-white shrink-0" />
            <span className="text-[12px] text-white font-medium whitespace-nowrap">
              Second Opinion
            </span>
          </div>
        </div>
      </div>

      {/* ── User profile row ──────────────────────────────────────── */}
      <div
        className="flex items-center shrink-0 overflow-hidden"
        style={{
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
          padding: '10px 14px',
          gap: 8,
        }}
      >
        {/* Avatar */}
        <div
          className="flex items-center justify-center shrink-0 rounded-full text-white font-semibold"
          style={{ width: 26, height: 26, background: BRAND_AVATAR, fontSize: 9 }}
        >
          {profile.initials}
        </div>
        {/* Name + role */}
        <div
          className="flex-1 min-w-0 overflow-hidden"
          style={{
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 150ms ease',
            pointerEvents: isCollapsed ? 'none' : 'auto',
          }}
        >
          <p
            className="text-white truncate font-medium"
            style={{ fontSize: 10 }}
          >
            {profile.name}
          </p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>Admin</p>
        </div>
        {/* Settings icon */}
        <button
          className="shrink-0 hover:opacity-60 transition-opacity"
          title="Settings"
          style={{
            opacity: isCollapsed ? 0 : 0.3,
            transition: 'opacity 150ms ease',
            pointerEvents: isCollapsed ? 'none' : 'auto',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Settings size={13} color="white" />
        </button>
      </div>

      {/* ── Collapse toggle button ────────────────────────────────── */}
      <button
        onClick={toggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute hover:bg-gray-50 transition-colors"
        style={{
          right: 0,
          top: '50%',
          transform: 'translate(50%, -50%)',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'white',
          border: '0.5px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        {isCollapsed
          ? <ChevronRight size={11} color="#6B7280" />
          : <ChevronLeft  size={11} color="#6B7280" />
        }
      </button>
    </aside>
  )
}
