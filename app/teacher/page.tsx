import { redirect } from 'next/navigation'
import { getSessionUser, isTeacherEmail } from '@/lib/auth'
import TeacherView from './TeacherView'

export default async function TeacherPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!(await isTeacherEmail(user.email))) redirect('/join')

  return <TeacherView teacherEmail={user.email!} />
}
