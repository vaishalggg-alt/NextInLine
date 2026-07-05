'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginInner() {
  const params = useSearchParams()
  const error = params.get('error')

  async function signIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: process.env.NEXT_PUBLIC_SCHOOL_DOMAIN || '',
          prompt: 'select_account',
        },
      },
    })
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl font-light tracking-widest mb-2">NextInLine</h1>
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-10 text-center">Sign in with your school Google account</p>
      {error === 'domain' && (
        <p className="text-red-400 text-xs mb-6 max-w-sm text-center">
          That Google account isn&apos;t part of the school. Please sign in with your school account.
        </p>
      )}
      {error === 'auth' && <p className="text-red-400 text-xs mb-6">Sign-in failed. Please try again.</p>}
      <button
        onClick={signIn}
        className="border border-white/20 hover:border-white text-white text-xs tracking-widest uppercase px-8 py-4 transition-all hover:bg-white hover:text-black"
      >
        Sign in with Google
      </button>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
