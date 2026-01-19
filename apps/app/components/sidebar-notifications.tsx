"use client"

import { Bell, ClipboardList } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"

export function SidebarNotifications() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { count: notificationCount } = useNotifications()

  // Tasks: sem sistema implementado ainda
  const taskCount = 0

  const hasNotifications = notificationCount > 0
  const hasTasks = taskCount > 0

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center px-2">
        {/* Grupo de notificações */}
        <div className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-sidebar-accent">
          {/* Notificações */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "relative flex items-center justify-center h-8 w-8 rounded-md transition-colors",
                  hasNotifications
                    ? "bg-warning/20 hover:bg-warning/30"
                    : "hover:bg-sidebar-accent-foreground/10"
                )}
              >
                <Bell
                  className={cn(
                    "h-4 w-4",
                    hasNotifications
                      ? "text-warning"
                      : "text-sidebar-foreground"
                  )}
                />
                {hasNotifications && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full bg-warning text-warning-foreground text-[10px] font-medium">
                    {notificationCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Notificações</TooltipContent>
          </Tooltip>

          {/* Tarefas */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "relative flex items-center justify-center h-8 w-8 rounded-md transition-colors",
                  hasTasks
                    ? "bg-info/20 hover:bg-info/30"
                    : "hover:bg-sidebar-accent-foreground/10"
                )}
              >
                <ClipboardList
                  className={cn(
                    "h-4 w-4",
                    hasTasks ? "text-info" : "text-sidebar-foreground"
                  )}
                />
                {hasTasks && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full bg-info text-info-foreground text-[10px] font-medium">
                    {taskCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Tarefas pendentes</TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1">
      {/* Notificações */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors",
              hasNotifications
                ? "bg-warning/15 hover:bg-warning/25"
                : "hover:bg-sidebar-accent"
            )}
          >
            <Bell
              className={cn(
                "h-4 w-4",
                hasNotifications
                  ? "text-warning"
                  : "text-sidebar-foreground"
              )}
            />
            {hasNotifications && (
              <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-warning text-warning-foreground text-xs font-medium">
                {notificationCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Notificações</TooltipContent>
      </Tooltip>

      {/* Tarefas */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors",
              hasTasks
                ? "bg-info/15 hover:bg-info/25"
                : "hover:bg-sidebar-accent"
            )}
          >
            <ClipboardList
              className={cn(
                "h-4 w-4",
                hasTasks ? "text-info" : "text-sidebar-foreground"
              )}
            />
            {hasTasks && (
              <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-info text-info-foreground text-xs font-medium">
                {taskCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Tarefas pendentes</TooltipContent>
      </Tooltip>
    </div>
  )
}
