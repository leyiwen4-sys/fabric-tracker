import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken, getCookieName } from '@/lib/auth'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName())?.value

  if (!token) {
    redirect('/login')
  }

  const payload = await verifyToken(token)
  if (!payload) {
    redirect('/login')
  }

  return <>{children}</>
}
