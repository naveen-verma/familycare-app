'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // SIGNED_OUT fires both on explicit logout AND when the token refresh
      // fails (e.g. stale refresh token from a previous db reset).
      // In either case redirect to login so the user gets a clean session.
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return <>{children}</>
}
