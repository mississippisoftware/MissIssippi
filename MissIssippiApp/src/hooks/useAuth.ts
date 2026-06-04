import { create } from 'zustand'
import { api } from '../config/api'

const TOKEN_KEY = 'token'
const USER_KEY = 'auth_user'

interface AuthUser {
  email: string
  displayName: string
  role: string
}

function loadStoredUser(): AuthUser | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const raw = localStorage.getItem(USER_KEY)
  if (!token || !raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

interface AuthState {
  currentUser: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const useAuthStore = create<AuthState>(() => ({
  currentUser: loadStoredUser(),
  isAuthenticated: loadStoredUser() !== null,

  login: async (email: string, password: string) => {
    const response = await api.post<{
      success: boolean
      data: { token: string; email: string; displayName: string; role: string }
    }>('/auth/login', { email, password })

    const { token, email: userEmail, displayName, role } = response.data.data
    const user: AuthUser = { email: userEmail, displayName, role }
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    useAuthStore.setState({ currentUser: user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    useAuthStore.setState({ currentUser: null, isAuthenticated: false })
    window.location.href = '/login'
  },
}))

export function useAuth() {
  return useAuthStore()
}
