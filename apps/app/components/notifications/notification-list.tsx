"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"
import { NotificationItem } from "./notification-item"
import { Skeleton } from "@/components/ui/skeleton"
import { Inbox } from "lucide-react"

export function NotificationList() {
  const { notifications, isLoadingNotifications, fetchNotifications } =
    useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  if (isLoadingNotifications) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhuma notificacao</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Voce nao tem notificacoes no momento
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  )
}
