import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthSession } from './AuthContextStore'
import { api } from '../lib/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    function expireSession() {
      setSession(null)
    }
    window.addEventListener('session-expired', expireSession)
    return () => window.removeEventListener('session-expired', expireSession)
  }, [])

  async function login(email: string, password: string) {
    const token = await api.login(email, password)
    const user = await api.profile(token)
    setSession({ token, user })
  }

  async function register(email: string, password: string, fullName: string) {
    await api.register(email, password, fullName)
    await login(email, password)
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!session) throw new Error('You are not signed in.')
    const result = await api.changePassword(session.token, currentPassword, newPassword)
    const user = await api.profile(result.access_token)
    setSession({ token: result.access_token, user })
  }

  function logout() {
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, login, register, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
