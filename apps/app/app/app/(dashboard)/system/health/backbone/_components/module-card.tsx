"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StatusBadge } from "./status-badge"
import {
  Layers,
  Zap,
  Bot,
  FileSearch,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  Bell,
} from "lucide-react"
import type { ModuleHealth } from "../_hooks/use-pulse"

const moduleConfig: Record<string, {
  icon: typeof Layers
  description: string
  bgClass: string
  iconClass: string
}> = {
  infrastructure: {
    icon: Layers,
    description: "Core infrastructure services",
    bgClass: "bg-blue-500/10",
    iconClass: "text-blue-600",
  },
  services: {
    icon: Bell,
    description: "Application services",
    bgClass: "bg-purple-500/10",
    iconClass: "text-purple-600",
  },
  agents: {
    icon: Bot,
    description: "AI agents & workflows",
    bgClass: "bg-green-500/10",
    iconClass: "text-green-600",
  },
  actions: {
    icon: Zap,
    description: "Action registry & execution",
    bgClass: "bg-orange-500/10",
    iconClass: "text-orange-600",
  },
  knowledge: {
    icon: FileSearch,
    description: "Knowledge base & RAG",
    bgClass: "bg-cyan-500/10",
    iconClass: "text-cyan-600",
  },
}

const defaultConfig = {
  icon: Layers,
  description: "System module",
  bgClass: "bg-gray-500/10",
  iconClass: "text-gray-600",
}

interface ModuleCardProps {
  module: ModuleHealth
}

function formatMetricValue(value: unknown): string {
  if (typeof value === "number") {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    if (Number.isInteger(value)) return value.toString()
    return value.toFixed(2)
  }
  return String(value)
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

export function ModuleCard({ module }: ModuleCardProps) {
  const config = moduleConfig[module.name] ?? defaultConfig
  const Icon = config.icon
  const errorCount = module.errors.reduce((sum, e) => sum + e.count, 0)
  const metricEntries = Object.entries(module.metrics).slice(0, 4) // Show max 4 metrics

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      {/* Status indicator line */}
      <div className={`absolute left-0 top-0 h-full w-1 ${
        module.status === "healthy" ? "bg-success" :
        module.status === "degraded" ? "bg-warning" : "bg-critical"
      }`} />

      <CardHeader className="pb-3 pl-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${config.bgClass}`}>
              <Icon className={`size-4 ${config.iconClass}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold capitalize">{module.name}</CardTitle>
              <CardDescription className="text-xs">{config.description}</CardDescription>
            </div>
          </div>
          <StatusBadge status={module.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pl-5">
        {/* Metrics Grid */}
        {metricEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {metricEntries.map(([key, value]) => (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 rounded-md bg-muted/50 p-2">
                      <p className="text-[10px] font-medium text-muted-foreground truncate">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatMetricValue(value)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">{key}: {String(value)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {metricEntries.length === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <Activity className="size-3" />
            <span>No metrics collected yet</span>
          </div>
        )}

        <Separator />

        {/* Footer with errors and timestamp */}
        <div className="flex items-center justify-between">
          {errorCount > 0 ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="gap-1 cursor-help">
                    <AlertTriangle className="size-3" />
                    {errorCount} error{errorCount !== 1 ? "s" : ""}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    {module.errors.slice(0, 3).map((error, i) => (
                      <p key={i} className="text-xs">
                        <span className="font-medium">{error.type}:</span> {error.count}x
                        {error.lastMessage && (
                          <span className="text-muted-foreground"> - {error.lastMessage}</span>
                        )}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="size-3" />
              No errors
            </Badge>
          )}

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            {formatTimestamp(module.lastUpdated)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
