'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, Pill, LogOutIcon } from 'lucide-react'
import { LogoutButton } from '@/components/layout/LogoutButton'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/members', label: 'Family', icon: Users },
  { href: '/documents', label: 'Docs', icon: FileText },
  { href: '/medications', label: 'Meds', icon: Pill },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 border-t bg-background">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </Link>
        )
      })}
      <LogoutButton variant="mobile" />
    </nav>
  )
}
