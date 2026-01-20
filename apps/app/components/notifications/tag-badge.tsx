"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"

interface TagBadgeProps {
  tag: string
  label?: string
  color?: string
  icon?: string
  onClick?: () => void
  isActive?: boolean
  size?: "sm" | "default"
}

export function TagBadge({
  tag,
  label,
  color,
  icon,
  onClick,
  isActive = false,
  size = "default",
}: TagBadgeProps) {
  const displayLabel = label || tag
  const IconComponent = icon
    ? (LucideIcons[icon as keyof typeof LucideIcons] as React.ComponentType<{
        className?: string
      }>)
    : null

  return (
    <Badge
      variant={isActive ? "default" : "outline"}
      className={cn(
        "cursor-pointer transition-colors",
        size === "sm" && "text-xs px-1.5 py-0",
        onClick && "hover:opacity-80"
      )}
      style={{
        backgroundColor: isActive ? color : "transparent",
        borderColor: color,
        color: isActive ? "white" : color,
      }}
      onClick={onClick}
    >
      {IconComponent && <IconComponent className="mr-1 h-3 w-3" />}
      {displayLabel}
    </Badge>
  )
}
