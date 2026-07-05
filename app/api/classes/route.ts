import { NextRequest, NextResponse } from 'next/server'
import { listClasses, createClass, deleteClass } from '@/lib/db'

export async function GET() {
  return NextResponse.json(listClasses())
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })
  return NextResponse.json(createClass(name.trim()))
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  deleteClass(id)
  return NextResponse.json({ ok: true })
}
