'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Listens for Supabase auth state changes in the browser and redirects to
 * /login when the session is invalidated (e.g. stale refresh token after a
 * local DB reset, or the user signed out from another tab).
 *
 * Rendered once in the root layout — returns nothing visible.
 */
export function AuthStateListener() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
