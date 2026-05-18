import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageShellProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  backHref?: string
  noPadding?: boolean
}

export function PageShell({ title, subtitle, action, children, backHref, noPadding }: PageShellProps) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'var(--color-background-secondary)' }}
    >
      {/* White top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 py-3"
        style={{
          background: 'var(--color-background-primary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ArrowLeft size={16} />
            </Link>
          )}
          <div>
            <h1
              className="font-medium leading-tight"
              style={{ fontSize: 13, color: 'var(--color-text-primary)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{subtitle}</p>
            )}
          </div>
        </div>

        {action && <div>{action}</div>}
      </div>

      {/* Page content */}
      <div className={noPadding ? '' : 'p-4 md:p-6'}>
        {children}
      </div>
    </div>
  )
}
