export type UserRole = 'user' | 'admin'

export type User = {
  id: number
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserPage = {
  items: User[]
  total: number
  skip: number
  limit: number
}

export type UserFilters = {
  q?: string
  role?: UserRole
  is_active?: boolean
  skip: number
  limit: number
}

type UserDraft = {
  email: string
  full_name: string
  role: UserRole
  password?: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

async function request<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body?.detail === 'string' ? body.detail : 'Something went wrong. Please try again.'
    if (response.status === 401 && token) window.dispatchEvent(new Event('session-expired'))
    throw new Error(detail)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  async login(email: string, password: string) {
    const response = await request<{ access_token: string }>('/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return response.access_token
  },

  register(email: string, password: string, full_name: string) {
    return request<User>('/auth/register', undefined, {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    })
  },

  profile(token: string) {
    return request<User>('/auth/me', token)
  },

  changePassword(token: string, current_password: string, new_password: string) {
    return request<{ access_token: string }>('/auth/change-password', token, {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    })
  },

  users(token: string, filters: UserFilters) {
    const params = new URLSearchParams({ skip: String(filters.skip), limit: String(filters.limit) })
    if (filters.q) params.set('q', filters.q)
    if (filters.role) params.set('role', filters.role)
    if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active))
    return request<UserPage>(`/users?${params}`, token)
  },

  createUser(token: string, user: UserDraft & { password: string }) {
    return request<User>('/users', token, { method: 'POST', body: JSON.stringify(user) })
  },

  updateUser(token: string, id: number, user: Partial<UserDraft> & { is_active?: boolean }) {
    return request<User>(`/users/${id}`, token, { method: 'PATCH', body: JSON.stringify(user) })
  },

  deactivateUser(token: string, id: number) {
    return request<User>(`/users/${id}`, token, { method: 'DELETE' })
  },
}