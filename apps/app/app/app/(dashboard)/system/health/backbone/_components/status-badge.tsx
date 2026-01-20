"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, XCircle } from "lucide-react"

type Status = "healthy" | "degraded" | "unhealthy"

const statusConfig: Record<Status, { icon: typeof CheckCircle; className: string; label: string }> = {
  healthy: {
    icon: CheckCircle,
    className: "bg-success/10 text-success border-success/20",
    label: "Saudável",
  },
  degraded: {
    icon: AlertCircle,
    className: "bg-warning/10 text-warning border-warning/20",
    label: "Degradado",
  },
  unhealthy: {
    icon: XCircle,
    className: "bg-critical/10 text-critical border-critical/20",
    label: "Indisponível",
  },
}

interface StatusBadgeProps {
  status: Status
  showLabel?: boolean
}

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="size-3" />
      {showLabel && config.label}
    </Badge>
  )
}
