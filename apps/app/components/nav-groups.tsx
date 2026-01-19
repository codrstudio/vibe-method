"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavGroup } from "@/lib/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavGroupsProps {
  groups: NavGroup[]
}

export function NavGroups({ groups }: NavGroupsProps) {
  const pathname = usePathname()

  if (groups.length === 0) {
    return null
  }

  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={group.label || groupIndex}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarMenu>
            {group.items.map((item) => {
              const isActive = pathname === item.url

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.description || item.title}
                    isActive={isActive}
                    className={item.description ? "h-auto py-2" : ""}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon className="shrink-0" />}
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate">{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-sidebar-foreground/70 truncate font-normal">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
