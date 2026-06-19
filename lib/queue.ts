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

let currentSession: SessionData | null = null

export function createSession(fixedCode?: string | null): string {
  const code = fixedCode || Math.floor(1000 + Math.random() * 9000).toString()
  if (currentSession) {
    broadcastToSession(currentSession, null)
  }
  currentSession = { code, queue: [], clients: new Set() }
  return code
}

export function endSession(): void {
  if (currentSession) {
    broadcastToSession(currentSession, null)
    currentSession = null
  }
}

export function getSessionCode(): string | null {
  return currentSession ? currentSession.code : null
}

export function joinQueue(code: string, studentId: string, name: string, topic: string): boolean {
  if (!currentSession || currentSession.code !== code) return false
  currentSession.queue = currentSession.queue.filter(s => s.studentId !== studentId)
  currentSession.queue.push({ studentId, name, topic, joinedAt: Date.now() })
  broadcast()
  return true
}

export function leaveQueue(code: string, studentId: string): boolean {
  if (!currentSession || currentSession.code !== code) return false
  currentSession.queue = currentSession.queue.filter(s => s.studentId !== studentId)
  broadcast()
  return true
}

export function nextStudent(code: string): QueueEntry | null {
  if (!currentSession || currentSession.code !== code) return null
  const student = currentSession.queue.shift() || null
  broadcast()
  return student
}

export function clearQueue(code: string): boolean {
  if (!currentSession || currentSession.code !== code) return false
  currentSession.queue = []
  broadcast()
  return true
}

export function getQueue(code: string): QueueEntry[] | null {
  if (!currentSession || currentSession.code !== code) return null
  return currentSession.queue
}

type Controller = ReadableStreamDefaultController

export function addClient(code: string, controller: Controller): boolean {
  if (!currentSession || currentSession.code !== code) return false
  currentSession.clients.add(controller)
  return true
}

export function removeClient(code: string, controller: Controller): void {
  if (currentSession && currentSession.code === code) {
    currentSession.clients.delete(controller)
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
  if (!currentSession) return
  broadcastToSession(currentSession, currentSession.queue)
}
