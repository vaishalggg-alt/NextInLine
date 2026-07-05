import { NextRequest, NextResponse } from 'next/server'
import { createSession, endSession, getSessionCode } from '@/lib/queue'
import { getSessionUser, isTeacherEmail } from '@/lib/auth'

async function requireTeacher() {
  const user = await getSessionUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!(await isTeacherEmail(user.email))) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

export async function GET() {
  return NextResponse.json({ code: getSessionCode() })
}

export async function POST(req: NextRequest) {
  const { error } = await requireTeacher()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const code = body.code || null
  const sessionCode = createSession(code)
  return NextResponse.json({ code: sessionCode })
}

export async function DELETE() {
  const { error } = await requireTeacher()
  if (error) return error

  endSession()
  return NextResponse.json({ ok: true })
}
