'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const IDLE_MS = 30 * 60 * 1000   // 30 minutes before showing warning
const WARNING_SECS = 3 * 60      // 3-minute countdown

function formatCountdown(secs: number): string {
  const s = Math.max(secs, 0)
  const m = Math.floor(s / 60)
  const remainder = s % 60
  return `${String(m).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function SessionTimeout() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(WARNING_SECS)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Keep a live ref to router so the sign-out callback never goes stale
  const routerRef = useRef(router)
  routerRef.current = router

  // Exposed to button handlers — wired up inside useEffect
  const resetIdleRef = useRef<() => void>(() => {})
  const signOutNowRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    function clearAll() {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }

    async function signOut() {
      clearAll()
      const supabase = createClient()
      await supabase.auth.signOut()
      routerRef.current.push('/login?reason=session_expired')
    }

    function startCountdown() {
      setShowWarning(true)
      setCountdown(WARNING_SECS)
      let remaining = WARNING_SECS
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1
        setCountdown(remaining)
        if (remaining <= 0) signOut()
      }, 1000)
    }

    function resetIdle() {
      clearAll()
      setShowWarning(false)
      setCountdown(WARNING_SECS)
      idleTimerRef.current = setTimeout(startCountdown, IDLE_MS)
    }

    // Wire inner functions to refs so button handlers can call them
    resetIdleRef.current = resetIdle
    signOutNowRef.current = signOut

    const EVENTS = [
      'mousemove', 'mousedown', 'keypress',
      'touchstart', 'scroll', 'click',
    ] as const

    EVENTS.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }))
    resetIdle()

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, resetIdle))
      clearAll()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Your session is about to expire</DialogTitle>
          <DialogDescription>
            You will be logged out in{' '}
            <span className="font-semibold text-teal-600 text-base tabular-nums">
              {formatCountdown(countdown)}
            </span>{' '}
            to protect your privacy. Please save any unsaved information.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => signOutNowRef.current()}
          >
            Log out now
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => resetIdleRef.current()}
          >
            Stay logged in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
