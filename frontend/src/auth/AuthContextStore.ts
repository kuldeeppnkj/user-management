import { createContext } from 'react'
import type { User } from '../lib/api'

export type AuthSession = {
  token: string
  user: User
}

export type AuthContextValue = {
  session: AuthSession | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)