import { Bell, ClipboardList } from "lucide-react"
import type { NavItem } from "../types"
import { homeItem } from "./shared"

const notificationsItem: NavItem = {
  title: "Notificacoes",
  url: "/app/notifications",
  icon: Bell,
}

const tasksItem: NavItem = {
  title: "Tasks",
  url: "/app/tasks",
  icon: ClipboardList,
}

export const mainAreaItems: NavItem[] = [homeItem, notificationsItem, tasksItem]
