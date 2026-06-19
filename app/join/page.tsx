'use client'
import { useEffect, useState } from 'react'

interface QueueEntry {
  studentId: string
  name: string
  topic: string
  joinedAt: number
}

interface StudentInfo {
  studentId: string
  name: string
  sessionCode: string
}

export default function JoinPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [sessionCode, setSessionCode] = useState<string | null>(null)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [topic, setTopic] = useState('')
  const [inQueue, setInQueue] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nextinline_student')
    if (saved) {
      const info: StudentInfo = JSON.parse(saved)
      setStudentInfo(info)
      setCodeInput(info.sessionCode)
    }
    fetch('/api/session').then(r => r.json()).then(d => setSessionCode(d.code))
  }, [])

  useEffect(() => {
    if (!studentInfo) return
    if (studentInfo.sessionCode !== sessionCode && sessionCode !== null) return
    const code = studentInfo.sessionCode
    const es = new EventSource(`/api/queue/stream?code=${code}`)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.ended) {
        setSessionEnded(true)
        setInQueue(false)
        setQueue([])
        localStorage.removeItem('nextinline_student')
        setStudentInfo(null)
        es.close()
      } else {
        const q: QueueEntry[] = data
        setQueue(q)
        setInQueue(q.some(s => s.studentId === studentInfo.studentId))
      }
    }
    return () => es.close()
  }, [studentInfo, sessionCode])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/session')
    const { code } = await res.json()
    if (!code || code !== codeInput.trim()) {
      setError('Invalid class code.')
      setLoading(false)
      return
    }
    const studentId = crypto.randomUUID()
    const info: StudentInfo = { studentId, name: nameInput.trim(), sessionCode: codeInput.trim() }
    localStorage.setItem('nextinline_student', JSON.stringify(info))
    setStudentInfo(info)
    setSessionCode(code)
    setLoading(false)
  }

  async function handleRaiseHand(e: React.FormEvent) {
    e.preventDefault()
    if (!studentInfo) return
    setLoading(true)
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: studentInfo.sessionCode, studentId: studentInfo.studentId, name: studentInfo.name, topic: topic.trim() }),
    })
    if (!res.ok) setError('Could not join queue. The session may have ended.')
    setTopic('')
    setLoading(false)
  }

  async function handleLowerHand() {
    if (!studentInfo) return
    await fetch('/api/queue', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: studentInfo.sessionCode, studentId: studentInfo.studentId }),
    })
    setInQueue(false)
  }

  const myPosition = studentInfo ? queue.findIndex(s => s.studentId === studentInfo.studentId) + 1 : 0

  if (sessionEnded) return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl font-light tracking-widest mb-4">NextInLine</h1>
      <p className="text-zinc-500 text-sm tracking-wide mb-10">The class session has ended.</p>
      <button onClick={() => { setSessionEnded(false); setStudentInfo(null); setCodeInput(''); setNameInput('') }} className="border border-white/20 hover:border-white text-white text-xs tracking-widest uppercase px-10 py-3 transition-all duration-300 hover:bg-white hover:text-black">
        Join a New Session
      </button>
    </main>
  )

  if (!studentInfo) return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl font-light tracking-widest mb-2">NextInLine</h1>
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-12">Join your class</p>
      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-6">
        <div>
          <label className="block text-zinc-500 text-xs tracking-widest uppercase mb-2">Class Code</label>
          <input type="text" value={codeInput} onChange={e => setCodeInput(e.target.value)} placeholder="0000" className="w-full bg-transparent border border-white/20 text-white text-lg px-4 py-3 outline-none focus:border-white transition-colors tracking-widest text-center" maxLength={4} required />
        </div>
        <div>
          <label className="block text-zinc-500 text-xs tracking-widest uppercase mb-2">Your Name</label>
          <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Enter your name" className="w-full bg-transparent border border-white/20 text-white text-lg px-4 py-3 outline-none focus:border-white transition-colors" maxLength={50} required />
        </div>
        {error && <p className="text-red-400 text-xs tracking-wide">{error}</p>}
        <button type="submit" disabled={loading || !codeInput.trim() || !nameInput.trim()} className="w-full border border-white/20 hover:border-white disabled:opacity-20 text-white text-xs tracking-widest uppercase py-4 transition-all duration-300 hover:bg-white hover:text-black">
          {loading ? 'Joining...' : 'Join Class'}
        </button>
      </form>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-6 pt-14">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl font-light tracking-widest mb-1">NextInLine</h1>
      <p className="text-zinc-600 text-xs tracking-widest uppercase mb-1">Welcome, <span className="text-zinc-300">{studentInfo.name}</span></p>
      <p className="text-zinc-700 text-xs tracking-widest mb-12">Code: {studentInfo.sessionCode}</p>

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
            <p className="text-zinc-400 text-sm mt-3 tracking-wide">{studentInfo.name}</p>
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
              <li key={s.studentId} className={`flex items-center gap-5 border-b border-white/5 pb-4 ${s.studentId === studentInfo.studentId ? 'opacity-100' : 'opacity-50'}`}>
                <span className="text-zinc-700 text-sm w-5">{i + 1}</span>
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-white text-xl font-light">{s.name}{s.studentId === studentInfo.studentId ? ' ·' : ''}</p>
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
