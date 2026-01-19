"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { navigationConfig, getAreaFromPathname } from "./config"
import type { NavigationResult, NavItem, NavGroup } from "./types"

export function useNavigation(): NavigationResult {
  const pathname = usePathname()

  return useMemo(() => {
    const area = getAreaFromPathname(pathname)
    const items = navigationConfig.areas[area] || []

    // Separa items flat (sem subitems) dos collapsible (com subitems)
    const flatItems: NavItem[] = []
    const collapsibleItems: NavItem[] = []

    for (const item of items) {
      if (item.items && item.items.length > 0) {
        collapsibleItems.push(item)
      } else {
        flatItems.push(item)
      }
    }

    // Agrupa items por section (mantendo ordem)
    const groups: NavGroup[] = []
    let currentSection: string | undefined
    let currentGroup: NavGroup | null = null

    for (const item of items) {
      // Cria novo grupo quando section muda OU quando é o primeiro item
      if (currentGroup === null || item.section !== currentSection) {
        currentSection = item.section
        currentGroup = { label: currentSection, items: [] }
        groups.push(currentGroup)
      }
      currentGroup.items.push(item)
    }

    return {
      area,
      items,
      flatItems,
      collapsibleItems,
      groups,
    }
  }, [pathname])
}
