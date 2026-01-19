"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface MobileBreadcrumbProps {
  currentPage: string
  showBack?: boolean
}

export function MobileBreadcrumb({ currentPage, showBack = true }: MobileBreadcrumbProps) {
  const router = useRouter()

  return (
    <div className="md:hidden flex h-10 items-center gap-1 px-4 border-b bg-background">
      {/* Home */}
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href="/app">
          <Home className="h-4 w-4" />
          <span className="sr-only">Início</span>
        </Link>
      </Button>

      <Separator orientation="vertical" className="h-4" />

      {/* Voltar */}
      {showBack && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Button>

          <Separator orientation="vertical" className="h-4" />
        </>
      )}

      {/* Página atual */}
      <span className="text-sm font-medium truncate">{currentPage}</span>
    </div>
  )
}
