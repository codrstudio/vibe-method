"use client"

import * as React from "react"
import Image from "next/image"
import { Bell, ClipboardList, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MobileDrawer } from "@/components/mobile-drawer"

export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Image
            src="/brand/icon.svg"
            alt="CIA"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="font-semibold">CIA</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Tarefas - ações pendentes para o usuário */}
          <Button variant="ghost" size="icon" className="relative">
            <ClipboardList className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
              2
            </Badge>
            <span className="sr-only">Tarefas pendentes</span>
          </Button>

          {/* Notificações - informativas */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
              5
            </Badge>
            <span className="sr-only">Notificações</span>
          </Button>

          {/* Menu hamburger */}
          <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
