"use client"

import { MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BreadcrumbNav, type BreadcrumbNavItem } from "@/components/breadcrumb-nav"

interface BreadcrumbBarProps {
  items: BreadcrumbNavItem[]
  currentPage: string
  onRefresh?: () => void
  actions?: React.ReactNode
  mobileActions?: React.ReactNode
}

export function BreadcrumbBar({
  items,
  currentPage,
  onRefresh,
  actions,
  mobileActions,
}: BreadcrumbBarProps) {
  return (
    <header className="flex h-10 md:h-16 shrink-0 items-center gap-2 px-4 border-b">
      <BreadcrumbNav
        items={items}
        currentPage={currentPage}
        onRefresh={onRefresh}
      />

      <div className="ml-auto flex items-center gap-2">
        {/* Desktop: direct actions */}
        {actions && (
          <div className="hidden md:flex items-center gap-2">
            {actions}
          </div>
        )}

        {/* Mobile: dropdown menu */}
        {mobileActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {mobileActions}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
