import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

interface ClassRoom {
  id: string
  name: string
  code: string
  created_at: string
}

interface HelpSession {
  id: string
  class_id: string
  student_name: string
  topic: string
  duration_seconds: number
  helped_at: string
}

interface DB {
  classes: ClassRoom[]
  help_sessions: HelpSession[]
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

function readDB(): DB {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return { classes: [], help_sessions: [] }
  }
}

function writeDB(db: DB) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export function listClasses(): ClassRoom[] {
  return readDB().classes.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function createClass(name: string): ClassRoom {
  const db = readDB()
  const cls: ClassRoom = {
    id: randomUUID(),
    name,
    code: Math.floor(1000 + Math.random() * 9000).toString(),
    created_at: new Date().toISOString(),
  }
  db.classes.push(cls)
  writeDB(db)
  return cls
}

export function deleteClass(id: string): void {
  const db = readDB()
  db.classes = db.classes.filter(c => c.id !== id)
  db.help_sessions = db.help_sessions.filter(h => h.class_id !== id)
  writeDB(db)
}

export function addHelpSession(entry: { class_id: string; student_name: string; topic?: string; duration_seconds?: number }): HelpSession {
  const db = readDB()
  const session: HelpSession = {
    id: randomUUID(),
    class_id: entry.class_id,
    student_name: entry.student_name,
    topic: entry.topic || '',
    duration_seconds: entry.duration_seconds || 0,
    helped_at: new Date().toISOString(),
  }
  db.help_sessions.push(session)
  writeDB(db)
  return session
}

export function listHelpSessions(classId: string, since?: string): HelpSession[] {
  return readDB()
    .help_sessions.filter(h => h.class_id === classId && (!since || h.helped_at >= since))
    .sort((a, b) => b.helped_at.localeCompare(a.helped_at))
}
