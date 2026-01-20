"use client"

import { Button } from "@/components/ui/button"
import { List, LayoutGrid } from "lucide-react"
import { useNotificationStore } from "@/stores/notification-store"

export function ViewToggle() {
  const { viewMode, setViewMode } = useNotificationStore()

  return (
    <div className="flex gap-1 rounded-md border p-1">
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => setViewMode("list")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "kanban" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => setViewMode("kanban")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}
