// ==============================================================================
// LAY001: APP SHELL
// ==============================================================================
// Referencia: specs/design-layout.md
// Container raiz que organiza sidebar e conteudo.
// ==============================================================================

"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeaderActions } from "@/components/mobile-header-actions";
import { Separator } from "@/components/ui/separator";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * LAY001: App Shell
 *
 * Comportamento:
 * - Desktop: Sidebar visivel, colapsavel para icones
 * - Mobile: Sidebar em drawer, header com trigger
 *
 * Estrutura:
 * - LAY010: Sidebar (navegacao)
 * - LAY025: Mobile Header (apenas mobile)
 * - Content Area (paginas)
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      {/* LAY010: Sidebar */}
      <AppSidebar />

      <SidebarInset>
        {/* LAY025: Mobile Header - apenas visivel em mobile */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-semibold">App Name</span>
          <div className="flex-1" />
          <MobileHeaderActions />
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ==============================================================================
// USO EM LAYOUT.TSX
// ==============================================================================
//
// import { AppShell } from "@/components/app-shell";
//
// export default function AppLayout({ children }: { children: React.ReactNode }) {
//   // ... auth checks ...
//   return <AppShell>{children}</AppShell>;
// }
