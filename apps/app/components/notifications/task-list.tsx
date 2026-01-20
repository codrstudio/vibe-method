"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"
import { TaskItem } from "./task-item"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList } from "lucide-react"

export function TaskList() {
  const { tasks, isLoadingTasks, fetchTasks, fetchTaskClasses, taskClasses } =
    useNotificationStore()

  useEffect(() => {
    fetchTasks()
    fetchTaskClasses()
  }, [fetchTasks, fetchTaskClasses])

  if (isLoadingTasks) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhuma task</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Voce nao tem tasks no momento
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const taskClass = taskClasses.find((tc) => tc.name === task.class)
        return <TaskItem key={task.id} task={task} taskClass={taskClass} />
      })}
    </div>
  )
}
