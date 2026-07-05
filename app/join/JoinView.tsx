'use client'
import { useEffect, useState } from 'react'

interface QueueEntry {
  studentId: string
  name: string
  topic: string
  joinedAt: number
}

export default function JoinView({ studentId, name, initialCode }: { studentId: string; name: string; initialCode: string }) {
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [codeInput, setCodeInput] = useState(initialCode)
  const [joinedCode, setJoinedCode] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [inQueue, setInQueue] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!joinedCode) return
    const es = new EventSource(`/api/queue/stream?code=${joinedCode}`)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.ended) {
        setSessionEnded(true)
        setInQueue(false)
        setQueue([])
        setJoinedCode(null)
        es.close()
      } else {
        const q: QueueEntry[] = data
        setQueue(q)
        setInQueue(q.some(s => s.studentId === studentId))
      }
    }
    return () => es.close()
  }, [joinedCode, studentId])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/session')
    const { code } = await res.json()
    if (!code || code !== codeInput.trim()) {
      setError('Invalid class code. Ask your teacher for the correct code.')
      setLoading(false)
      return
    }
    setJoinedCode(codeInput.trim())
    setLoading(false)
  }

  async function handleRaiseHand(e: React.FormEvent) {
    e.preventDefault()
    if (!joinedCode) return
    setLoading(true)
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinedCode, topic: topic.trim() }),
    })
    if (!res.ok) setError('Could not join queue. The session may have ended.')
    setTopic('')
    setLoading(false)
  }

  async function handleLowerHand() {
    if (!joinedCode) return
    await fetch('/api/queue', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinedCode }),
    })
    setInQueue(false)
  }

  async function signOut() {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  const myPosition = queue.findIndex(s => s.studentId === studentId) + 1

  if (sessionEnded) return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl font-light tracking-widest mb-4">NextInLine</h1>
      <p className="text-zinc-500 text-sm tracking-wide mb-10">The class session has ended.</p>
      <button onClick={() => { setSessionEnded(false); setCodeInput('') }} className="border border-white/20 hover:border-white text-white text-xs tracking-widest uppercase px-10 py-3 transition-all duration-300 hover:bg-white hover:text-black">
        Join a New Session
      </button>
    </main>
  )

  if (!joinedCode) return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex justify-end mb-6">
        <button onClick={signOut} className="text-zinc-700 hover:text-white text-xs tracking-widest uppercase transition-colors">Sign out</button>
      </div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl font-light tracking-widest mb-2">NextInLine</h1>
      <p className="text-zinc-600 text-xs tracking-widest uppercase mb-1">Signed in as</p>
      <p className="text-zinc-300 text-sm mb-12">{name}</p>
      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-6">
        <div>
          <label className="block text-zinc-500 text-xs tracking-widest uppercase mb-2">Class Code</label>
          <input type="text" value={codeInput} onChange={e => setCodeInput(e.target.value)} placeholder="0000" className="w-full bg-transparent border border-white/20 text-white text-lg px-4 py-3 outline-none focus:border-white transition-colors tracking-widest text-center" maxLength={4} required />
        </div>
        {error && <p className="text-red-400 text-xs tracking-wide">{error}</p>}
        <button type="submit" disabled={loading || !codeInput.trim()} className="w-full border border-white/20 hover:border-white disabled:opacity-20 text-white text-xs tracking-widest uppercase py-4 transition-all duration-300 hover:bg-white hover:text-black">
          {loading ? 'Joining...' : 'Join Class'}
        </button>
      </form>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-6 pt-14">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl font-light tracking-widest mb-1">NextInLine</h1>
      <p className="text-zinc-600 text-xs tracking-widest uppercase mb-1">Welcome, <span className="text-zinc-300">{name}</span></p>
      <p className="text-zinc-700 text-xs tracking-widest mb-12">Code: {joinedCode}</p>

      {!inQueue ? (
        <form onSubmit={handleRaiseHand} className="w-full max-w-sm space-y-6 mb-10">
          <div>
            <label className="block text-zinc-500 text-xs tracking-widest uppercase mb-2">What do you need help with? <span className="text-zinc-700">(optional)</span></label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Question 3, fractions..." className="w-full bg-transparent border border-white/20 text-white px-4 py-3 outline-none focus:border-white transition-colors" maxLength={100} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full border border-white/20 hover:border-white disabled:opacity-20 text-white text-xs tracking-widest uppercase py-4 transition-all duration-300 hover:bg-white hover:text-black">
            Raise Hand
          </button>
        </form>
      ) : (
        <div className="w-full max-w-sm mb-10">
          <div className="border border-white/10 p-10 text-center mb-4">
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-3">Your Position</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-9xl font-light text-white">#{myPosition}</p>
            <p className="text-zinc-400 text-sm mt-3 tracking-wide">{name}</p>
            {myPosition === 1 && <p className="mt-4 text-white text-xs tracking-widest uppercase animate-pulse">You're next</p>}
          </div>
          <button onClick={handleLowerHand} className="w-full border border-white/10 hover:border-red-500 text-zinc-600 hover:text-red-500 text-xs tracking-widest uppercase py-3 transition-all duration-300">
            Lower Hand
          </button>
        </div>
      )}

      {queue.length > 0 && (
        <div className="w-full max-w-sm">
          <h2 className="text-zinc-700 text-xs uppercase tracking-widest mb-5">Queue — {queue.length}</h2>
          <ol className="space-y-4">
            {queue.map((s, i) => (
              <li key={s.studentId} className={`flex items-center gap-5 border-b border-white/5 pb-4 ${s.studentId === studentId ? 'opacity-100' : 'opacity-50'}`}>
                <span className="text-zinc-700 text-sm w-5">{i + 1}</span>
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-white text-xl font-light">{s.name}{s.studentId === studentId ? ' ·' : ''}</p>
                  {s.topic && <p className="text-zinc-600 text-xs mt-1">{s.topic}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </main>
  )
}
