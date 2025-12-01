'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import jwtDecode from "jwt-decode"
import { LogoutService } from "@/core/user"
import { useRouter } from "next/navigation"

type User = {
  id: string
  username?: string
  fullname?: string
  employee_id?: string
  role?: "employee" | "hr_admin" | "team_lead"
  positions?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean // Add loading state
  login: (access_token: string, refresh_token?: string, user?: User) => Promise<void>
  logout: () => Promise<void> // Make logout async
}

interface JwtPayload {
  sub: string // change to number if your backend uses numeric IDs
  exp?: number
  iat?: number
  role?: string
  email?: string
}

// ✅ createContext is a value, not a namespace
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Add loading state
  const router = useRouter()
  useEffect(() => {
    // Check auth status from API route instead of reading cookies directly
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include' // Important: include cookies in request
        })

        if (res.ok) {
          const data = await res.json()

          if (data.authenticated && data.user) {
            setUser(data.user)
          } else {
            // Not authenticated -> just clear user.
            // Redirects are handled by middleware and server components.
            setUser(null)
          }
        } else {
          // API error -> treat as unauthenticated, but don't redirect here
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const login = async (access_token: string, refresh_token?: string, u?: User) => {
    // Call API route to set httpOnly cookies
    try {
      const cookieRes = await fetch('/api/auth/set-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies in request
        body: JSON.stringify({
          access_token,
          refresh_token,
          user: u
        })
      })

      if (!cookieRes.ok) {
        throw new Error('Failed to set authentication cookies')
      }

      // Update local state
      if (u) {
        setUser(u)
      } else {
        // Fallback: decode JWT if user object not provided
        const validRoles = ["employee", "hr_admin", "team_lead"] as const
        type ValidRole = (typeof validRoles)[number]

        try {
          const payload = jwtDecode<JwtPayload>(access_token)

          const role = validRoles.includes(payload.role as ValidRole)
            ? (payload.role as ValidRole)
            : undefined

          const decodedUser: User = {
            id: payload.sub,
            role
          }
          setUser(decodedUser)
        } catch (error) {
          console.error('Failed to decode token:', error)
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error // Re-throw to handle in the login form
    }
  }

  const logout = async () => {
    try {
      // Call API route to clear httpOnly cookies
      await LogoutService()
      await fetch('/api/auth/clear-cookies', {
        method: 'POST',
        credentials: 'include'
      })

    } catch (error) {
      console.error('Logout error:', error)
      // Continue with logout even if API call fails
    } finally {
      // Clear local state
      setUser(null)

      // Hard redirect to ensure SSR picks up cleared cookies
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )

}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}