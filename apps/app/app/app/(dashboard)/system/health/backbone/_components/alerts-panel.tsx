"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./empty-state"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Monitor,
} from "lucide-react"
import type { AlertsData, AlertConfig, AlertEvent } from "../_hooks/use-pulse"

interface AlertsPanelProps {
  alerts: AlertsData | null
  loading: boolean
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return "Agora"
  if (diffMins < 60) return `${diffMins}m atrás`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h atrás`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d atrás`
}

function getConditionDescription(config: AlertConfig): string {
  const { condition } = config
  switch (condition.type) {
    case "probe.unhealthy":
      return `Probe "${condition.target}" fica unhealthy`
    case "probe.degraded":
      return `Probe "${condition.target}" fica degradado`
    case "metric.threshold":
      return `Métrica "${condition.target}" ${condition.operator} ${condition.value}`
    case "metric.change":
      return `Mudança em "${condition.target}"`
    default:
      return "Condição desconhecida"
  }
}

function ChannelIcon({ channel }: { channel: "ui" | "email" | "whatsapp" }) {
  switch (channel) {
    case "ui":
      return <Monitor className="size-3" />
    case "email":
      return <Mail className="size-3" />
    case "whatsapp":
      return <MessageSquare className="size-3" />
  }
}

function AlertConfigCard({ config }: { config: AlertConfig }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${
      config.enabled ? "bg-card" : "bg-muted/30 opacity-60"
    }`}>
      <div className={`rounded-lg p-2 ${
        config.enabled ? "bg-primary/10" : "bg-muted"
      }`}>
        {config.enabled ? (
          <Bell className="size-4 text-primary" />
        ) : (
          <BellOff className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{config.name}</p>
          <Badge variant={config.enabled ? "default" : "secondary"} className="text-[10px] px-1.5">
            {config.enabled ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        {config.description && (
          <p className="text-xs text-muted-foreground truncate">{config.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {getConditionDescription(config)}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <TooltipProvider>
            {config.channels.map((channel) => (
              <Tooltip key={channel}>
                <TooltipTrigger asChild>
                  <div className="rounded bg-muted p-1">
                    <ChannelIcon channel={channel} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">{channel}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
          <span className="text-[10px] text-muted-foreground">
            Cooldown: {config.cooldown}s
          </span>
        </div>
      </div>
    </div>
  )
}

function AlertEventCard({ event }: { event: AlertEvent }) {
  const isResolved = event.status === "resolved"
  const isTriggered = event.status === "triggered"

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${
      isTriggered ? "border-critical/30 bg-critical/5" :
      isResolved ? "border-success/30 bg-success/5" : "bg-card"
    }`}>
      <div className={`rounded-lg p-2 ${
        isTriggered ? "bg-critical/10" :
        isResolved ? "bg-success/10" : "bg-warning/10"
      }`}>
        {isTriggered ? (
          <AlertTriangle className="size-4 text-critical" />
        ) : isResolved ? (
          <CheckCircle className="size-4 text-success" />
        ) : (
          <Clock className="size-4 text-warning" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{event.alertName}</p>
          <Badge
            variant={isTriggered ? "destructive" : isResolved ? "default" : "secondary"}
            className="text-[10px] px-1.5 shrink-0"
          >
            {isTriggered ? "Ativo" : isResolved ? "Resolvido" : "Reconhecido"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>Disparado {formatTimeAgo(event.triggeredAt)}</span>
          {event.resolvedAt && (
            <>
              <span>•</span>
              <span>Resolvido {formatTimeAgo(event.resolvedAt)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          {event.channels.map((channel) => (
            <div key={channel} className="rounded bg-muted p-1">
              <ChannelIcon channel={channel} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AlertsPanel({ alerts, loading }: AlertsPanelProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!alerts) {
    return (
      <EmptyState
        icon={Bell}
        title="Sem dados de alertas"
        description="Não foi possível obter informações dos alertas configurados"
      />
    )
  }

  // Safe access with defaults
  const alertConfigs = alerts.alerts ?? []
  const alertEvents = alerts.events ?? []
  const activeEvents = alertEvents.filter((e) => e.status === "triggered")

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Configured Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Alertas Configurados</CardTitle>
            <Badge variant="outline">{alertConfigs.length}</Badge>
          </div>
          <CardDescription>Regras de monitoramento ativas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alertConfigs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Bell className="size-4 mr-2" />
              Nenhum alerta configurado
            </div>
          ) : (
            alertConfigs.map((config) => (
              <AlertConfigCard key={config.id} config={config} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Eventos Recentes</CardTitle>
            {activeEvents.length > 0 && (
              <Badge variant="destructive">{activeEvents.length} ativos</Badge>
            )}
          </div>
          <CardDescription>Histórico de alertas disparados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alertEvents.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <CheckCircle className="size-4 mr-2" />
              Nenhum evento recente
            </div>
          ) : (
            alertEvents.slice(0, 10).map((event) => (
              <AlertEventCard key={event.id} event={event} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
