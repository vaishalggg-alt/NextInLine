'use client'
import { useEffect, useState, useRef } from 'react'

interface QueueEntry {
  studentId: string
  name: string
  topic: string
  joinedAt: number
}

interface ClassRoom {
  id: string
  name: string
  code: string
}

export default function TeacherView() {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [activeClass, setActiveClass] = useState<ClassRoom | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newClassName, setNewClassName] = useState('')
  const [view, setView] = useState<'classes' | 'queue' | 'leaderboard'>('classes')
  const [leaderboard, setLeaderboard] = useState<{ student_name: string; count: number; avg_seconds: number }[]>([])
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const helpStartRef = useRef<number | null>(null)

  useEffect(() => {
    fetchClasses()
    fetch('/api/session').then(r => r.json()).then(d => {
      setCode(d.code)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!code) return
    const es = new EventSource(`/api/queue/stream?code=${code}`)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.ended) { setCode(null); setQueue([]); es.close() }
      else setQueue(data)
    }
    return () => es.close()
  }, [code])

  useEffect(() => {
    if (timerRunning) {
      helpStartRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  async function fetchClasses() {
    const res = await fetch('/api/classes')
    const data = await res.json()
    if (Array.isArray(data)) setClasses(data)
  }

  async function createClass(e: React.FormEvent) {
    e.preventDefault()
    if (!newClassName.trim()) return
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClassName.trim() }),
    })
    const data = await res.json()
    setClasses(prev => [...prev, data])
    setNewClassName('')
  }

  async function deleteClass(id: string) {
    if (!confirm('Delete this class?')) return
    await fetch('/api/classes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setClasses(prev => prev.filter(c => c.id !== id))
  }

  async function startClass(cls: ClassRoom) {
    await fetch('/api/session', { method: 'DELETE' })
    const res = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: cls.code }) })
    const { code } = await res.json()
    setCode(code)
    setActiveClass(cls)
    setQueue([])
    setView('queue')
  }

  async function endClass() {
    if (!confirm('End the class session?')) return
    await fetch('/api/session', { method: 'DELETE' })
    setCode(null)
    setActiveClass(null)
    setQueue([])
    setTimerRunning(false)
    setTimerSeconds(0)
    setView('classes')
  }

  async function handleNext() {
    const elapsed = helpStartRef.current ? Math.round((Date.now() - helpStartRef.current) / 1000) : timerSeconds
    const current = queue[0]
    if (current && activeClass) {
      await fetch('/api/help-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: activeClass.id, student_name: current.name, topic: current.topic, duration_seconds: elapsed }),
      })
    }
    await fetch('/api/queue', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, action: 'next' }) })
    setTimerSeconds(0)
    setTimerRunning(true)
    helpStartRef.current = Date.now()
  }

  async function handleClear() {
    if (!confirm('Clear the entire queue?')) return
    await fetch('/api/queue', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, action: 'clear' }) })
    setTimerRunning(false)
    setTimerSeconds(0)
  }

  async function fetchLeaderboard() {
    if (!activeClass) return
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const res = await fetch(`/api/help-sessions?class_id=${activeClass.id}&since=${since}`)
    const data = await res.json()
    if (!Array.isArray(data)) return
    const map: Record<string, { count: number; total: number }> = {}
    for (const s of data) {
      if (!map[s.student_name]) map[s.student_name] = { count: 0, total: 0 }
      map[s.student_name].count++
      map[s.student_name].total += s.duration_seconds || 0
    }
    const board = Object.entries(map).map(([name, v]) => ({
      student_name: name,
      count: v.count,
      avg_seconds: Math.round(v.total / v.count),
    })).sort((a, b) => b.count - a.count)
    setLeaderboard(board)
    setView('leaderboard')
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const current = queue[0]
  const waiting = queue.slice(1)

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500 text-sm tracking-widest uppercase">Loading...</p>
    </main>
  )

  if (view === 'classes') return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col items-center">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-6xl font-light tracking-widest mb-2">NextInLine</h1>
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-14">Teacher Dashboard</p>

      <form onSubmit={createClass} className="flex gap-3 mb-10 w-full max-w-md">
        <input value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="New class name..." className="flex-1 bg-transparent border border-white/20 text-white px-4 py-3 outline-none focus:border-white transition-colors text-sm" maxLength={50} />
        <button type="submit" className="border border-white/20 hover:border-white text-white text-xs tracking-widest uppercase px-6 py-3 transition-all hover:bg-white hover:text-black">Add</button>
      </form>

      <div className="w-full max-w-md space-y-3">
        {classes.length === 0 && <p className="text-zinc-600 text-sm text-center">No classes yet. Create one above.</p>}
        {classes.map(cls => (
          <div key={cls.id} className="border border-white/10 p-5 flex items-center justify-between">
            <div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-white text-2xl font-light">{cls.name}</p>
              <p className="text-zinc-600 text-xs tracking-widest mt-1">Code: {cls.code}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => startClass(cls)} className="border border-white/20 hover:border-white text-white text-xs tracking-widest uppercase px-4 py-2 transition-all hover:bg-white hover:text-black">Start</button>
              <button onClick={() => deleteClass(cls.id)} className="border border-white/10 hover:border-red-500 text-zinc-600 hover:text-red-500 text-xs tracking-widest uppercase px-4 py-2 transition-all">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )

  if (view === 'leaderboard') return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col items-center">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl font-light tracking-widest mb-2">Leaderboard</h1>
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">{activeClass?.name} · Past 7 days</p>
      <button onClick={() => setView('queue')} className="text-zinc-600 hover:text-white text-xs tracking-widest uppercase mb-10 transition-colors">← Back to Queue</button>

      <div className="w-full max-w-md space-y-3">
        {leaderboard.length === 0 && <p className="text-zinc-600 text-sm text-center">No data yet for this class.</p>}
        {leaderboard.map((s, i) => (
          <div key={s.student_name} className="border border-white/10 p-5 flex items-center gap-5">
            <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl font-light text-zinc-600 w-8">{i + 1}</span>
            <div className="flex-1">
              <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-white text-2xl font-light">{s.student_name}</p>
              <p className="text-zinc-600 text-xs mt-1">{s.count} question{s.count !== 1 ? 's' : ''} · avg {formatTime(s.avg_seconds)} per session</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col">
      <header className="text-center mb-10">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl font-light tracking-widest text-white">{activeClass?.name || 'NextInLine'}</h1>
        <div className="mt-2">
          <span className="text-zinc-500 text-xs tracking-widest uppercase">Code </span>
          <span className="text-white text-2xl font-light tracking-[0.3em] ml-2">{code}</span>
        </div>
      </header>

      <section className="border border-white/10 p-10 mb-6 text-center max-w-2xl mx-auto w-full">
        {current ? (
          <>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Now Helping</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-7xl font-light text-white">{current.name}</p>
            {current.topic && <p className="text-zinc-400 text-sm mt-4">Struggling with: <span className="text-white">{current.topic}</span></p>}
            <div className="mt-6">
              <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">Time</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className={`text-4xl font-light ${timerRunning ? 'text-white' : 'text-zinc-600'}`}>{formatTime(timerSeconds)}</p>
              {!timerRunning && <button onClick={() => setTimerRunning(true)} className="mt-2 text-zinc-600 hover:text-white text-xs tracking-widest uppercase transition-colors">Start Timer</button>}
            </div>
          </>
        ) : (
          <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-light text-zinc-600">Queue is empty</p>
        )}
      </section>

      <div className="flex gap-4 justify-center mb-10 flex-wrap">
        <button onClick={handleNext} disabled={queue.length === 0} className="border border-white/20 hover:border-white disabled:opacity-20 disabled:cursor-not-allowed text-white text-xs tracking-widest uppercase px-8 py-3 transition-all hover:bg-white hover:text-black">Done — Next Student</button>
        <button onClick={fetchLeaderboard} className="border border-white/10 hover:border-white text-zinc-500 hover:text-white text-xs tracking-widest uppercase px-6 py-3 transition-all">Leaderboard</button>
        <button onClick={handleClear} disabled={queue.length === 0} className="border border-white/10 hover:border-red-500 disabled:opacity-20 disabled:cursor-not-allowed text-zinc-500 hover:text-red-500 text-xs tracking-widest uppercase px-6 py-3 transition-all">Clear Queue</button>
        <button onClick={endClass} className="border border-white/10 hover:border-white/30 text-zinc-600 hover:text-zinc-400 text-xs tracking-widest uppercase px-6 py-3 transition-all">End Class</button>
      </div>

      {waiting.length > 0 && (
        <section className="max-w-md mx-auto w-full">
          <h2 className="text-zinc-600 text-xs uppercase tracking-widest mb-6">Waiting — {waiting.length}</h2>
          <ol className="space-y-4">
            {waiting.map((s, i) => (
              <li key={s.studentId} className="flex items-center gap-5 border-b border-white/5 pb-4">
                <span className="text-zinc-700 text-sm w-5">{i + 2}</span>
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-white text-xl font-light">{s.name}</p>
                  {s.topic && <p className="text-zinc-600 text-xs mt-1">{s.topic}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-auto pt-12 text-center text-zinc-700 text-xs tracking-widest uppercase">
        Students join at /join · Code {code}
      </div>
    </main>
  )
}
