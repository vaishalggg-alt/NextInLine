import { NextResponse } from 'next/server'
import { createSession, endSession, getSessionCode } from '@/lib/queue'

export async function GET() {
  return NextResponse.json({ code: getSessionCode() })
}

export async function POST() {
  const code = createSession()
  return NextResponse.json({ code })
}

export async function DELETE() {
  endSession()
  return NextResponse.json({ ok: true })
}
