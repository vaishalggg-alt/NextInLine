import { NextRequest, NextResponse } from 'next/server'
import { queue, broadcast } from '@/lib/queue'
import { randomUUID } from 'crypto'

export async function GET() {
  return NextResponse.json(queue)
}

export async function POST(req: NextRequest) {
  const { name, topic } = await req.json()
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
  const student = { id: randomUUID(), name: name.trim(), topic: (topic || '').trim(), joinedAt: Date.now() }
  queue.push(student)
  broadcast()
  return NextResponse.json(student, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const idx = queue.findIndex(s => s.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  queue.splice(idx, 1)
  broadcast()
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest) {
  const { action } = await req.json()
  if (action === 'next') {
    if (queue.length === 0) return NextResponse.json({ error: 'Queue empty' }, { status: 400 })
    const helped = queue.shift()
    broadcast()
    return NextResponse.json(helped)
  }
  if (action === 'clear') {
    queue.splice(0, queue.length)
    broadcast()
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
