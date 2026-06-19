'use client'
import { useEffect, useState } from 'react'

interface QueueEntry {
  studentId: string
  name: string
  topic: string
  joinedAt: number
}

export default function TeacherView() {
  const [code, setCode] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  async function startClass() {
    const res = await fetch('/api/session', { method: 'POST' })
    const { code } = await res.json()
    setCode(code)
    setQueue([])
  }

  async function endClass() {
    if (!confirm('End the class session? This will clear the queue for everyone.')) return
    await fetch('/api/session', { method: 'DELETE' })
    setCode(null)
    setQueue([])
  }

  async function handleNext() {
    await fetch('/api/queue', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, action: 'next' }) })
  }

  async function handleClear() {
    if (!confirm('Clear the entire queue?')) return
    await fetch('/api/queue', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, action: 'clear' }) })
  }

  const current = queue[0]
  const waiting = queue.slice(1)

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500 text-lg tracking-widest uppercase text-sm">Loading...</p>
    </main>
  )

  if (!code) return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-6xl font-light tracking-widest text-white mb-2">NextInLine</h1>
      <p className="text-zinc-500 text-sm tracking-widest uppercase mb-16">Classroom Queue</p>
      <button onClick={startClass} className="border border-white/20 hover:border-white text-white text-sm tracking-widest uppercase px-12 py-4 transition-all duration-300 hover:bg-white hover:text-black">
        Start Class
      </button>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col">
      <header className="text-center mb-14">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl font-light tracking-widest text-white">NextInLine</h1>
        <div className="mt-4">
          <span className="text-zinc-500 text-xs tracking-widest uppercase">Class Code </span>
          <span className="text-white text-2xl font-light tracking-[0.3em] ml-2">{code}</span>
        </div>
      </header>

      <section className="border border-white/10 p-10 mb-8 text-center max-w-2xl mx-auto w-full">
        {current ? (
          <>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Now Helping</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-7xl font-light text-white">{current.name}</p>
            {current.topic && <p className="text-zinc-400 text-sm mt-4 tracking-wide">Struggling with: <span className="text-white">{current.topic}</span></p>}
          </>
        ) : (
          <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-light text-zinc-600">Queue is empty</p>
        )}
      </section>

      <div className="flex gap-4 justify-center mb-12 flex-wrap">
        <button onClick={handleNext} disabled={queue.length === 0} className="border border-white/20 hover:border-white disabled:opacity-20 disabled:cursor-not-allowed text-white text-xs tracking-widest uppercase px-8 py-3 transition-all duration-300 hover:bg-white hover:text-black">
          Done — Next Student
        </button>
        <button onClick={handleClear} disabled={queue.length === 0} className="border border-white/10 hover:border-red-500 disabled:opacity-20 disabled:cursor-not-allowed text-zinc-500 hover:text-red-500 text-xs tracking-widest uppercase px-6 py-3 transition-all duration-300">
          Clear Queue
        </button>
        <button onClick={endClass} className="border border-white/10 hover:border-white/30 text-zinc-600 hover:text-zinc-400 text-xs tracking-widest uppercase px-6 py-3 transition-all duration-300">
          End Class
        </button>
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
