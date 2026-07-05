import { NextRequest, NextResponse } from 'next/server'
import { addHelpSession, listHelpSessions } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { class_id, student_name, topic, duration_seconds } = await req.json()
  if (!class_id || !student_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  return NextResponse.json(addHelpSession({ class_id, student_name, topic, duration_seconds }))
}

export async function GET(req: NextRequest) {
  const class_id = req.nextUrl.searchParams.get('class_id')
  const since = req.nextUrl.searchParams.get('since') || undefined
  if (!class_id) return NextResponse.json({ error: 'Missing class_id' }, { status: 400 })
  return NextResponse.json(listHelpSessions(class_id, since))
}
