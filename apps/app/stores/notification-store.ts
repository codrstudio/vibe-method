import { create } from "zustand"
import { persist } from "zustand/middleware"

// Types
export interface Notification {
  id: string
  type: "info" | "warning" | "error" | "task"
  title: string
  message: string
  userId: string
  status: "pending" | "read" | "archived"
  metadata: Record<string, unknown> | null
  actionUrl: string | null
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskWorkflow {
  className: string
  transitions: Record<string, string[]>
  closeRequires: string[]
  sla?: {
    warning?: string
    critical?: string
  }
}

export interface Task extends Notification {
  class: string
  metaTags: string[]
  tags: string[]
  workflow: TaskWorkflow
  color: string | null
  icon: string | null
  assigneeId: string | null
  dueAt: string | null
  closedAt: string | null
}

export interface TaskClass {
  name: string
  displayName: string
  description?: string
  icon: string
  color: string
  tags: string[]
  closeRequires?: string[]
  tagConfig?: Record<
    string,
    {
      label: string
      color: string
      icon?: string
    }
  >
}

export interface TasksByTag {
  tag: string
  tasks: Task[]
}

type ViewMode = "list" | "kanban"
type ActiveTab = "notifications" | "tasks"

interface NotificationFilter {
  class?: string
  status?: "open" | "closed"
  tag?: string
}

interface NotificationState {
  // UI state (persisted)
  viewMode: ViewMode
  activeTab: ActiveTab

  // Data state
  notifications: Notification[]
  tasks: Task[]
  taskClasses: TaskClass[]
  groupedTasks: TasksByTag[]
  filter: NotificationFilter

  // Loading states
  isLoadingNotifications: boolean
  isLoadingTasks: boolean
  isLoadingClasses: boolean

  // Counts
  unreadNotificationCount: number
  openTaskCount: number

  // Actions
  setViewMode: (mode: ViewMode) => void
  setActiveTab: (tab: ActiveTab) => void
  setFilter: (filter: NotificationFilter) => void

  // Notifications
  fetchNotifications: () => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>

  // Tasks
  fetchTasks: () => Promise<void>
  fetchTaskClasses: () => Promise<void>
  fetchGroupedTasks: (taskClass?: string) => Promise<void>
  transitionTask: (taskId: string, targetTag: string) => Promise<void>
  closeTask: (taskId: string) => Promise<void>
  createTask: (data: {
    class: string
    title: string
    message: string
    assigneeId?: string
    dueAt?: string
  }) => Promise<Task>

  // Real-time updates
  addNotification: (notification: Notification) => void
  updateNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  removeTask: (id: string) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      viewMode: "list",
      activeTab: "notifications",
      notifications: [],
      tasks: [],
      taskClasses: [],
      groupedTasks: [],
      filter: {},
      isLoadingNotifications: false,
      isLoadingTasks: false,
      isLoadingClasses: false,
      unreadNotificationCount: 0,
      openTaskCount: 0,

      // UI Actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setFilter: (filter) => set({ filter }),

      // Notification Actions
      fetchNotifications: async () => {
        set({ isLoadingNotifications: true })
        try {
          const response = await fetch("/api/notifications?status=pending")
          if (!response.ok) throw new Error("Failed to fetch notifications")
          const { data } = await response.json()
          set({
            notifications: data,
            unreadNotificationCount: data.filter(
              (n: Notification) => n.status === "pending"
            ).length,
          })
        } catch (error) {
          console.error("Failed to fetch notifications:", error)
        } finally {
          set({ isLoadingNotifications: false })
        }
      },

      markNotificationAsRead: async (id) => {
        try {
          const response = await fetch(`/api/notifications/${id}/read`, {
            method: "PATCH",
          })
          if (!response.ok) throw new Error("Failed to mark as read")

          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, status: "read", readAt: new Date().toISOString() } : n
            ),
            unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
          }))
        } catch (error) {
          console.error("Failed to mark notification as read:", error)
        }
      },

      markAllNotificationsAsRead: async () => {
        try {
          const response = await fetch("/api/notifications/read-all", {
            method: "POST",
          })
          if (!response.ok) throw new Error("Failed to mark all as read")

          set((state) => ({
            notifications: state.notifications.map((n) => ({
              ...n,
              status: "read",
              readAt: new Date().toISOString(),
            })),
            unreadNotificationCount: 0,
          }))
        } catch (error) {
          console.error("Failed to mark all as read:", error)
        }
      },

      deleteNotification: async (id) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: "DELETE",
          })
          if (!response.ok) throw new Error("Failed to delete notification")

          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }))
        } catch (error) {
          console.error("Failed to delete notification:", error)
        }
      },

      // Task Actions
      fetchTasks: async () => {
        set({ isLoadingTasks: true })
        try {
          const { filter } = get()
          const params = new URLSearchParams()
          if (filter.class) params.set("class", filter.class)
          if (filter.status) params.set("status", filter.status)
          if (filter.tag) params.set("tag", filter.tag)

          const response = await fetch(`/api/tasks?${params.toString()}`)
          if (!response.ok) throw new Error("Failed to fetch tasks")
          const { data } = await response.json()
          set({
            tasks: data,
            openTaskCount: data.filter((t: Task) => !t.closedAt).length,
          })
        } catch (error) {
          console.error("Failed to fetch tasks:", error)
        } finally {
          set({ isLoadingTasks: false })
        }
      },

      fetchTaskClasses: async () => {
        set({ isLoadingClasses: true })
        try {
          const response = await fetch("/api/tasks/classes")
          if (!response.ok) throw new Error("Failed to fetch task classes")
          const { data } = await response.json()
          set({ taskClasses: data })
        } catch (error) {
          console.error("Failed to fetch task classes:", error)
        } finally {
          set({ isLoadingClasses: false })
        }
      },

      fetchGroupedTasks: async (taskClass) => {
        try {
          const params = new URLSearchParams()
          if (taskClass) params.set("class", taskClass)

          const response = await fetch(`/api/tasks/grouped?${params.toString()}`)
          if (!response.ok) throw new Error("Failed to fetch grouped tasks")
          const { data } = await response.json()
          set({ groupedTasks: data })
        } catch (error) {
          console.error("Failed to fetch grouped tasks:", error)
        }
      },

      transitionTask: async (taskId, targetTag) => {
        try {
          const response = await fetch(`/api/tasks/${taskId}/transition`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetTag }),
          })

          if (!response.ok) {
            const { error } = await response.json()
            throw new Error(error || "Failed to transition task")
          }

          const { data } = await response.json()

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, tags: data.task.tags } : t
            ),
          }))

          // Refresh grouped tasks if in kanban mode
          const { viewMode, filter } = get()
          if (viewMode === "kanban") {
            get().fetchGroupedTasks(filter.class)
          }
        } catch (error) {
          console.error("Failed to transition task:", error)
          throw error
        }
      },

      closeTask: async (taskId) => {
        try {
          const response = await fetch(`/api/tasks/${taskId}/close`, {
            method: "POST",
          })

          if (!response.ok) {
            const { error } = await response.json()
            throw new Error(error || "Failed to close task")
          }

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, closedAt: new Date().toISOString() } : t
            ),
            openTaskCount: Math.max(0, state.openTaskCount - 1),
          }))
        } catch (error) {
          console.error("Failed to close task:", error)
          throw error
        }
      },

      createTask: async (data) => {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const { error } = await response.json()
          throw new Error(error || "Failed to create task")
        }

        const { data: task } = await response.json()

        set((state) => ({
          tasks: [task, ...state.tasks],
          openTaskCount: state.openTaskCount + 1,
        }))

        return task
      },

      // Real-time update handlers
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadNotificationCount:
            notification.status === "pending"
              ? state.unreadNotificationCount + 1
              : state.unreadNotificationCount,
        }))
      },

      updateNotification: (notification) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notification.id ? notification : n
          ),
        }))
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      addTask: (task) => {
        set((state) => ({
          tasks: [task, ...state.tasks],
          openTaskCount: !task.closedAt ? state.openTaskCount + 1 : state.openTaskCount,
        }))
      },

      updateTask: (task) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
        }))
      },

      removeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }))
      },
    }),
    {
      name: "notification-store",
      partialize: (state) => ({
        viewMode: state.viewMode,
        activeTab: state.activeTab,
      }),
    }
  )
)
