import { NextRequest, NextResponse } from 'next/server'
import { joinQueue, leaveQueue, nextStudent, clearQueue, getQueue } from '@/lib/queue'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || ''
  const queue = getQueue(code)
  if (queue === null) return NextResponse.json({ error: 'Invalid session' }, { status: 404 })
  return NextResponse.json(queue)
}

export async function POST(req: NextRequest) {
  const { code, studentId, name, topic } = await req.json()
  if (!code || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const id = studentId || randomUUID()
  const ok = joinQueue(code, id, name.trim(), (topic || '').trim())
  if (!ok) return NextResponse.json({ error: 'Invalid session code' }, { status: 404 })
  return NextResponse.json({ studentId: id })
}

export async function DELETE(req: NextRequest) {
  const { code, studentId } = await req.json()
  const ok = leaveQueue(code, studentId)
  if (!ok) return NextResponse.json({ error: 'Invalid session' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest) {
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
