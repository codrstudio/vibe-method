"use client"

import * as React from "react"
import Image from "next/image"
import { AudioWaveform, Command } from "lucide-react"

import { useNavigation } from "@/lib/navigation"
import { useSession } from "@/lib/hooks/use-session"
import { NavGroups } from "@/components/nav-groups"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { SidebarNotifications } from "@/components/sidebar-notifications"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Componente para ícone do brand (versão dark para sidebar escura)
function BrandIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/icon-dark.svg"
      alt="Brand"
      width={32}
      height={32}
      className={`${className} rounded-lg`}
    />
  )
}

// Dados fixos (teams permanecem aqui)
const teams = [
  {
    name: "Minha Empresa",
    logo: BrandIcon,
    plan: "Empresarial",
    isImage: true,
  },
  {
    name: "Startup",
    logo: AudioWaveform,
    plan: "Inicial",
  },
  {
    name: "Projeto Pessoal",
    logo: Command,
    plan: "Gratuito",
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { groups } = useNavigation()
  const { user } = useSession()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
        <SidebarNotifications />
      </SidebarHeader>
      <SidebarContent>
        <NavGroups groups={groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ? { name: user.name, email: user.email, image: user.image } : { name: "Carregando...", email: "", image: "" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
