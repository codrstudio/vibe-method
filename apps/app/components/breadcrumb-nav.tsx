"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export interface BreadcrumbNavItem {
  label: string
  href: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbNavItem[]
  currentPage: string
  onRefresh?: () => void
}

export function BreadcrumbNav({ items, currentPage, onRefresh }: BreadcrumbNavProps) {
  const router = useRouter()

  const goBack = () => {
    if (items.length > 0) {
      router.push(items[items.length - 1].href)
    } else {
      router.back()
    }
  }

  return (
    <nav className="flex items-center gap-2">
      {/* Mobile: back + page */}
      <div className="flex md:hidden items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={goBack}>
          <ChevronLeft className="size-4" />
        </Button>
        {onRefresh ? (
          <button
            onClick={onRefresh}
            className="text-sm font-medium hover:underline"
          >
            {currentPage}
          </button>
        ) : (
          <span className="text-sm font-medium">{currentPage}</span>
        )}
      </div>

      {/* Desktop: full breadcrumb */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList className="flex-nowrap">
          {items.map((item, index) => (
            <span key={item.href} className="contents">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={item.href} className="flex items-center gap-1.5">
                    {index === 0 && <Home className="size-4" />}
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </span>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5">
              {items.length === 0 && <Home className="size-4" />}
              {currentPage}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  )
}
