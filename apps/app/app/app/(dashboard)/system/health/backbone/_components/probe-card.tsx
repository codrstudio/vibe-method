"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "./status-badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Database, Server, Brain, Cpu, HardDrive, Info } from "lucide-react"
import type { ProbeResult } from "../_hooks/use-pulse"

const probeConfig: Record<string, {
  icon: typeof Database
  title: string
  description: string
  latencyThreshold: number
  order: number
  detailsFormatter?: (details: Record<string, unknown>) => { label: string; value: string }[]
}> = {
  database: {
    icon: Database,
    title: "PostgreSQL",
    description: "Base de dados",
    latencyThreshold: 100,
    order: 1,
    detailsFormatter: (details) => {
      const pool = details.pool as Record<string, number> | undefined
      if (!pool) return []
      return [
        { label: "Conexões ativas", value: String(pool.active ?? 0) },
        { label: "Conexões idle", value: String(pool.idle ?? 0) },
        { label: "Aguardando", value: String(pool.waiting ?? 0) },
      ]
    },
  },
  redis: {
    icon: HardDrive,
    title: "Redis",
    description: "Serviço de caching",
    latencyThreshold: 50,
    order: 2,
    detailsFormatter: (details) => {
      const memory = details.memory as Record<string, unknown> | undefined
      if (!memory) return []
      return [
        { label: "Memória usada", value: String(memory.usedHuman ?? memory.used ?? "N/A") },
      ]
    },
  },
  whatsapp: {
    icon: Server,
    title: "WhatsApp",
    description: "Serviço de mensagens",
    latencyThreshold: 2000,
    order: 3,
  },
  "llm-sanity": {
    icon: Brain,
    title: "Saúde da LLM",
    description: "Componente de Acesso a LLMs",
    latencyThreshold: 5000,
    order: 4,
    detailsFormatter: (details) => {
      const result: { label: string; value: string }[] = []
      const bindings = details.bindings as { configured?: number } | undefined
      if (bindings?.configured !== undefined) {
        result.push({ label: "Vínculos", value: String(bindings.configured) })
      }
      const inference = details.inference as { model?: string; provider?: string } | undefined
      if (inference?.provider) {
        result.push({ label: "Provedor", value: String(inference.provider) })
      }
      return result
    },
  },
  llm: {
    icon: Brain,
    title: "OpenRouter",
    description: "Porta de LLMs remotas",
    latencyThreshold: 5000,
    order: 5,
    detailsFormatter: (details) => {
      const result: { label: string; value: string }[] = []
      if (details.credits) {
        const credits = details.credits as Record<string, unknown>
        result.push({ label: "Créditos", value: `$${Number(credits.remaining ?? 0).toFixed(2)}` })
      }
      if (details.model) {
        result.push({ label: "Modelo", value: String(details.model) })
      }
      return result
    },
  },
  ollama: {
    icon: Cpu,
    title: "Ollama",
    description: "Porta de LLMs locais",
    latencyThreshold: 1000,
    order: 6,
    detailsFormatter: (details) => {
      const result: { label: string; value: string }[] = []
      if (details.version) {
        result.push({ label: "Versão", value: String(details.version) })
      }
      if (details.modelsInstalled !== undefined) {
        result.push({ label: "Modelos", value: String(details.modelsInstalled) })
      }
      if (details.modelsLoaded !== undefined) {
        result.push({ label: "Em VRAM", value: String(details.modelsLoaded) })
      }
      return result
    },
  },
  knowledge: {
    icon: Server,
    title: "Arquivo",
    description: "Base de conhecimento",
    latencyThreshold: 500,
    order: 7,
    detailsFormatter: (details) => {
      const result: { label: string; value: string }[] = []
      if (details.documents !== undefined) {
        result.push({ label: "Documentos", value: String(details.documents) })
      }
      if (details.ftsEnabled !== undefined) {
        result.push({ label: "FTS", value: details.ftsEnabled ? "Ativo" : "Inativo" })
      }
      return result
    },
  },
}

const defaultConfig = {
  icon: Server,
  title: "",
  description: "Componente",
  latencyThreshold: 200,
  order: 99,
  detailsFormatter: () => [],
}

interface ProbeCardProps {
  probe: ProbeResult
}

export function getProbeOrder(probeName: string): number {
  return probeConfig[probeName]?.order ?? defaultConfig.order
}

function getLatencyColor(latency: number, threshold: number): string {
  const ratio = latency / threshold
  if (ratio <= 0.5) return "text-success"
  if (ratio <= 0.8) return "text-warning"
  return "text-critical"
}

function getLatencyPercentage(latency: number, threshold: number): number {
  return Math.min((latency / threshold) * 100, 100)
}

export function ProbeCard({ probe }: ProbeCardProps) {
  const config = probeConfig[probe.name] ?? defaultConfig
  const Icon = config.icon
  const status = probe.healthy ? "healthy" : "unhealthy"
  const details = config.detailsFormatter?.(probe.details ?? {}) ?? []

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      {/* Status indicator line */}
      <div className={`absolute left-0 top-0 h-full w-1 ${
        probe.healthy ? "bg-success" : "bg-critical"
      }`} />

      <CardHeader className="pb-2 pl-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${
              probe.healthy ? "bg-success/10" : "bg-critical/10"
            }`}>
              <Icon className={`size-4 ${
                probe.healthy ? "text-success" : "text-critical"
              }`} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{config.title || probe.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <StatusBadge status={status} showLabel={false} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pl-5">
        {/* Latency */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Latência</span>
            <span className={`font-medium ${getLatencyColor(probe.latency, config.latencyThreshold)}`}>
              {probe.latency.toFixed(1)}ms
            </span>
          </div>
          <Progress
            value={getLatencyPercentage(probe.latency, config.latencyThreshold)}
            className="h-1.5"
          />
          <p className="text-[10px] text-muted-foreground">
            Limite: {config.latencyThreshold}ms
          </p>
        </div>

        {/* Details */}
        {details.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {details.map((detail, idx) => (
              <div key={idx} className="rounded-md bg-muted/50 px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">{detail.label}</p>
                <p className="text-xs font-medium">{detail.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Message */}
        {probe.message && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3" />
                  <span className="truncate">{probe.message}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{probe.message}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
