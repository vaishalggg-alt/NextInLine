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
      setError('Invalid class code. Ask your teacher for the correct code.')
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
    <main className="min-h-screen bg-gradient-to-br from-teal-900 to-emerald-800 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-extrabold text-teal-200 mb-4">NextInLine</h1>
      <p className="text-teal-300 text-xl">The class session has ended.</p>
      <button onClick={() => { setSessionEnded(false); setStudentInfo(null); setCodeInput(''); setNameInput('') }} className="mt-6 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-8 rounded-xl transition">Join a New Session</button>
    </main>
  )

  if (!studentInfo) return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900 to-emerald-800 text-white flex flex-col items-center justify-start p-6">
      <h1 className="text-4xl font-extrabold text-teal-200 mt-8 mb-2">NextInLine</h1>
      <p className="text-teal-400 mb-8">Join your class queue</p>
      <form onSubmit={handleRegister} className="bg-white/10 backdrop-blur rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <label className="block text-teal-200 font-semibold mb-2">Class Code</label>
        <input type="text" value={codeInput} onChange={e => setCodeInput(e.target.value)} placeholder="Enter 4-digit code..." className="w-full rounded-xl px-4 py-3 text-gray-900 text-lg mb-4 outline-none focus:ring-2 focus:ring-teal-400" maxLength={4} required />
        <label className="block text-teal-200 font-semibold mb-2">Your Name</label>
        <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Enter your name..." className="w-full rounded-xl px-4 py-3 text-gray-900 text-lg mb-6 outline-none focus:ring-2 focus:ring-teal-400" maxLength={50} required />
        {error && <p className="text-red-400 mb-3 text-sm">{error}</p>}
        <button type="submit" disabled={loading || !codeInput.trim() || !nameInput.trim()} className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold text-lg py-3 rounded-xl transition">{loading ? 'Joining...' : 'Join Class'}</button>
      </form>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900 to-emerald-800 text-white flex flex-col items-center justify-start p-6">
      <h1 className="text-4xl font-extrabold text-teal-200 mt-8 mb-1">NextInLine</h1>
      <p className="text-teal-400 mb-2">Welcome, <span className="font-semibold text-teal-200">{studentInfo.name}</span></p>
      <p className="text-teal-500 text-sm mb-8">Class code: <span className="font-mono text-teal-300">{studentInfo.sessionCode}</span></p>
      {!inQueue ? (
        <form onSubmit={handleRaiseHand} className="bg-white/10 backdrop-blur rounded-2xl p-8 w-full max-w-sm shadow-xl mb-6">
          <label className="block text-teal-200 font-semibold mb-2">What do you need help with? <span className="text-teal-400 font-normal">(optional)</span></label>
          <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Question 3, fractions..." className="w-full rounded-xl px-4 py-3 text-gray-900 text-lg mb-4 outline-none focus:ring-2 focus:ring-teal-400" maxLength={100} />
          {error && <p className="text-red-400 mb-3 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold text-lg py-3 rounded-xl transition">✋ Raise Hand</button>
        </form>
      ) : (
        <div className="w-full max-w-sm mb-6">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center shadow-xl mb-4">
            <p className="text-teal-300 text-sm uppercase tracking-widest mb-1">Your Position</p>
            <p className="text-8xl font-black text-white mb-2">#{myPosition}</p>
            <p className="text-teal-200 text-lg font-semibold">{studentInfo.name}</p>
            {myPosition === 1 && <p className="mt-3 text-yellow-300 font-bold animate-pulse">You're next!</p>}
          </div>
          <button onClick={handleLowerHand} className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition">Lower Hand</button>
        </div>
      )}
      {queue.length > 0 && (
        <div className="w-full max-w-sm bg-white/5 rounded-2xl p-5">
          <h2 className="text-teal-300 text-sm uppercase tracking-wide font-semibold mb-3">Queue ({queue.length})</h2>
          <ol className="space-y-2">
            {queue.map((s, i) => (
              <li key={s.studentId} className={`flex items-center gap-3 p-2 rounded-lg ${s.studentId === studentInfo.studentId ? 'bg-teal-700/50 font-bold' : ''}`}>
                <span className="w-7 h-7 rounded-full bg-teal-800 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <div>
                  <span className="text-white">{s.name}{s.studentId === studentInfo.studentId ? ' (you)' : ''}</span>
                  {s.topic && <p className="text-teal-400 text-xs">{s.topic}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </main>
  )
}
