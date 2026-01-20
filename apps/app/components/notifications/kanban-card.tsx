"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type Task, type TaskClass } from "@/stores/notification-store"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import * as LucideIcons from "lucide-react"
import { Clock, User, GripVertical } from "lucide-react"

interface KanbanCardProps {
  task: Task
  taskClass?: TaskClass
}

export function KanbanCard({ task, taskClass }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Get icon component
  const iconName = task.icon || taskClass?.icon || "circle"
  const IconComponent = LucideIcons[
    iconName as keyof typeof LucideIcons
  ] as React.ComponentType<{ className?: string }>

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-2 cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      <div className="space-y-1.5">
        {/* Header */}
        <div className="flex items-start gap-1.5">
          <div
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {IconComponent && (
            <IconComponent
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: task.color || undefined }}
            />
          )}

          <span className="min-w-0 flex-1 text-sm font-medium line-clamp-2">
            {task.title}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(task.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>

          <div className="flex items-center gap-2">
            {task.dueAt && (
              <Clock className="h-3 w-3" />
            )}
            {task.assigneeId && (
              <User className="h-3 w-3" />
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
