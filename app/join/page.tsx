import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import JoinView from './JoinView'

export default async function JoinPage({ searchParams }: { searchParams: { code?: string } }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const name = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email || 'Student'

  return <JoinView studentId={user.id} name={name} initialCode={searchParams.code || ''} />
}
