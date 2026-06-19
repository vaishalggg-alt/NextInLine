import { NextRequest } from 'next/server'
import { addClient, removeClient, getQueue } from '@/lib/queue'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || ''
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(c) {
      controller = c
      const queue = getQueue(code)
      if (queue === null) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ended: true })}\n\n`))
        controller.close()
        return
      }
      addClient(code, controller)
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(queue)}\n\n`))
    },
    cancel() {
      removeClient(code, controller)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
