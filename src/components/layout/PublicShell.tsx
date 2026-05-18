interface PublicShellProps {
  children: React.ReactNode
  showBranding?: boolean
  maxWidth?: string
}

export function PublicShell({
  children,
  showBranding = true,
  maxWidth = 'max-w-2xl',
}: PublicShellProps) {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-background-secondary)' }}
    >
      {/* Public header */}
      {showBranding && (
        <div
          style={{
            background: 'var(--color-background-primary)',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
            padding: '12px 16px',
          }}
        >
          <div className={`${maxWidth} mx-auto flex items-center gap-2`}>
            <div
              className="flex items-center justify-center rounded font-bold text-white"
              style={{ width: 24, height: 24, background: '#1D9E75', fontSize: 9 }}
            >
              FC
            </div>
            <span
              className="font-medium"
              style={{ fontSize: 13, color: 'var(--color-text-primary)' }}
            >
              FamilyCare
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`${maxWidth} mx-auto px-4 py-6`}>
        {children}
      </div>
    </div>
  )
}
