"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { NotificationList } from "./notification-list"
import { TaskList } from "./task-list"
import { TaskKanban } from "./task-kanban"
import { ViewToggle } from "./view-toggle"
import { Bell, ClipboardList } from "lucide-react"

interface NotificationHubProps {
  kanbanEnabled?: boolean
  defaultView?: "list" | "kanban"
  filter?: {
    hideNotifications?: boolean
    hideTasks?: boolean
    classOnly?: string
  }
}

export function NotificationHub({
  kanbanEnabled = true,
  defaultView = "list",
  filter,
}: NotificationHubProps) {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    setFilter,
    unreadNotificationCount,
    openTaskCount,
    fetchTasks,
    fetchNotifications,
  } = useNotificationStore()

  // Apply filter on mount
  useEffect(() => {
    if (filter?.classOnly) {
      setFilter({ class: filter.classOnly })
    }
    if (defaultView) {
      setViewMode(defaultView)
    }
  }, [filter?.classOnly, defaultView, setFilter, setViewMode])

  // Auto-select appropriate tab based on filter
  useEffect(() => {
    if (filter?.hideNotifications) {
      setActiveTab("tasks")
    } else if (filter?.hideTasks) {
      setActiveTab("notifications")
    }
  }, [filter?.hideNotifications, filter?.hideTasks, setActiveTab])

  // Refresh data
  useEffect(() => {
    if (!filter?.hideNotifications) {
      fetchNotifications()
    }
    if (!filter?.hideTasks) {
      fetchTasks()
    }
  }, [fetchNotifications, fetchTasks, filter?.hideNotifications, filter?.hideTasks])

  // If only one type is shown, render directly
  if (filter?.hideNotifications && filter?.hideTasks) {
    return <div>Nenhum conteudo para exibir</div>
  }

  if (filter?.hideNotifications) {
    return <TaskList />
  }

  if (filter?.hideTasks) {
    return <NotificationList />
  }

  // Full hub with tabs
  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "notifications" | "tasks")}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" />
            Notificacoes
            {unreadNotificationCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {unreadNotificationCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Tasks
            {openTaskCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {openTaskCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {activeTab === "tasks" && kanbanEnabled && <ViewToggle />}
      </div>

      <TabsContent value="notifications" className="mt-4">
        <NotificationList />
      </TabsContent>

      <TabsContent value="tasks" className="mt-4">
        {viewMode === "kanban" && kanbanEnabled ? <TaskKanban /> : <TaskList />}
      </TabsContent>
    </Tabs>
  )
}
