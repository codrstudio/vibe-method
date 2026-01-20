"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Bell, ClipboardList, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MobileDrawer } from "@/components/mobile-drawer"
import { useNotifications } from "@/hooks/use-notifications"
import { useTasks } from "@/hooks/use-tasks"
import { cn } from "@/lib/utils"

export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const { count: notificationCount } = useNotifications()
  const { count: taskCount } = useTasks()

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
          <Link
            href="/app/tasks"
            className={cn(
              "relative flex items-center justify-center h-9 w-9 rounded-full transition-colors",
              hasTasks
                ? "bg-info/15 hover:bg-info/25"
                : "hover:bg-accent"
            )}
          >
            <ClipboardList
              className={cn(
                "h-5 w-5",
                hasTasks ? "text-info" : "text-foreground"
              )}
            />
            {hasTasks && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-info text-info-foreground text-xs font-medium">
                {taskCount}
              </span>
            )}
            <span className="sr-only">Tarefas pendentes</span>
          </Link>

          {/* Notificações - informativas */}
          <Link
            href="/app/notifications"
            className={cn(
              "relative flex items-center justify-center h-9 w-9 rounded-full transition-colors",
              hasNotifications
                ? "bg-warning/15 hover:bg-warning/25"
                : "hover:bg-accent"
            )}
          >
            <Bell
              className={cn(
                "h-5 w-5",
                hasNotifications ? "text-warning" : "text-foreground"
              )}
            />
            {hasNotifications && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-warning text-warning-foreground text-xs font-medium">
                {notificationCount}
              </span>
            )}
            <span className="sr-only">Notificações</span>
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
