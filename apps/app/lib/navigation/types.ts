import type { LucideIcon } from "lucide-react"

export interface NavSubItem {
  title: string
  url: string
  description?: string
  icon?: LucideIcon
}

export interface NavItem {
  title: string
  url: string
  description?: string
  icon?: LucideIcon
  isActive?: boolean
  section?: string
  items?: NavSubItem[]
}

export type SidebarArea = "main" | "settings" | "system-health"

export interface AreaPattern {
  pattern: RegExp
  area: SidebarArea
}

export interface NavigationConfig {
  areas: Record<SidebarArea, NavItem[]>
  areaPatterns: AreaPattern[]
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export interface NavigationResult {
  area: SidebarArea
  items: NavItem[]
  flatItems: NavItem[]
  collapsibleItems: NavItem[]
  groups: NavGroup[]
}
