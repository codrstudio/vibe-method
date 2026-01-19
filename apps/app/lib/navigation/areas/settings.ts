import { Mail, MessageCircle, Network, Workflow } from "lucide-react"
import type { NavItem } from "../types"
import { homeItem } from "./shared"

const messageTemplatesItem: NavItem = {
  title: "Templates de Mensagens",
  url: "/app/settings/messages",
  icon: Mail,
  description: "Modelos de comunicação",
  section: "Comunicação",
}

const whatsAppDashboardItem: NavItem = {
  title: "WhatsApp",
  url: "/app/settings/whatsapp",
  icon: MessageCircle,
  description: "Visão geral e métricas",
  section: "WhatsApp",
}

const whatsAppChannelsItem: NavItem = {
  title: "Canais",
  url: "/app/settings/whatsapp/channels",
  icon: Network,
  description: "Números e conexões",
  section: "WhatsApp",
}

const whatsAppOperationsItem: NavItem = {
  title: "Operações",
  url: "/app/settings/whatsapp/operations",
  icon: Workflow,
  description: "Filas e processamento",
  section: "WhatsApp",
}

export const settingsAreaItems: NavItem[] = [
  homeItem,
  messageTemplatesItem,
  whatsAppDashboardItem,
  whatsAppChannelsItem,
  whatsAppOperationsItem,
]
