"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// ============================================================================
// Types
// ============================================================================

export type HealthStatus = "healthy" | "degraded" | "unhealthy"

export interface ProbeResult {
  name: string
  healthy: boolean
  latency: number
  message?: string
  details?: Record<string, unknown>
}

export interface PulseOverview {
  timestamp: string
  status: HealthStatus
  uptime: number
  probes: {
    total: number
    healthy: number
    degraded: number
    unhealthy: number
  }
  alerts: {
    active: number
    configured: number
  }
}

export interface OpenRouterDetails {
  baseUrl: string
  defaultModel: string
  configured: boolean
  credits?: {
    remaining: number
    limit: number | null
    percentUsed: number | null
  }
  usage?: { total: number }
  isFreeTier?: boolean
  rateLimit?: { requests: number; interval: string }
}

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modifiedAt: string
}

export interface OllamaLoadedModel {
  name: string
  size: number
  sizeVram: number
  digest: string
  expiresAt: string
}

export interface OllamaDetails {
  available: boolean
  url: string
  version?: string
  modelsInstalled?: number
  modelsLoaded?: number
  models?: OllamaModel[]
  loaded?: OllamaLoadedModel[]
  config?: {
    maxParams: string
    allowedQuants: string[]
  }
}

export interface LLMHealth {
  status: HealthStatus
  providers: {
    openrouter: OpenRouterDetails
    ollama: OllamaDetails
  }
}

export interface ModuleHealth {
  name: string
  status: HealthStatus
  metrics: Record<string, unknown>
  errors: Array<{
    type: string
    count: number
    lastOccurred: string
    lastMessage?: string
  }>
  lastUpdated: string
}

export interface ModulesData {
  timestamp: string
  modules: Record<string, ModuleHealth>
}

export interface AlertCondition {
  type: "probe.unhealthy" | "probe.degraded" | "metric.threshold" | "metric.change"
  target: string
  operator?: "gt" | "gte" | "lt" | "lte" | "eq" | "ne"
  value?: number
  duration?: number
}

export interface AlertConfig {
  id: string
  name: string
  description?: string
  condition: AlertCondition
  channels: ("ui" | "email" | "whatsapp")[]
  recipients?: string[]
  cooldown: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AlertEvent {
  id: string
  alertId: string
  alertName: string
  condition: AlertCondition
  triggeredAt: string
  resolvedAt?: string
  channels: ("ui" | "email" | "whatsapp")[]
  status: "triggered" | "resolved" | "acknowledged"
  details?: Record<string, unknown>
}

export interface AlertsData {
  alerts: AlertConfig[]
  events: AlertEvent[]
}

export interface UsePulseReturn {
  overview: PulseOverview | null
  probes: ProbeResult[]
  llm: LLMHealth | null
  modules: ModulesData | null
  alerts: AlertsData | null
  loading: boolean
  error: string | null
  isConnected: boolean
  lastUpdate: Date | null
  refresh: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function usePulse(): UsePulseReturn {
  const [overview, setOverview] = useState<PulseOverview | null>(null)
  const [probes, setProbes] = useState<ProbeResult[]>([])
  const [llm, setLlm] = useState<LLMHealth | null>(null)
  const [modules, setModules] = useState<ModulesData | null>(null)
  const [alerts, setAlerts] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const retryCount = useRef(0)
  const maxRetries = 3

  const fetchData = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      retryCount.current = 0
    }

    try {
      // Fetch all endpoints in parallel
      const [overviewRes, probesRes, llmRes, modulesRes, alertsRes] = await Promise.all([
        fetch("/api/system/pulse"),
        fetch("/api/system/pulse/probes/deep"),
        fetch("/api/system/pulse/llm"),
        fetch("/api/system/pulse/modules"),
        fetch("/api/system/pulse/alerts"),
      ])

      // Overview (required)
      if (overviewRes.ok) {
        const data = await overviewRes.json()
        setOverview(data)
      } else {
        throw new Error("Falha ao obter overview do Pulse")
      }

      // Probes (required)
      // API returns: { probes: [...] }
      if (probesRes.ok) {
        const data = await probesRes.json()
        setProbes(data.probes || [])
      }

      // LLM (optional)
      // API returns: { openrouter: {...}, ollama: {...} }
      // We need: { providers: { openrouter, ollama } }
      if (llmRes.ok) {
        const data = await llmRes.json()
        setLlm({
          status: data.summary?.status || "healthy",
          providers: {
            openrouter: data.openrouter ? {
              baseUrl: "https://openrouter.ai/api/v1",
              defaultModel: "google/gemini-2.0-flash-001",
              configured: true,
              credits: data.openrouter.credits,
              isFreeTier: false,
              rateLimit: { requests: -1, interval: "10s" },
            } : { baseUrl: "", defaultModel: "", configured: false },
            ollama: data.ollama ? {
              available: data.ollama.status === "healthy",
              url: "http://localhost:8056",
              version: data.ollama.version,
              modelsInstalled: data.ollama.models?.installed ?? 0,
              modelsLoaded: data.ollama.models?.loaded ?? 0,
              models: [],
              loaded: [],
            } : { available: false, url: "" },
          },
        })
      }

      // Modules (optional - endpoint may not exist)
      if (modulesRes.ok) {
        const data = await modulesRes.json()
        setModules(data)
      }

      // Alerts (optional)
      // API returns: { alerts: [...], recentEvents: [...] }
      // We need: { alerts: [...], events: [...] }
      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts({
          alerts: data.alerts || [],
          events: data.recentEvents || [],
        })
      }

      setError(null)
      setIsConnected(true)
      setLastUpdate(new Date())
      retryCount.current = 0
    } catch (err) {
      setIsConnected(false)
      setError(err instanceof Error ? err.message : "Erro desconhecido")

      // Auto-retry
      if (retryCount.current < maxRetries) {
        retryCount.current++
        setTimeout(() => fetchData(true), 2000 * retryCount.current)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchData])

  return {
    overview,
    probes,
    llm,
    modules,
    alerts,
    loading,
    error,
    isConnected,
    lastUpdate,
    refresh,
  }
}
