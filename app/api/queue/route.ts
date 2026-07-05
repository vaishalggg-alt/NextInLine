import { NextRequest, NextResponse } from 'next/server'
import { joinQueue, leaveQueue, nextStudent, clearQueue, getQueue } from '@/lib/queue'
import { getSessionUser, isTeacherEmail } from '@/lib/auth'

function displayName(user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>) {
  return (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email || 'Student'
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || ''
  const queue = getQueue(code)
  if (queue === null) return NextResponse.json({ error: 'Invalid session' }, { status: 404 })
  return NextResponse.json(queue)
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, topic } = await req.json()
  if (!code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const ok = joinQueue(code, user.id, displayName(user), (topic || '').trim())
  if (!ok) return NextResponse.json({ error: 'Invalid session code' }, { status: 404 })
  return NextResponse.json({ studentId: user.id })
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json()
  const ok = leaveQueue(code, user.id)
  if (!ok) return NextResponse.json({ error: 'Invalid session' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isTeacherEmail(user.email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code, action } = await req.json()
  if (action === 'next') {
    const student = nextStudent(code)
    return NextResponse.json(student || { error: 'Queue empty' })
  }
  if (action === 'clear') {
    clearQueue(code)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
