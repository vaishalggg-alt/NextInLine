export interface QueueEntry {
  studentId: string
  name: string
  topic: string
  joinedAt: number
}

interface SessionData {
  code: string
  queue: QueueEntry[]
  clients: Set<ReadableStreamDefaultController>
}

// Next.js compiles each route file as its own module bundle, so a plain
// module-scoped variable here is NOT shared across app/api/session,
// app/api/queue, and app/api/queue/stream — each would get its own copy.
// Attaching state to globalThis makes it one true singleton per server
// process, matching how e.g. a shared PrismaClient instance is kept warm
// across Next.js dev recompiles.
const globalForQueue = globalThis as unknown as { __nextInLineSession?: SessionData | null }

function getCurrentSession(): SessionData | null {
  return globalForQueue.__nextInLineSession ?? null
}

function setCurrentSession(session: SessionData | null): void {
  globalForQueue.__nextInLineSession = session
}

export function createSession(fixedCode?: string | null): string {
  const code = fixedCode || Math.floor(1000 + Math.random() * 9000).toString()
  const existing = getCurrentSession()
  if (existing) {
    broadcastToSession(existing, null)
  }
  setCurrentSession({ code, queue: [], clients: new Set() })
  return code
}

export function endSession(): void {
  const session = getCurrentSession()
  if (session) {
    broadcastToSession(session, null)
    setCurrentSession(null)
  }
}

export function getSessionCode(): string | null {
  const session = getCurrentSession()
  return session ? session.code : null
}

export function joinQueue(code: string, studentId: string, name: string, topic: string): boolean {
  const session = getCurrentSession()
  if (!session || session.code !== code) return false
  session.queue = session.queue.filter(s => s.studentId !== studentId)
  session.queue.push({ studentId, name, topic, joinedAt: Date.now() })
  broadcast()
  return true
}

export function leaveQueue(code: string, studentId: string): boolean {
  const session = getCurrentSession()
  if (!session || session.code !== code) return false
  session.queue = session.queue.filter(s => s.studentId !== studentId)
  broadcast()
  return true
}

export function nextStudent(code: string): QueueEntry | null {
  const session = getCurrentSession()
  if (!session || session.code !== code) return null
  const student = session.queue.shift() || null
  broadcast()
  return student
}

export function clearQueue(code: string): boolean {
  const session = getCurrentSession()
  if (!session || session.code !== code) return false
  session.queue = []
  broadcast()
  return true
}

export function getQueue(code: string): QueueEntry[] | null {
  const session = getCurrentSession()
  if (!session || session.code !== code) return null
  return session.queue
}

type Controller = ReadableStreamDefaultController

export function addClient(code: string, controller: Controller): boolean {
  const session = getCurrentSession()
  if (!session || session.code !== code) return false
  session.clients.add(controller)
  return true
}

export function removeClient(code: string, controller: Controller): void {
  const session = getCurrentSession()
  if (session && session.code === code) {
    session.clients.delete(controller)
  }
}

function broadcastToSession(session: SessionData, queue: QueueEntry[] | null) {
  const data = queue === null
    ? `data: ${JSON.stringify({ ended: true })}\n\n`
    : `data: ${JSON.stringify(queue)}\n\n`
  for (const controller of session.clients) {
    try {
      controller.enqueue(new TextEncoder().encode(data))
    } catch {
      session.clients.delete(controller)
    }
  }
}

export function broadcast(): void {
  const session = getCurrentSession()
  if (!session) return
  broadcastToSession(session, session.queue)
}
