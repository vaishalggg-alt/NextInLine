import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-6xl font-light tracking-widest mb-2">NextInLine</h1>
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-14">Classroom queue management</p>

      <div className="w-full max-w-sm space-y-4">
        <Link href="/teacher" className="block text-center border border-white/20 hover:border-white text-white text-xs tracking-widest uppercase px-8 py-4 transition-all hover:bg-white hover:text-black">
          I&apos;m the Teacher
        </Link>
        <Link href="/join" className="block text-center border border-white/10 hover:border-white text-zinc-500 hover:text-white text-xs tracking-widest uppercase px-8 py-4 transition-all">
          I&apos;m a Student
        </Link>
      </div>
    </main>
  )
}
