"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./empty-state"
import { ModuleCard } from "./module-card"
import { Activity } from "lucide-react"
import type { ModulesData } from "../_hooks/use-pulse"

interface MetricsPanelProps {
  modules: ModulesData | null
  loading: boolean
}

export function MetricsPanel({ modules, loading }: MetricsPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-36 sm:h-40 rounded-lg" />
        ))}
      </div>
    )
  }

  const hasModules = modules && Object.keys(modules.modules).length > 0

  if (!hasModules) {
    return (
      <EmptyState
        icon={Activity}
        title="Sem métricas"
        description="Nenhum módulo está reportando métricas ainda"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.values(modules.modules).map((module) => (
        <ModuleCard key={module.name} module={module} />
      ))}
    </div>
  )
}
