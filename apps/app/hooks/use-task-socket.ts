"use client"

import { useEffect } from "react"
import { useNotificationStore, type Task, type Notification } from "@/stores/notification-store"
import { useSocket } from "./use-socket"

interface UseTaskSocketOptions {
  token?: string
  enabled?: boolean
}

export function useTaskSocket(options: UseTaskSocketOptions = {}) {
  const { token, enabled = true } = options
  const { socket, connected } = useSocket("/hub", { token, autoConnect: enabled && !!token })

  const {
    addNotification,
    updateNotification,
    removeNotification,
    addTask,
    updateTask,
    removeTask,
    fetchNotifications,
    fetchTasks,
  } = useNotificationStore()

  useEffect(() => {
    if (!socket || !connected) return

    // Notification events
    const handleNotificationNew = (notification: Notification) => {
      addNotification(notification)
    }

    const handleNotificationUpdated = (notification: Notification) => {
      updateNotification(notification)
    }

    const handleNotificationDeleted = ({ id }: { id: string }) => {
      removeNotification(id)
    }

    const handleNotificationAllRead = () => {
      fetchNotifications()
    }

    // Task events
    const handleTaskCreated = (task: Task) => {
      addTask(task)
    }

    const handleTaskTransitioned = ({
      task,
    }: {
      task: Task
      fromTags: string[]
      toTag: string
    }) => {
      updateTask(task)
    }

    const handleTaskClosed = (task: Task) => {
      updateTask(task)
    }

    // Subscribe to events
    socket.on("notification:new", handleNotificationNew)
    socket.on("notification:updated", handleNotificationUpdated)
    socket.on("notification:deleted", handleNotificationDeleted)
    socket.on("notification:all-read", handleNotificationAllRead)
    socket.on("task:created", handleTaskCreated)
    socket.on("task:transitioned", handleTaskTransitioned)
    socket.on("task:closed", handleTaskClosed)

    // Cleanup
    return () => {
      socket.off("notification:new", handleNotificationNew)
      socket.off("notification:updated", handleNotificationUpdated)
      socket.off("notification:deleted", handleNotificationDeleted)
      socket.off("notification:all-read", handleNotificationAllRead)
      socket.off("task:created", handleTaskCreated)
      socket.off("task:transitioned", handleTaskTransitioned)
      socket.off("task:closed", handleTaskClosed)
    }
  }, [
    socket,
    connected,
    addNotification,
    updateNotification,
    removeNotification,
    addTask,
    updateTask,
    removeTask,
    fetchNotifications,
    fetchTasks,
  ])

  return {
    connected,
  }
}
