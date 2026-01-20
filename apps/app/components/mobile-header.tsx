"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Bell, ClipboardList, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MobileDrawer } from "@/components/mobile-drawer"
import { useNotifications } from "@/hooks/use-notifications"

export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const { count: notificationCount } = useNotifications()

  // Tasks: sem sistema implementado ainda
  const taskCount = 0

  const hasNotifications = notificationCount > 0
  const hasTasks = taskCount > 0

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
          <Link href="/app/tasks">
            <Button variant="ghost" size="icon" className="relative">
              <ClipboardList className="h-5 w-5" />
              {hasTasks && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
                  {taskCount}
                </Badge>
              )}
              <span className="sr-only">Tarefas pendentes</span>
            </Button>
          </Link>

          {/* Notificações - informativas */}
          <Link href="/app/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {hasNotifications && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
                  {notificationCount}
                </Badge>
              )}
              <span className="sr-only">Notificações</span>
            </Button>
          </Link>

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
