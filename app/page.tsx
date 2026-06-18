'use client'
import { useEffect, useState } from 'react'

interface Student {
  id: string
  name: string
  topic: string
  joinedAt: number
}

export default function TeacherView() {
  const [queue, setQueue] = useState<Student[]>([])

  useEffect(() => {
    const es = new EventSource('/api/queue/stream')
    es.onmessage = (e) => setQueue(JSON.parse(e.data))
    return () => es.close()
  }, [])

  async function handleNext() {
    await fetch('/api/queue', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'next' }) })
  }

  async function handleClear() {
    if (!confirm('Clear the entire queue?')) return
    await fetch('/api/queue', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clear' }) })
  }

  const current = queue[0]
  const waiting = queue.slice(1)

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-900 text-white p-8 flex flex-col">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-indigo-200">NextInLine</h1>
        <p className="text-indigo-400 mt-1 text-lg">Classroom Queue</p>
      </header>

      <section className="bg-white/10 rounded-3xl p-8 mb-8 text-center shadow-xl backdrop-blur">
        {current ? (
          <>
            <p className="text-indigo-300 text-xl uppercase tracking-widest mb-2">Now Helping</p>
            <p className="text-6xl font-black text-white">{current.name}</p>
            {current.topic && (
              <p className="text-indigo-300 text-xl mt-3">Struggling with: <span className="text-white font-semibold">{current.topic}</span></p>
            )}
          </>
        ) : (
          <p className="text-4xl font-bold text-indigo-400">Queue is empty</p>
        )}
      </section>

      <div className="flex gap-4 justify-center mb-10">
        <button
          onClick={handleNext}
          disabled={queue.length === 0}
          className="bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-2xl font-bold px-10 py-4 rounded-2xl shadow-lg transition"
        >
          Done — Next Student
        </button>
        <button
          onClick={handleClear}
          disabled={queue.length === 0}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-4 rounded-2xl shadow transition"
        >
          Clear Queue
        </button>
      </div>

      {waiting.length > 0 && (
        <section className="bg-white/5 rounded-2xl p-6 max-w-lg mx-auto w-full">
          <h2 className="text-indigo-300 text-lg font-semibold mb-4 uppercase tracking-wide">Waiting ({waiting.length})</h2>
          <ol className="space-y-3">
            {waiting.map((s, i) => (
              <li key={s.id} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 2}</span>
                <div>
                  <p className="text-white text-lg">{s.name}</p>
                  {s.topic && <p className="text-indigo-400 text-sm">{s.topic}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-auto pt-10 text-center text-indigo-500 text-sm">
        Students join at: <span className="font-mono text-indigo-300">/join</span>
      </div>
    </main>
  )
}
