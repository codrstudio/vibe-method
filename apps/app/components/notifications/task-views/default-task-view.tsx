"use client"

import { type Task, type TaskClass } from "@/stores/notification-store"
import { TaskItem } from "../task-item"

interface DefaultTaskViewProps {
  task: Task
  taskClass?: TaskClass
}

export function DefaultTaskView({ task, taskClass }: DefaultTaskViewProps) {
  return <TaskItem task={task} taskClass={taskClass} />
}
