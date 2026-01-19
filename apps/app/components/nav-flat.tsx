"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavItem } from "@/lib/navigation"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavFlatProps {
  items: NavItem[]
  label?: string
}

export function NavFlat({ items, label }: NavFlatProps) {
  const pathname = usePathname()

  if (items.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      {label && (
        <p className="px-3 py-2 text-xs font-medium text-sidebar-foreground/70">
          {label}
        </p>
      )}
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
