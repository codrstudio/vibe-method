'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from '@/lib/hooks/use-session'

interface UseTasksReturn {
  count: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const POLLING_INTERVAL = 30000 // 30 seconds

export function useTasks(): UseTasksReturn {
  const { isAuthenticated, isLoading: sessionLoading } = useSession()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/tasks/count', {
        credentials: 'include',
      })

      if (!res.ok) {
        if (res.status === 401) {
          setCount(0)
          setError(null)
          return
        }
        throw new Error('Failed to fetch task count')
      }

      const data = await res.json()
      setCount(data.data?.count ?? 0)
      setError(null)
    } catch (err) {
      console.error('Error fetching task count:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchCount()
  }, [fetchCount])

  useEffect(() => {
    if (sessionLoading) return

    fetchCount()

    if (isAuthenticated) {
      intervalRef.current = setInterval(fetchCount, POLLING_INTERVAL)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchCount, isAuthenticated, sessionLoading])

  return {
    count,
    loading: loading || sessionLoading,
    error,
    refresh,
  }
}
