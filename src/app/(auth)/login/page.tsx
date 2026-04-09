'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Toggle this based on environment
const USE_PHONE_AUTH = process.env.NEXT_PUBLIC_APP_ENV === 'production'

export default function LoginPage() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatMobile = (val: string) => val.replace(/\D/g, '').slice(0, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (USE_PHONE_AUTH && value.length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    if (!USE_PHONE_AUTH && !value.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      if (USE_PHONE_AUTH) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: `+91${value}`,
        })
        if (error) { setError(error.message); return }
        sessionStorage.setItem('familycare_phone', `+91${value}`)
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: value,
          options: { shouldCreateUser: true }
        })
        if (error) { setError(error.message); return }
        sessionStorage.setItem('familycare_email', value)
      }

      router.push('/verify')

    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
        <CardDescription>
          {USE_PHONE_AUTH
            ? 'Enter your mobile number to receive a verification code'
            : 'Enter your email to receive a verification code'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value">
              {USE_PHONE_AUTH ? 'Mobile Number' : 'Email Address'}
            </Label>
            {USE_PHONE_AUTH ? (
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-600 font-medium">
                  🇮🇳 +91
                </div>
                <Input
                  id="value"
                  type="tel"
                  placeholder="98765 43210"
                  value={value}
                  onChange={(e) => setValue(formatMobile(e.target.value))}
                  className="flex-1 text-lg tracking-widest"
                  maxLength={10}
                  autoFocus
                />
              </div>
            ) : (
              <Input
                id="value"
                type="email"
                placeholder="you@example.com"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Dev mode indicator */}
          {!USE_PHONE_AUTH && (
            <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
              Dev mode — using email OTP. Check Inbucket at{' '}
              <a href="http://127.0.0.1:54324" target="_blank" className="underline">
                localhost:54324
              </a>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending OTP...
              </span>
            ) : (
              'Send OTP'
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            We will send a 6-digit verification code
          </p>
        </form>
      </CardContent>
    </Card>
  )
}