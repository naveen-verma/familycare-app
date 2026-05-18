import Link from 'next/link'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-secondary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10"
        style={{ background: 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg font-bold text-white"
              style={{ width: 28, height: 28, background: '#1D9E75', fontSize: 10 }}>
              FC
            </div>
            <span className="font-medium" style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
              FamilyCare
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="font-medium hover:opacity-70 transition-opacity"
            style={{ fontSize: 13, color: '#0F6E56' }}
          >
            ← Back to App
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer style={{ borderTop: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>© 2026 FamilyCare. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {['Terms', 'Privacy', 'Disclaimer'].map((label) => (
              <Link key={label} href={`/${label.toLowerCase()}`}
                className="hover:opacity-70 transition-opacity"
                style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
