"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "./status-badge"
import { Activity, Clock, Shield, AlertTriangle } from "lucide-react"
import type { PulseOverview as PulseOverviewData } from "../_hooks/use-pulse"

interface PulseOverviewProps {
  overview: PulseOverviewData | null
  loading: boolean
  error: string | null
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function PulseOverview({ overview, loading, error }: PulseOverviewProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 rounded-lg border p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!overview) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-muted-foreground" />
              Status Geral
            </CardTitle>
            <StatusBadge status="unhealthy" />
          </div>
          <CardDescription>
            {error
              ? "Não foi possível conectar ao Pulse"
              : "Aguardando dados..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Status", "Uptime", "Probes", "Alertas"].map((label) => (
              <div key={label} className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold text-muted-foreground/50">--</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const probesHealthy = overview.probes.healthy
  const probesTotal = overview.probes.total
  const probesPercentage = probesTotal > 0 ? (probesHealthy / probesTotal) * 100 : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Status Geral
          </CardTitle>
          <StatusBadge status={overview.status} />
        </div>
        <CardDescription>
          Última atualização: {new Date(overview.timestamp).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status Card */}
          <div className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${
                overview.status === "healthy" ? "bg-success" :
                overview.status === "degraded" ? "bg-warning" : "bg-critical"
              }`} />
              <p className="text-xs font-medium text-muted-foreground">Status</p>
            </div>
            <p className="text-2xl font-bold capitalize">
              {overview.status === "healthy" ? "Operacional" :
               overview.status === "degraded" ? "Degradado" : "Indisponível"}
            </p>
          </div>

          {/* Uptime Card */}
          <div className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Uptime</p>
            </div>
            <p className="text-2xl font-bold">{formatUptime(overview.uptime)}</p>
          </div>

          {/* Probes Card */}
          <div className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Shield className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Probes</p>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold">{probesHealthy}</p>
              <p className="text-sm text-muted-foreground">/ {probesTotal}</p>
            </div>
            <Progress value={probesPercentage} className="h-1" />
          </div>

          {/* Alerts Card */}
          <div className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Alertas Ativos</p>
            </div>
            <div className="flex items-baseline gap-1">
              <p className={`text-2xl font-bold ${overview.alerts.active > 0 ? "text-critical" : ""}`}>
                {overview.alerts.active}
              </p>
              <p className="text-sm text-muted-foreground">/ {overview.alerts.configured} configurados</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
