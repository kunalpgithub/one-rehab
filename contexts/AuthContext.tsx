import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user metadata (name, role, etc.)
          const userMetadata = session.user.user_metadata
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: userMetadata?.name || userMetadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: userMetadata?.role || 'user'
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userMetadata = session.user.user_metadata
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: userMetadata?.name || userMetadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: userMetadata?.role || 'user'
          })
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        const userMetadata = data.user.user_metadata
        const loggedInUser = {
          id: data.user.id,
          email: data.user.email || '',
          name: userMetadata?.name || userMetadata?.full_name || data.user.email?.split('@')[0] || 'User',
          role: userMetadata?.role || 'user'
        }
        setUser(loggedInUser)
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  const loginWithGoogle = async () => {
    try {
      // Get the current origin (works for both dev and production)
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/dashboard`
        : '/dashboard'

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) {
        throw error
      }
      // Note: User will be redirected to Google, then back to the app
      // The auth state change listener will handle updating the user state
    } catch (error: any) {
      console.error('Google login error:', error)
      throw new Error(error.message || 'Google login failed')
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      setUser(null)
      router.push('/login')
    } catch (error: any) {
      console.error('Logout error:', error)
      throw new Error(error.message || 'Logout failed')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}