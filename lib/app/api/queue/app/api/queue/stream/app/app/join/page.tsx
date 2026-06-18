'use client'
import { useEffect, useState } from 'react'

interface Student {
  id: string
  name: string
  joinedAt: number
}

export default function JoinPage() {
  const [queue, setQueue] = useState<Student[]>([])
  const [name, setName] = useState('')
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const es = new EventSource('/api/queue/stream')
    es.onmessage = (e) => {
      const q: Student[] = JSON.parse(e.data)
      setQueue(q)
    }
    return () => es.close()
  }, [])

  useEffect(() => {
    if (myId && !queue.find(s => s.id === myId)) {
      setMyId(null)
    }
  }, [queue, myId])

  const myPosition = myId ? queue.findIndex(s => s.id === myId) + 1 : 0

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error('Failed to join')
      const student: Student = await res.json()
      setMyId(student.id)
    } catch {
      setError('Could not join queue. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    if (!myId) return
    await fetch('/api/queue', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: myId }),
    })
    setMyId(null)
  }

  const inQueue = myId !== null

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900 to-emerald-800 text-white flex flex-col items-center justify-start p-6">
      <h1 className="text-4xl font-extrabold text-teal-200 mt-8 mb-2">NextInLine</h1>
      <p className="text-teal-400 mb-8">Join the classroom queue</p>

      {!inQueue ? (
        <form onSubmit={handleJoin} className="bg-white/10 backdrop-blur rounded-2xl p-8 w-full max-w-sm shadow-xl">
          <label className="block text-teal-200 font-semibold mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full rounded-xl px-4 py-3 text-gray-900 text-lg mb-4 outline-none focus:ring-2 focus:ring-teal-400"
            maxLength={50}
            required
          />
          {error && <p className="text-red-400 mb-3 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold text-lg py-3 rounded-xl transition"
          >
            {loading ? 'Joining...' : 'Join Queue'}
          </button>
        </form>
      ) : (
        <div className="w-full max-w-sm">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center shadow-xl mb-6">
            <p className="text-teal-300 text-sm uppercase tracking-widest mb-1">Your Position</p>
            <p className="text-8xl font-black text-white mb-2">#{myPosition}</p>
            <p className="text-teal-200 text-lg font-semibold">{name}</p>
            {myPosition === 1 && (
              <p className="mt-3 text-yellow-300 font-bold animate-pulse">You're next!</p>
            )}
          </div>
          <button
            onClick={handleLeave}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition mb-6"
          >
            Leave Queue
          </button>
        </div>
      )}

      {queue.length > 0 && (
        <div className="w-full max-w-sm bg-white/5 rounded-2xl p-5">
          <h2 className="text-teal-300 text-sm uppercase tracking-wide font-semibold mb-3">Queue ({queue.length})</h2>
          <ol className="space-y-2">
            {queue.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${s.id === myId ? 'bg-teal-700/50 font-bold' : ''}`}
              >
                <span className="w-7 h-7 rounded-full bg-teal-800 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="text-white">{s.name}{s.id === myId ? ' (you)' : ''}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </main>
  )
}
