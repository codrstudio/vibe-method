// Force recompile: 2026-01-19T22:10
import { cookies } from "next/headers"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarState !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar className="hidden md:flex" />
      <SidebarInset>
        <MobileHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
