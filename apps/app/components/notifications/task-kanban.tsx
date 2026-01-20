"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { useNotificationStore, type Task } from "@/stores/notification-store"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ClipboardList } from "lucide-react"

export function TaskKanban() {
  const {
    tasks,
    taskClasses,
    isLoadingTasks,
    fetchTasks,
    fetchTaskClasses,
    transitionTask,
    filter,
  } = useNotificationStore()

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    fetchTasks()
    fetchTaskClasses()
  }, [fetchTasks, fetchTaskClasses, filter])

  // Get the current task class for filtering
  const currentTaskClass = taskClasses.find((tc) => tc.name === filter.class) || taskClasses[0]

  // Group tasks by their first tag
  const tasksByTag = new Map<string, Task[]>()

  // Initialize all possible tags from the task class
  if (currentTaskClass) {
    for (const tag of currentTaskClass.tags) {
      tasksByTag.set(tag, [])
    }
  }

  // Add tasks to their respective columns
  for (const task of tasks) {
    if (task.closedAt) continue // Skip closed tasks in kanban

    const taskTag = task.tags[0] // Use first tag as column
    if (taskTag && tasksByTag.has(taskTag)) {
      tasksByTag.get(taskTag)!.push(task)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Extract target tag from column id (format: "column-{tag}")
    const overId = over.id as string
    let targetTag: string | null = null

    if (overId.startsWith("column-")) {
      targetTag = overId.replace("column-", "")
    } else {
      // Dropped on another task - get that task's column
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        targetTag = overTask.tags[0]
      }
    }

    if (!targetTag || task.tags.includes(targetTag)) return

    try {
      await transitionTask(taskId, targetTag)
      toast.success(`Task movida para "${currentTaskClass?.tagConfig?.[targetTag]?.label || targetTag}"`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao mover task"
      )
    }
  }

  if (isLoadingTasks) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-64 shrink-0">
            <Skeleton className="mb-2 h-6 w-24" />
            <Skeleton className="h-96 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!currentTaskClass) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhuma classe de task</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure uma task class para usar o kanban
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {currentTaskClass.tags.map((tag) => (
          <KanbanColumn
            key={tag}
            tag={tag}
            tasks={tasksByTag.get(tag) || []}
            taskClass={currentTaskClass}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <KanbanCard task={activeTask} taskClass={currentTaskClass} />
        )}
      </DragOverlay>
    </DndContext>
  )
}
