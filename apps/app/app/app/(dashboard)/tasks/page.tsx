"use client"

import { useEffect } from "react"
import { NotificationHub } from "@/components/notifications"
import { useNotificationStore } from "@/stores/notification-store"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TasksPage() {
  const { taskClasses, fetchTaskClasses, filter, setFilter } =
    useNotificationStore()

  useEffect(() => {
    fetchTaskClasses()
  }, [fetchTaskClasses])

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[{ label: "Início", href: "/app" }]}
        currentPage="Tarefas"
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tarefas</h1>
          {taskClasses.length > 1 && (
            <Select
              value={filter.class || "all"}
              onValueChange={(value) =>
                setFilter({ ...filter, class: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as classes</SelectItem>
                {taskClasses.map((tc) => (
                  <SelectItem key={tc.name} value={tc.name}>
                    {tc.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <NotificationHub
          kanbanEnabled={false}
          defaultView="list"
          filter={{ hideNotifications: true }}
        />
      </div>
    </div>
  )
}
