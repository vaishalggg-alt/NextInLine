import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser, isTeacherEmail } from '@/lib/auth'

async function requireTeacher() {
  const user = await getSessionUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!(await isTeacherEmail(user.email))) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

export async function POST(req: NextRequest) {
  const { error } = await requireTeacher()
  if (error) return error

  const { class_id, student_name, topic, duration_seconds } = await req.json()
  if (!class_id || !student_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const supabase = createClient()
  const { data, error: dbError } = await supabase.from('help_sessions').insert({ class_id, student_name, topic, duration_seconds }).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const { error } = await requireTeacher()
  if (error) return error

  const class_id = req.nextUrl.searchParams.get('class_id')
  const since = req.nextUrl.searchParams.get('since')
  if (!class_id) return NextResponse.json({ error: 'Missing class_id' }, { status: 400 })
  const supabase = createClient()
  let query = supabase
    .from('help_sessions')
    .select('*')
    .eq('class_id', class_id)
    .order('helped_at', { ascending: false })
  if (since) query = query.gte('helped_at', since)
  const { data, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
