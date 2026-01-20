"use client"

import { useEffect } from "react"
import { NotificationHub } from "@/components/notifications"
import { useNotificationStore } from "@/stores/notification-store"
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
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Gerencie suas tasks e acompanhe o progresso
          </p>
        </div>

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
        kanbanEnabled={true}
        defaultView="list"
        filter={{ hideNotifications: true }}
      />
    </div>
  )
}
