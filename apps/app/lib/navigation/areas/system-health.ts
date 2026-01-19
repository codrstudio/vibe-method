import { Activity, Radio, Server } from "lucide-react"
import type { NavItem } from "../types"
import { homeItem } from "./shared"

const systemStatusItem: NavItem = {
  title: "Status do Sistema",
  url: "/app/system/health",
  icon: Activity,
  description: "Visão geral e métricas"
}

const realtimeItem: NavItem = {
  title: "Tempo Real",
  url: "/app/system/health/realtime",
  icon: Radio,
  description: "WebSocket e conexões ativas",
  section: "Monitoramento",
}

const backboneItem: NavItem = {
  title: "Infraestrutura",
  url: "/app/system/health/backbone",
  icon: Server,
  description: "Backend, APIs e componentes",
  section: "Monitoramento",
}

export const systemHealthAreaItems: NavItem[] = [
  homeItem,
  systemStatusItem,
  realtimeItem,
  backboneItem,
]
