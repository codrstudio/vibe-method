"use client"

import { RefreshCw, Server, Brain, Activity, Bell, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePulse } from "./_hooks/use-pulse"
import { PulseOverview } from "./_components/pulse-overview"
import { ProbeCard } from "./_components/probe-card"
import { LLMPanel } from "./_components/llm-panel"
import { MetricsPanel } from "./_components/metrics-panel"
import { AlertsPanel } from "./_components/alerts-panel"
import { EmptyState } from "./_components/empty-state"

export default function InfrastructurePage() {
  const { overview, probes, llm, modules, alerts, loading, error, refresh, lastUpdate } = usePulse()

  const hasProbes = probes && probes.length > 0
  const activeAlerts = alerts?.events.filter((e) => e.status === "triggered").length ?? 0

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <BreadcrumbBar
        items={[
          { label: "Dashboard", href: "/app" },
          { label: "Health", href: "/app/system/health" },
        ]}
        currentPage="Infraestrutura"
        actions={
          <>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                    <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline ml-2">Atualizar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar dados (polling a cada 10s)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        }
        mobileActions={
          <DropdownMenuItem onClick={refresh} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </DropdownMenuItem>
        }
      />

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-4 md:gap-6 p-3 md:p-4">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Infraestrutura</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Backend, APIs e componentes
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 rounded-lg border border-critical/50 bg-critical/5 p-3 md:p-4">
            <div className="rounded-full bg-critical/10 p-2 shrink-0">
              <Server className="size-4 md:size-5 text-critical" />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <p className="font-medium text-critical text-sm md:text-base">Erro de Conexão</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {error === "Falha ao obter overview do Pulse"
                  ? "Não foi possível conectar ao Pulse. Verifique se o backbone está ativo."
                  : error}
              </p>
              <div className="pt-2">
                <code className="rounded bg-muted px-2 py-1 text-[10px] md:text-xs break-all">
                  BACKBONE_URL=http://localhost:8002
                </code>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="shrink-0">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Pulse Overview Card */}
        <PulseOverview overview={overview} loading={loading} error={error} />

        {/* Tabs */}
        <Tabs defaultValue="probes" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="probes" className="gap-1.5 text-xs sm:text-sm">
              <Shield className="size-3.5 sm:size-4" />
              <span className="hidden xs:inline">Probes</span>
              <span className="xs:hidden">Probes</span>
              {hasProbes && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {probes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="llm" className="gap-1.5 text-xs sm:text-sm">
              <Brain className="size-3.5 sm:size-4" />
              <span className="hidden xs:inline">LLM</span>
              <span className="xs:hidden">LLM</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1.5 text-xs sm:text-sm">
              <Activity className="size-3.5 sm:size-4" />
              <span className="hidden xs:inline">Métricas</span>
              <span className="xs:hidden">Métr.</span>
              {modules && Object.keys(modules.modules).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {Object.keys(modules.modules).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5 text-xs sm:text-sm">
              <Bell className="size-3.5 sm:size-4" />
              <span className="hidden xs:inline">Alertas</span>
              <span className="xs:hidden">Alert.</span>
              {activeAlerts > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {activeAlerts}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Probes */}
          <TabsContent value="probes" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
            ) : hasProbes ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {probes.map((probe) => (
                  <ProbeCard key={probe.name} probe={probe} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Shield}
                title="Sem Probes"
                description={error
                  ? "Conecte ao Pulse para ver o status dos probes"
                  : "Nenhum probe está sendo monitorado"}
              />
            )}
          </TabsContent>

          {/* Tab: LLM */}
          <TabsContent value="llm" className="space-y-4">
            <LLMPanel llm={llm} loading={loading} />
          </TabsContent>

          {/* Tab: Metrics */}
          <TabsContent value="metrics" className="space-y-4">
            <MetricsPanel modules={modules} loading={loading} />
          </TabsContent>

          {/* Tab: Alerts */}
          <TabsContent value="alerts" className="space-y-4">
            <AlertsPanel alerts={alerts} loading={loading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
