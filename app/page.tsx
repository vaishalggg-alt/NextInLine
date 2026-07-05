import { redirect } from 'next/navigation'
import { getSessionUser, isTeacherEmail } from '@/lib/auth'

export default async function Home() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const teacher = await isTeacherEmail(user.email)
  redirect(teacher ? '/teacher' : '/join')
}
