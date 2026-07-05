import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser, isTeacherEmail } from '@/lib/auth'

async function requireTeacher() {
  const user = await getSessionUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!(await isTeacherEmail(user.email))) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

export async function GET() {
  const { error } = await requireTeacher()
  if (error) return error

  const supabase = createClient()
  const { data, error: dbError } = await supabase.from('classes').select('*').order('created_at', { ascending: true })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { error } = await requireTeacher()
  if (error) return error

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })
  const code = Math.floor(1000 + Math.random() * 9000).toString()
  const supabase = createClient()
  const { data, error: dbError } = await supabase.from('classes').insert({ name: name.trim(), code }).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireTeacher()
  if (error) return error

  const { id } = await req.json()
  const supabase = createClient()
  const { error: dbError } = await supabase.from('classes').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
