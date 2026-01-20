"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNotificationStore, type Task, type TaskClass } from "@/stores/notification-store"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TagBadge } from "./tag-badge"
import { toast } from "sonner"
import * as LucideIcons from "lucide-react"
import { CheckCircle, Clock, User } from "lucide-react"

interface TaskItemProps {
  task: Task
  taskClass?: TaskClass
  compact?: boolean
}

export function TaskItem({ task, taskClass, compact = false }: TaskItemProps) {
  const { transitionTask, closeTask, taskClasses } = useNotificationStore()

  // Get task class from store if not provided
  const resolvedTaskClass =
    taskClass || taskClasses.find((tc) => tc.name === task.class)

  // Get icon component
  const iconName = task.icon || resolvedTaskClass?.icon || "circle"
  const IconComponent = LucideIcons[
    iconName as keyof typeof LucideIcons
  ] as React.ComponentType<{ className?: string }>

  // Get allowed transitions from workflow
  const allowedTransitions = task.tags.flatMap(
    (tag) => task.workflow.transitions[tag] || []
  )
  const uniqueTransitions = [...new Set(allowedTransitions)]

  // Check if task can be closed
  const canClose =
    task.workflow.closeRequires.length === 0 ||
    task.tags.some((tag) => task.workflow.closeRequires.includes(tag))

  const handleTransition = async (targetTag: string) => {
    try {
      await transitionTask(task.id, targetTag)
      toast.success(`Task movida para "${targetTag}"`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao transicionar task"
      )
    }
  }

  const handleClose = async () => {
    try {
      await closeTask(task.id)
      toast.success("Task encerrada")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao encerrar task"
      )
    }
  }

  if (compact) {
    return (
      <Card className="p-2">
        <div className="flex items-center gap-2">
          {IconComponent && (
            <IconComponent
              className="h-4 w-4 shrink-0"
              style={{ color: task.color || undefined }}
            />
          )}
          <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
          {task.tags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              label={resolvedTaskClass?.tagConfig?.[tag]?.label}
              color={resolvedTaskClass?.tagConfig?.[tag]?.color}
              size="sm"
              isActive
            />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn("p-3", task.closedAt && "opacity-60")}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: task.color || undefined,
      }}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {IconComponent && (
              <IconComponent
                className="h-5 w-5 shrink-0"
                style={{ color: task.color || undefined }}
              />
            )}
            <h4 className="truncate text-sm font-medium">{task.title}</h4>
          </div>

          {canClose && !task.closedAt && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600 hover:text-green-700"
              onClick={handleClose}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.message}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              label={resolvedTaskClass?.tagConfig?.[tag]?.label}
              color={resolvedTaskClass?.tagConfig?.[tag]?.color}
              icon={resolvedTaskClass?.tagConfig?.[tag]?.icon}
              isActive
            />
          ))}
        </div>

        {/* Transitions */}
        {!task.closedAt && uniqueTransitions.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {uniqueTransitions
              .filter((t) => !task.tags.includes(t))
              .map((targetTag) => (
                <TagBadge
                  key={targetTag}
                  tag={targetTag}
                  label={resolvedTaskClass?.tagConfig?.[targetTag]?.label}
                  color={resolvedTaskClass?.tagConfig?.[targetTag]?.color}
                  onClick={() => handleTransition(targetTag)}
                />
              ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(task.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>

          <div className="flex items-center gap-3">
            {task.dueAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(task.dueAt), { locale: ptBR })}
              </span>
            )}
            {task.assigneeId && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Atribuido
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
