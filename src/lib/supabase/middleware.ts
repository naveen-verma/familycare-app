import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Paths that only make sense when logged OUT
  const isAuthOnlyPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/verify')

  // Paths that are accessible without a session
  const isPublicPath = isAuthOnlyPath || pathname.startsWith('/onboarding')

  // ── Authenticated user ────────────────────────────────────────────────────
  if (user && !sessionError) {
    if (isAuthOnlyPath) {
      // Check onboarding completion to decide where to send them
      const { data: completed } = await supabase.rpc('has_completed_onboarding', {
        user_auth_id: user.id,
      })
      const url = request.nextUrl.clone()
      url.pathname = completed ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(url)
    }
    // Authenticated user on a protected or onboarding path — let through
    return supabaseResponse
  }

  // ── Unauthenticated user ──────────────────────────────────────────────────
  if (!isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)

    // Clear stale sb- cookies so the bad token stops being sent
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith('sb-')) {
        redirectResponse.cookies.delete(name)
      }
    })

    return redirectResponse
  }

  return supabaseResponse
}
