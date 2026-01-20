"use client"

import { NotificationHub } from "@/components/notifications"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { useNotificationStore } from "@/stores/notification-store"
import { Button } from "@/components/ui/button"
import { CheckCheck } from "lucide-react"

export default function NotificationsPage() {
  const { markAllNotificationsAsRead, unreadNotificationCount } =
    useNotificationStore()

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[{ label: "Início", href: "/app" }]}
        currentPage="Notificações"
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notificações</h1>
          {unreadNotificationCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsAsRead}
              className="text-xs"
            >
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <NotificationHub kanbanEnabled={false} filter={{ hideTasks: true }} />
      </div>
    </div>
  )
}
