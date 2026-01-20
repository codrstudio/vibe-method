"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type Task, type TaskClass } from "@/stores/notification-store"
import { KanbanCard } from "./kanban-card"

interface KanbanColumnProps {
  tag: string
  tasks: Task[]
  taskClass?: TaskClass
}

export function KanbanColumn({ tag, tasks, taskClass }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${tag}`,
    data: {
      type: "column",
      tag,
    },
  })

  const tagConfig = taskClass?.tagConfig?.[tag]
  const label = tagConfig?.label || tag
  const color = tagConfig?.color

  return (
    <div className="flex h-full w-64 shrink-0 flex-col">
      {/* Column Header */}
      <div className="mb-2 flex items-center justify-between">
        <Badge
          variant="secondary"
          className="font-medium"
          style={{
            backgroundColor: color ? `${color}20` : undefined,
            color: color,
            borderColor: color,
          }}
        >
          {label}
        </Badge>
        <span className="text-sm text-muted-foreground">{tasks.length}</span>
      </div>

      {/* Column Content */}
      <Card
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto rounded-lg border-2 border-dashed bg-muted/30 p-2 transition-colors",
          isOver && "border-primary bg-primary/5"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} taskClass={taskClass} />
            ))}

            {tasks.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Arraste tasks aqui
              </div>
            )}
          </div>
        </SortableContext>
      </Card>
    </div>
  )
}
