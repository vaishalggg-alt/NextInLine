import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { class_id, student_name, topic, duration_seconds } = await req.json()
  if (!class_id || !student_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const { data, error } = await supabase.from('help_sessions').insert({ class_id, student_name, topic, duration_seconds }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const class_id = req.nextUrl.searchParams.get('class_id')
  const since = req.nextUrl.searchParams.get('since')
  if (!class_id) return NextResponse.json({ error: 'Missing class_id' }, { status: 400 })
  let query = supabase
    .from('help_sessions')
    .select('*')
    .eq('class_id', class_id)
    .order('helped_at', { ascending: false })
  if (since) query = query.gte('helped_at', since)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
