import { addClient, removeClient, queue } from '@/lib/queue'

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(c) {
      controller = c
      addClient(controller)
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(queue)}\n\n`))
    },
    cancel() {
      removeClient(controller)
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
