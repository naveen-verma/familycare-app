interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  step?: number
  totalSteps?: number
  showLogo?: boolean
}

export function AuthShell({
  title,
  subtitle,
  children,
  step,
  totalSteps,
  showLogo = true,
}: AuthShellProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--color-background-secondary)' }}
    >
      {/* Logo */}
      {showLogo && (
        <div className="flex items-center gap-2 mb-8">
          <div
            className="flex items-center justify-center rounded-lg font-bold text-white"
            style={{ width: 32, height: 32, background: '#1D9E75', fontSize: 11 }}
          >
            FC
          </div>
          <span
            className="font-medium"
            style={{ fontSize: 15, color: 'var(--color-text-primary)' }}
          >
            FamilyCare
          </span>
        </div>
      )}

      {/* Step indicator */}
      {step !== undefined && totalSteps !== undefined && (
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1 w-8 rounded-full transition-all"
              style={{ background: i < step ? '#0F6E56' : 'var(--color-border-tertiary)' }}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <div className="text-center mb-6">
        <h1
          className="font-medium"
          style={{ fontSize: 20, color: 'var(--color-text-primary)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-sm shadow-sm"
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: 24,
        }}
      >
        {children}
      </div>
    </div>
  )
}
