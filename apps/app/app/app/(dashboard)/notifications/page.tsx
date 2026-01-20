"use client"

import { NotificationHub } from "@/components/notifications"

export default function NotificationsPage() {
  return (
    <div className="container mx-auto max-w-2xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notificacoes</h1>
        <p className="text-muted-foreground">
          Gerencie suas notificacoes e alertas
        </p>
      </div>

      <NotificationHub kanbanEnabled={false} filter={{ hideTasks: true }} />
    </div>
  )
}
