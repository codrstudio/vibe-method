"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useNotificationStore, type Task, type TaskClass } from "@/stores/notification-store"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TagBadge } from "./tag-badge"
import { toast } from "sonner"
import * as LucideIcons from "lucide-react"

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
    <Card className={cn("p-3", task.closedAt && "opacity-60")}>
      {/* Header: Checkbox + Title + Status */}
      <div className="flex items-center gap-3">
        <Checkbox
          checked={!!task.closedAt}
          onCheckedChange={() => canClose && !task.closedAt && handleClose()}
          disabled={!canClose || !!task.closedAt}
          className="h-5 w-5 rounded-full"
        />
        <span className="flex-1 font-medium">{task.title}</span>
        {task.tags.map((tag) => (
          <TagBadge
            key={tag}
            tag={tag}
            label={resolvedTaskClass?.tagConfig?.[tag]?.label}
            color={resolvedTaskClass?.tagConfig?.[tag]?.color}
            isActive
          />
        ))}
      </div>

      {/* Body: Description */}
      {task.message && (
        <p className="mt-2 text-sm text-muted-foreground">{task.message}</p>
      )}

      {/* Separator */}
      <Separator className="my-3" />

      {/* Footer: Timestamp + Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(task.createdAt), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>

        {/* Action buttons (only if open and has transitions) */}
        {!task.closedAt &&
          uniqueTransitions.filter((t) => !task.tags.includes(t)).length >
            0 && (
            <div className="flex gap-1">
              {uniqueTransitions
                .filter((t) => !task.tags.includes(t))
                .map((targetTag) => {
                  const label =
                    resolvedTaskClass?.tagConfig?.[targetTag]?.label ||
                    targetTag
                  const color = resolvedTaskClass?.tagConfig?.[targetTag]?.color
                  return (
                    <Tooltip key={targetTag}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTransition(targetTag)}
                          className="h-7 text-xs"
                          style={{ borderColor: color, color }}
                        >
                          {label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Marcar como {label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
            </div>
          )}
      </div>
    </Card>
  )
}
