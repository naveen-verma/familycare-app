'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { checkOnboardingStatus } from '@/lib/user'

const USE_PHONE_AUTH = process.env.NEXT_PUBLIC_APP_ENV === 'production'

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
    if (!phone && !email) {
      router.push('/login')
      return
    }
    setContact(phone || email || '')
  }, [router])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
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
    pasted.split('').forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit
    })
    setOtp(newOtp)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

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

      if (error) {
        setError(error.message)
        return
      }

      sessionStorage.removeItem('familycare_phone')
      sessionStorage.removeItem('familycare_email')
      const completed = await checkOnboardingStatus()
      if (completed) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
      

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
        await supabase.auth.signInWithOtp({
          email: contact,
          options: { shouldCreateUser: true }
        })
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

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">
          Verify your {contact.startsWith('+') ? 'number' : 'email'}
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to{' '}
          <span className="font-medium text-gray-700">{maskedContact}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {!USE_PHONE_AUTH && (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
            🔧 Dev mode — check OTP at{' '}
            <a href="http://127.0.0.1:54324" target="_blank" className="underline">
              localhost:54324
            </a>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={el => { inputRefs.current[index] = el }}
              type="tel"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-11 h-12 text-center text-xl font-bold border-2 focus:border-indigo-500 rounded-lg"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md text-center">
            {error}
          </div>
        )}

        <Button
          onClick={handleVerify}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify OTP'
          )}
        </Button>

        <div className="text-center text-sm text-gray-500">
          {countdown > 0 ? (
            <span>Resend OTP in {countdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-indigo-600 font-medium hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Use a different {contact.startsWith('+') ? 'number' : 'email'}
          </button>
        </div>

      </CardContent>
    </Card>
  )
}