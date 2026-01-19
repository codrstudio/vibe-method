"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import {
  Activity,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Database,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Cpu,
  HardDrive,
  Layers,
} from "lucide-react"

import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// Types
type Status = "healthy" | "degraded" | "unhealthy"

interface ServerStats {
  nodeVersion: string
  platform: string
  environment: string
  memory: {
    heapUsed: number
    heapTotal: number
    rss: number
  }
  cpu: number
}

interface BackboneHealth {
  status: Status
  timestamp: string
  uptime: number
  version: string
  server?: ServerStats
  components: Record<string, { status: Status; latency?: number }>
}

interface RealtimeHealth {
  connected: boolean
  connections?: number
  rooms?: number
}

// Constants - usa API routes do Next.js como proxy
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8001"

// Helpers
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getOverallStatus(backbone: BackboneHealth | null, realtime: RealtimeHealth): Status {
  if (!backbone) return "unhealthy"
  if (backbone.status === "unhealthy" || !realtime.connected) return "unhealthy"
  if (backbone.status === "degraded") return "degraded"
  return "healthy"
}

const statusConfig: Record<Status, { icon: typeof CheckCircle; label: string; color: string; bg: string }> = {
  healthy: {
    icon: CheckCircle,
    label: "Operacional",
    color: "text-success",
    bg: "bg-success",
  },
  degraded: {
    icon: AlertCircle,
    label: "Degradado",
    color: "text-warning",
    bg: "bg-warning",
  },
  unhealthy: {
    icon: XCircle,
    label: "Indisponível",
    color: "text-critical",
    bg: "bg-critical",
  },
}

export default function SystemHealthPage() {
  const [backbone, setBackbone] = useState<BackboneHealth | null>(null)
  const [realtime, setRealtime] = useState<RealtimeHealth>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      // Fetch backbone health via Pulse API
      const pulseRes = await fetch('/api/system/pulse')
      if (pulseRes.ok) {
        const data = await pulseRes.json()
        // Adapta o formato do Pulse para o formato esperado pelo componente
        setBackbone({
          status: data.status,
          timestamp: data.timestamp,
          uptime: data.uptime,
          version: "1.0.0",
          components: {},
          server: data.server,
        })
      } else {
        setBackbone(null)
      }
    } catch {
      setBackbone(null)
    }

    try {
      // Fetch realtime health (simpler check)
      const realtimeRes = await fetch(`${SOCKET_URL}/health`, {
        signal: AbortSignal.timeout(3000),
      })
      if (realtimeRes.ok) {
        const data = await realtimeRes.json()
        setRealtime({
          connected: true,
          connections: data.connections,
          rooms: data.rooms,
        })
      } else {
        setRealtime({ connected: false })
      }
    } catch {
      setRealtime({ connected: false })
    }

    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 15000) // Poll every 15s
    return () => clearInterval(interval)
  }, [fetchHealth])

  const overallStatus = getOverallStatus(backbone, realtime)
  const StatusIcon = statusConfig[overallStatus].icon

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <BreadcrumbBar
        items={[
          { label: "Dashboard", href: "/app" },
          { label: "Sistema", href: "/app/system" },
        ]}
        currentPage="Status do Sistema"
        onRefresh={fetchHealth}
        actions={
          <>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </>
        }
        mobileActions={
          <DropdownMenuItem onClick={fetchHealth} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </DropdownMenuItem>
        }
      />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 md:gap-6 p-3 md:p-4">
        {/* Page Title */}
        <div className="flex items-center gap-2">
          <Activity className="size-5 md:size-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Status do Sistema</h1>
      </div>

      {/* Server Stats Bar */}
      {backbone?.server && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-xs md:text-sm">
          <div className="flex items-center gap-1.5">
            <HardDrive className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Memory:</span>
            <span className="font-medium">
              {backbone.server.memory.heapUsed}MB
              <span className="text-muted-foreground">/{backbone.server.memory.heapTotal}MB</span>
            </span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Cpu className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">CPU:</span>
            <span className="font-medium">{backbone.server.cpu}%</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Uptime:</span>
            <span className="font-medium">{formatUptime(backbone.uptime)}</span>
          </div>
          <div className="hidden md:block h-4 w-px bg-border" />
          <div className="hidden md:flex items-center gap-1.5">
            <Layers className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Node:</span>
            <span className="font-medium">{backbone.server.nodeVersion}</span>
          </div>
          <div className="hidden lg:block h-4 w-px bg-border" />
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-muted-foreground">Env:</span>
            <span className={`font-medium ${
              backbone.server.environment === "production"
                ? "text-success"
                : backbone.server.environment === "staging"
                  ? "text-warning"
                  : "text-muted-foreground"
            }`}>
              {backbone.server.environment}
            </span>
          </div>
        </div>
      )}

      {/* Overall Status Card */}
      <Card className="relative overflow-hidden">
        <div className={`absolute left-0 top-0 h-full w-1.5 ${statusConfig[overallStatus].bg}`} />
        <CardHeader className="pb-2 pl-4 md:pl-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg">Status Geral</CardTitle>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <Badge
                variant="outline"
                className={`gap-1.5 ${statusConfig[overallStatus].color} border-current/20 bg-current/10`}
              >
                <StatusIcon className="size-3.5" />
                {statusConfig[overallStatus].label}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs md:text-sm">
            Monitoramento consolidado de todos os serviços
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-4 md:pl-6">
          {loading ? (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 md:h-16" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 md:gap-3 rounded-lg border bg-card p-2 md:p-3">
                <div className={`rounded-lg p-1.5 md:p-2 ${backbone ? "bg-success/10" : "bg-critical/10"}`}>
                  <Server className={`size-3.5 md:size-4 ${backbone ? "text-success" : "text-critical"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-muted-foreground">Backbone</p>
                  <p className="text-sm md:text-base font-semibold truncate">{backbone ? "Online" : "Offline"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 rounded-lg border bg-card p-2 md:p-3">
                <div className={`rounded-lg p-1.5 md:p-2 ${realtime.connected ? "bg-success/10" : "bg-critical/10"}`}>
                  {realtime.connected ? (
                    <Wifi className="size-3.5 md:size-4 text-success" />
                  ) : (
                    <WifiOff className="size-3.5 md:size-4 text-critical" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-muted-foreground">Realtime</p>
                  <p className="text-sm md:text-base font-semibold truncate">{realtime.connected ? "Live" : "Off"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 rounded-lg border bg-card p-2 md:p-3">
                <div className="rounded-lg bg-muted p-1.5 md:p-2">
                  <Clock className="size-3.5 md:size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-muted-foreground">Uptime</p>
                  <p className="text-sm md:text-base font-semibold truncate">{backbone ? formatUptime(backbone.uptime) : "--"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 rounded-lg border bg-card p-2 md:p-3">
                <div className="rounded-lg bg-muted p-1.5 md:p-2">
                  <Users className="size-3.5 md:size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs text-muted-foreground">Conexões</p>
                  <p className="text-sm md:text-base font-semibold truncate">{realtime.connections ?? "--"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subsystems Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
        {/* Backbone Card */}
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <div className={`absolute left-0 top-0 h-full w-1 ${
            backbone?.status === "healthy" ? "bg-success" :
            backbone?.status === "degraded" ? "bg-warning" : "bg-critical"
          }`} />
          <CardHeader className="pl-4 md:pl-5 pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`rounded-lg p-1.5 md:p-2 ${
                  backbone?.status === "healthy" ? "bg-success/10" :
                  backbone?.status === "degraded" ? "bg-warning/10" : "bg-critical/10"
                }`}>
                  <Server className={`size-4 md:size-5 ${
                    backbone?.status === "healthy" ? "text-success" :
                    backbone?.status === "degraded" ? "text-warning" : "text-critical"
                  }`} />
                </div>
                <div>
                  <CardTitle className="text-sm md:text-base">Backbone</CardTitle>
                  <CardDescription className="text-[10px] md:text-xs">Backend e APIs</CardDescription>
                </div>
              </div>
              {backbone && (
                <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">
                  v{backbone.version}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pl-4 md:pl-5">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : backbone ? (
              <>
                <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                  {Object.entries(backbone.components).slice(0, 4).map(([name, comp]) => (
                    <div key={name} className="flex items-center gap-1.5 text-xs md:text-sm">
                      <div className={`size-1.5 md:size-2 rounded-full shrink-0 ${
                        comp.status === "healthy" ? "bg-success" :
                        comp.status === "degraded" ? "bg-warning" : "bg-critical"
                      }`} />
                      <span className="capitalize truncate">{name}</span>
                      {comp.latency && (
                        <span className="text-[10px] md:text-xs text-muted-foreground shrink-0">{comp.latency.toFixed(0)}ms</span>
                      )}
                    </div>
                  ))}
                </div>
                <Link
                  href="/app/system/health/backbone"
                  className="flex items-center gap-1 text-xs md:text-sm text-primary hover:underline"
                >
                  Ver detalhes <ArrowRight className="size-3" />
                </Link>
              </>
            ) : (
              <p className="text-xs md:text-sm text-muted-foreground">
                Não foi possível conectar ao backbone
              </p>
            )}
          </CardContent>
        </Card>

        {/* Realtime Card */}
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <div className={`absolute left-0 top-0 h-full w-1 ${
            realtime.connected ? "bg-success" : "bg-critical"
          }`} />
          <CardHeader className="pl-4 md:pl-5 pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`rounded-lg p-1.5 md:p-2 ${
                  realtime.connected ? "bg-success/10" : "bg-critical/10"
                }`}>
                  {realtime.connected ? (
                    <Wifi className="size-4 md:size-5 text-success" />
                  ) : (
                    <WifiOff className="size-4 md:size-5 text-critical" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-sm md:text-base">Realtime</CardTitle>
                  <CardDescription className="text-[10px] md:text-xs">WebSocket</CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`gap-1 text-[10px] md:text-xs shrink-0 ${
                  realtime.connected
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-critical/10 text-critical border-critical/20"
                }`}
              >
                {realtime.connected ? "Live" : "Offline"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pl-4 md:pl-5">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : realtime.connected ? (
              <>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 md:size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Conexões</p>
                      <p className="text-base md:text-lg font-semibold">{realtime.connections ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="size-3.5 md:size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Rooms</p>
                      <p className="text-base md:text-lg font-semibold">{realtime.rooms ?? 0}</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/app/system/health/realtime"
                  className="flex items-center gap-1 text-xs md:text-sm text-primary hover:underline"
                >
                  Ver detalhes <ArrowRight className="size-3" />
                </Link>
              </>
            ) : (
              <p className="text-xs md:text-sm text-muted-foreground">
                Serviço indisponível
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      </div>
    </div>
  )
}
