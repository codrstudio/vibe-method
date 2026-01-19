"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "./status-badge"
import { EmptyState } from "./empty-state"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Brain,
  Cpu,
  CreditCard,
  Gauge,
  Layers,
  ChevronDown,
  Check,
  X,
  HardDrive,
} from "lucide-react"
import type { LLMHealth, OllamaModel, OllamaLoadedModel } from "../_hooks/use-pulse"
import { useState } from "react"

interface LLMPanelProps {
  llm: LLMHealth | null
  loading: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function OpenRouterCard({ openrouter }: { openrouter: LLMHealth["providers"]["openrouter"] }) {
  // Check for both null and undefined (API returns null when credits not available)
  const hasCredits = openrouter.credits && openrouter.credits.remaining != null
  const creditsPercent = openrouter.credits?.percentUsed ?? 0

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-1 ${
        openrouter.configured ? "bg-success" : "bg-critical"
      }`} />

      <CardHeader className="pb-3 pl-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${
              openrouter.configured ? "bg-success/10" : "bg-critical/10"
            }`}>
              <Brain className={`size-5 ${
                openrouter.configured ? "text-success" : "text-critical"
              }`} />
            </div>
            <div>
              <CardTitle className="text-base">OpenRouter</CardTitle>
              <CardDescription className="text-xs">API de LLMs na nuvem</CardDescription>
            </div>
          </div>
          <StatusBadge status={openrouter.configured ? "healthy" : "unhealthy"} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pl-5">
        {/* Config Status */}
        <div className="flex items-center gap-2 text-sm">
          {openrouter.configured ? (
            <>
              <Check className="size-4 text-success" />
              <span>API Key configurada</span>
            </>
          ) : (
            <>
              <X className="size-4 text-critical" />
              <span className="text-muted-foreground">API Key não configurada</span>
            </>
          )}
        </div>

        {openrouter.configured && (
          <>
            {/* Credits */}
            {hasCredits && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <span>Créditos</span>
                  </div>
                  <span className="font-semibold">
                    ${openrouter.credits!.remaining.toFixed(2)}
                    {openrouter.credits!.limit && (
                      <span className="text-muted-foreground font-normal">
                        {" "}/ ${openrouter.credits!.limit.toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
                {openrouter.credits!.limit && (
                  <Progress value={100 - creditsPercent} className="h-2" />
                )}
                {openrouter.isFreeTier && (
                  <Badge variant="secondary" className="text-xs">Free Tier</Badge>
                )}
              </div>
            )}

            {/* Rate Limit */}
            {openrouter.rateLimit && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rate Limit</span>
                </div>
                <span>{openrouter.rateLimit.requests} req/{openrouter.rateLimit.interval}</span>
              </div>
            )}

            {/* Default Model */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Modelo Padrão</span>
              </div>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">
                {openrouter.defaultModel}
              </code>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function OllamaCard({ ollama }: { ollama: LLMHealth["providers"]["ollama"] }) {
  const [modelsOpen, setModelsOpen] = useState(false)

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-1 ${
        ollama.available ? "bg-success" : "bg-muted"
      }`} />

      <CardHeader className="pb-3 pl-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${
              ollama.available ? "bg-success/10" : "bg-muted"
            }`}>
              <Cpu className={`size-5 ${
                ollama.available ? "text-success" : "text-muted-foreground"
              }`} />
            </div>
            <div>
              <CardTitle className="text-base">Ollama</CardTitle>
              <CardDescription className="text-xs">LLMs locais</CardDescription>
            </div>
          </div>
          <StatusBadge status={ollama.available ? "healthy" : "degraded"} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pl-5">
        {/* Availability Status */}
        <div className="flex items-center gap-2 text-sm">
          {ollama.available ? (
            <>
              <Check className="size-4 text-success" />
              <span>Disponível em {ollama.url}</span>
            </>
          ) : (
            <>
              <X className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Não disponível</span>
            </>
          )}
        </div>

        {ollama.available && (
          <>
            {/* Version */}
            {ollama.version && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Versão</span>
                <code className="rounded bg-muted px-2 py-0.5 text-xs">{ollama.version}</code>
              </div>
            )}

            {/* Models Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">{ollama.modelsInstalled ?? 0}</p>
                <p className="text-xs text-muted-foreground">Instalados</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">{ollama.modelsLoaded ?? 0}</p>
                <p className="text-xs text-muted-foreground">Em VRAM</p>
              </div>
            </div>

            {/* Models List (Collapsible) */}
            {ollama.models && ollama.models.length > 0 && (
              <Collapsible open={modelsOpen} onOpenChange={setModelsOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50">
                  <span>Ver modelos instalados</span>
                  <ChevronDown className={`size-4 transition-transform ${modelsOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {ollama.models.map((model: OllamaModel) => (
                    <div key={model.digest} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <HardDrive className="size-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs">{model.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatBytes(model.size)}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Loaded Models */}
            {ollama.loaded && ollama.loaded.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Carregados em VRAM</p>
                {ollama.loaded.map((model: OllamaLoadedModel) => (
                  <div key={model.digest} className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm">
                    <span className="font-mono text-xs">{model.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatBytes(model.sizeVram)} VRAM
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function LLMPanel({ llm, loading }: LLMPanelProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!llm) {
    return (
      <EmptyState
        icon={Brain}
        title="Sem dados de LLM"
        description="Não foi possível obter informações dos provedores de LLM"
      />
    )
  }

  // Check if providers exist
  const hasOpenRouter = llm.providers?.openrouter
  const hasOllama = llm.providers?.ollama

  if (!hasOpenRouter && !hasOllama) {
    return (
      <EmptyState
        icon={Brain}
        title="Sem provedores de LLM"
        description="Nenhum provedor de LLM está configurado"
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hasOpenRouter && <OpenRouterCard openrouter={llm.providers.openrouter} />}
      {hasOllama && <OllamaCard ollama={llm.providers.ollama} />}
    </div>
  )
}
