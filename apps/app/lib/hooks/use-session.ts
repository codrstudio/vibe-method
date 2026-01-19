"use client"

import { useState, useEffect, useCallback } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: string
  image: string
}

export interface SessionData {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  mutate: () => Promise<void>
  logout: () => Promise<void>
}

export function useSession(): SessionData {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        setUser(null)
        if (response.status !== 401) {
          setError('Erro ao carregar sessao')
        }
        return
      }

      const data = await response.json()
      if (data.success && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (err) {
      setUser(null)
      setError('Erro de conexao')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Ignore errors
    }
    // Full page refresh to clear state and redirect
    window.location.href = '/'
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    mutate: fetchSession,
    logout,
  }
}
