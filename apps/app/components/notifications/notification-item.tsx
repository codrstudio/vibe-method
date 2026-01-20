"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useNotificationStore, type Notification } from "@/stores/notification-store"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Check, Trash2, Info, AlertTriangle, AlertCircle, ExternalLink } from "lucide-react"

interface NotificationItemProps {
  notification: Notification
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  task: Check,
}

const typeColors = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  task: "text-green-500",
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markNotificationAsRead, deleteNotification } = useNotificationStore()
  const Icon = typeIcons[notification.type]
  const isUnread = notification.status === "pending"

  return (
    <Card
      className={cn(
        "p-3 h-full flex flex-col transition-colors",
        isUnread && "border-l-4 border-l-primary bg-muted/30"
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", typeColors[notification.type])} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-medium">{notification.title}</h4>
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                {notification.message}
              </p>
            </div>

            <div className="flex shrink-0 gap-1">
              {isUnread && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteNotification(notification.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {notification.type}
              </Badge>

              {notification.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  asChild
                >
                  <a href={notification.actionUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Ver
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
