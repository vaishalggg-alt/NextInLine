import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const schoolDomain = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN?.toLowerCase()
      const email = user?.email?.toLowerCase()

      if (schoolDomain && !email?.endsWith(`@${schoolDomain}`)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login?error=domain', req.url))
      }

      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', req.url))
}
