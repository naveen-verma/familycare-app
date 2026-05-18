'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/lib/auth'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { validateEmail, validateIndianMobile } from '@/lib/validation/inputs'

const USE_PHONE_AUTH = process.env.NEXT_PUBLIC_APP_ENV === 'production'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionExpired = searchParams.get('reason') === 'session_expired'
  const oauthError = searchParams.get('error') === 'oauth_error'

  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(oauthError ? 'Google sign-in failed. Please try again.' : '')
  const [fieldError, setFieldError] = useState('')

  const formatMobile = (val: string) => val.replace(/\D/g, '').slice(0, 10)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch {
      setError('Could not start Google sign-in. Please try again.')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldError('')

    if (USE_PHONE_AUTH) {
      const mErr = validateIndianMobile(value, true) ?? ''
      if (mErr) { setFieldError(mErr); return }
    } else {
      const eErr = validateEmail(value, true) ?? ''
      if (eErr) { setFieldError(eErr); return }
    }

    setLoading(true)
    try {
      const supabase = createClient()
      if (USE_PHONE_AUTH) {
        const { error } = await supabase.auth.signInWithOtp({ phone: `+91${value}` })
        if (error) { setError(error.message); return }
        sessionStorage.setItem('familycare_phone', `+91${value}`)
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: value.trim().toLowerCase(),
          options: { shouldCreateUser: true, emailRedirectTo: undefined },
        })
        if (error) { setError(error.message); return }
        sessionStorage.setItem('familycare_email', value.trim().toLowerCase())
      }
      router.push('/verify')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4, display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 8, padding: '9px 12px', fontSize: 13,
    color: 'var(--color-text-primary)', outline: 'none',
    background: 'var(--color-background-primary)',
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your family's health"
    >
      <div className="space-y-4">
        {sessionExpired && (
          <div className="text-xs px-3 py-2 rounded-lg"
            style={{ background: '#FAEEDA', color: '#633806' }}>
            Your session expired due to inactivity. Please log in again.
          </div>
        )}

        {/* Google SSO */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-2.5 rounded-[20px] py-2.5 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-primary)',
            fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)',
          }}
        >
          {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--color-border-tertiary)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--color-border-tertiary)' }} />
        </div>

        {/* OTP form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={labelStyle}>{USE_PHONE_AUTH ? 'Mobile number' : 'Email address'}</label>
            {USE_PHONE_AUTH ? (
              <div className="flex items-center rounded-[8px] overflow-hidden"
                style={{ border: '0.5px solid var(--color-border-tertiary)' }}>
                <span className="px-3 shrink-0"
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)', borderRight: '0.5px solid var(--color-border-tertiary)', paddingBlock: 9 }}>
                  +91
                </span>
                <input
                  type="tel" value={value}
                  onChange={(e) => { setValue(formatMobile(e.target.value)); if (fieldError) setFieldError('') }}
                  onBlur={() => setFieldError(validateIndianMobile(value, false) ?? '')}
                  placeholder="10-digit number"
                  maxLength={10}
                  disabled={googleLoading}
                  style={{ flex: 1, padding: '9px 12px', fontSize: 13, color: 'var(--color-text-primary)', outline: 'none', background: 'transparent', border: 'none' }}
                />
              </div>
            ) : (
              <input
                type="email" value={value}
                onChange={(e) => { setValue(e.target.value); if (fieldError) setFieldError('') }}
                onBlur={() => setFieldError(validateEmail(value, false) ?? '')}
                placeholder="your@email.com"
                disabled={googleLoading}
                style={inputStyle}
              />
            )}
            {fieldError && <p className="text-red-500 mt-1" style={{ fontSize: 11 }}>{fieldError}</p>}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs px-3 py-2 rounded-lg"
              style={{ background: '#FAEEDA', color: '#633806' }}>
              Dev mode — check OTP at{' '}
              <a href="http://127.0.0.1:54324" target="_blank" className="underline">
                localhost:54324
              </a>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-center" style={{ fontSize: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#0F6E56', borderRadius: 20, padding: '9px 18px', fontSize: 13 }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : 'Send OTP'}
          </button>
        </form>

        {/* Footer links */}
        <p className="text-center" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          By continuing, you agree to our{' '}
          <Link href="/terms" className="hover:underline" style={{ color: '#0F6E56' }}>Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:underline" style={{ color: '#0F6E56' }}>Privacy</Link>
        </p>
      </div>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
