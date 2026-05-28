import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchUserProfile, loginUser } from '../services/api'

export interface AdminUser {
  id: number
  email: string
  role: 'student' | 'owner' | 'admin'
  is_active: boolean
  is_verified: boolean
}

interface AuthContextType {
  user: AdminUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AdminUser>
  logout: () => void
}

const TOKEN_KEY = 'admin_token'
const ROLE_KEY = 'admin_role'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY)

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const profile = await fetchUserProfile()
        if (profile.role !== 'admin') {
          throw new Error('Admin access required')
        }

        setUser(profile)
      } catch (error) {
        console.error('Failed to restore admin session:', error)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(ROLE_KEY)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = async (email: string, password: string) => {
    const result = await loginUser(email, password)

    if (result.role && result.role !== 'admin') {
      throw new Error('Access denied. Admin accounts only.')
    }

    localStorage.setItem(TOKEN_KEY, result.access_token)
    localStorage.setItem(ROLE_KEY, result.role || 'admin')

    const profile = await fetchUserProfile()
    if (profile.role !== 'admin') {
      logout()
      throw new Error('Access denied. Admin accounts only.')
    }

    setUser(profile)
    return profile
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}