"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"
import { NotificationItem } from "./notification-item"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCheck, Inbox } from "lucide-react"

export function NotificationList() {
  const {
    notifications,
    isLoadingNotifications,
    fetchNotifications,
    markAllNotificationsAsRead,
    unreadNotificationCount,
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  if (isLoadingNotifications) {
    return (
      <div className="space-y-3">
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
    <div className="space-y-3">
      {unreadNotificationCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsAsRead}
            className="text-xs"
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Marcar todas como lidas
          </Button>
        </div>
      )}

      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  )
}
