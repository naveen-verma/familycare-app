'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/layout/AuthShell'
import { checkOnboardingStatus } from '@/lib/user'

export default function VerifyPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [contact, setContact] = useState('')
  const [countdown, setCountdown] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const phone = sessionStorage.getItem('familycare_phone')
    const email = sessionStorage.getItem('familycare_email')
    if (!phone && !email) { router.push('/login'); return }
    setContact(phone || email || '')
  }, [router])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((digit, i) => { if (i < 6) newOtp[i] = digit })
    setOtp(newOtp)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) { setError('Please enter the complete 6-digit code'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const isPhone = contact.startsWith('+')
      const { error } = await supabase.auth.verifyOtp(
        isPhone
          ? { phone: contact, token: otpString, type: 'sms' }
          : { email: contact, token: otpString, type: 'email' }
      )
      if (error) { setError(error.message); return }
      sessionStorage.removeItem('familycare_phone')
      sessionStorage.removeItem('familycare_email')
      const completed = await checkOnboardingStatus()
      router.push(completed ? '/dashboard' : '/onboarding')
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      const supabase = createClient()
      const isPhone = contact.startsWith('+')
      if (isPhone) {
        await supabase.auth.signInWithOtp({ phone: contact })
      } else {
        await supabase.auth.signInWithOtp({ email: contact, options: { shouldCreateUser: true } })
      }
      setCountdown(30)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setError('Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  const maskedContact = contact.startsWith('+')
    ? `+91 ${contact.slice(3, 7)}XXXXXX`
    : contact.replace(/(.{2}).*(@.*)/, '$1****$2')

  const otpComplete = otp.join('').length === 6

  const boxStyle = (filled: boolean, focused: boolean): React.CSSProperties => ({
    width: 44, height: 44,
    border: `0.5px solid ${focused ? '#0F6E56' : 'var(--color-border-tertiary)'}`,
    borderRadius: 8,
    fontSize: 20, fontWeight: 500, textAlign: 'center',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color 150ms ease',
  })

  return (
    <AuthShell
      title="Enter verification code"
      subtitle={`We sent a 6-digit code to ${maskedContact}`}
    >
      <div className="space-y-5">
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs px-3 py-2 rounded-lg"
            style={{ background: '#FAEEDA', color: '#633806' }}>
            Dev mode — check OTP at{' '}
            <a href="http://127.0.0.1:54324" target="_blank" className="underline">
              localhost:54324
            </a>
          </div>
        )}

        {/* OTP boxes */}
        <div className="flex justify-center" style={{ gap: 8 }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="tel"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              style={boxStyle(!!digit, false)}
              onFocus={(e) => { e.target.style.borderColor = '#0F6E56' }}
              onBlur={(e) => { e.target.style.borderColor = digit ? '#0F6E56' : 'var(--color-border-tertiary)' }}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-center" style={{ fontSize: 12 }}>{error}</p>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || !otpComplete}
          className="w-full flex items-center justify-center gap-2 text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: '#0F6E56', borderRadius: 20, padding: '9px 18px', fontSize: 13 }}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Verifying…</> : 'Verify'}
        </button>

        {/* Resend */}
        <div className="text-center" style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          {countdown > 0 ? (
            <span>Resend in {countdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium hover:opacity-70 transition-opacity disabled:opacity-50"
              style={{ color: '#0F6E56', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        {/* Back link */}
        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            style={{ fontSize: 12, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
            className="hover:opacity-70 transition-opacity"
          >
            ← Use a different {contact.startsWith('+') ? 'number' : 'email'}
          </button>
        </div>
      </div>
    </AuthShell>
  )
}
