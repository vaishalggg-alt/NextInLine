import { NextRequest, NextResponse } from 'next/server'
import { createSession, endSession, getSessionCode } from '@/lib/queue'

export async function GET() {
  return NextResponse.json({ code: getSessionCode() })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const code = body.code || null
  const sessionCode = createSession(code)
  return NextResponse.json({ code: sessionCode })
}

export async function DELETE() {
  endSession()
  return NextResponse.json({ ok: true })
}
