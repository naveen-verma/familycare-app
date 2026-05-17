'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/lib/auth'
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

const USE_PHONE_AUTH = process.env.NEXT_PUBLIC_APP_ENV === 'production'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error') === 'oauth_error'
  const sessionExpired = searchParams.get('reason') === 'session_expired'

  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(
    oauthError ? 'Google sign-in failed. Please try again.' : ''
  )

  const formatMobile = (val: string) => val.replace(/\D/g, '').slice(0, 10)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      // signInWithGoogle triggers a full-page redirect to Google —
      // spinner stays visible until the browser navigates away
    } catch {
      setError('Could not start Google sign-in. Please try again.')
      setGoogleLoading(false)
    }
  }

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
          options: {
            shouldCreateUser: true,
            emailRedirectTo: undefined,
          }
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
        <CardTitle className="text-xl font-semibold">
          Your family&apos;s health, all in one place
        </CardTitle>
        <CardDescription>Sign in to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {sessionExpired && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
            Your session expired due to inactivity. Please log in again.
          </div>
        )}

        {/* Google SSO — primary */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 h-12 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <>
              <Spinner />
              Redirecting to Google...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">or</span>
          </div>
        </div>

        {/* Email / Phone OTP — secondary */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="value" className="text-xs text-gray-500 uppercase tracking-wide">
              {USE_PHONE_AUTH ? 'Or sign in with mobile' : 'Or sign in with email'}
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
                  disabled={googleLoading}
                />
              </div>
            ) : (
              <Input
                id="value"
                type="email"
                placeholder="you@example.com"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={googleLoading}
              />
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
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
            variant="outline"
            className="w-full"
            disabled={loading || googleLoading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Sending OTP...
              </span>
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-400 pt-1">
          New to FamilyCare? Just sign in — we&apos;ll set up your account.
        </p>

      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
