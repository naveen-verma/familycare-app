'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, Pill, Clock } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { LogoutButton } from '@/components/layout/LogoutButton'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Family', icon: Users },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/timeline', label: 'Timeline', icon: Clock },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-screen bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-2.5 p-4 border-b border-sidebar-border">
        <div className="size-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary-foreground">FC</span>
        </div>
        <span className="font-heading font-semibold text-sidebar-foreground">FamilyCare</span>
      </div>

      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-2">
        <Separator className="mb-2" />
        <LogoutButton variant="sidebar" />
      </div>
    </aside>
  )
}
