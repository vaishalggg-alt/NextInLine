import { createClient } from '@/lib/supabase/server'

export async function getSessionUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function isTeacherEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  const supabase = createClient()
  const { data } = await supabase
    .from('teachers')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  return !!data
}
