// ==============================================================================
// LAY025: MOBILE HEADER
// ==============================================================================
// Referencia: specs/design-layout.md
// Header fixo visivel apenas em mobile.
// ==============================================================================

"use client";

import { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Bell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ==============================================================================
// LAY025: MOBILE HEADER
// ==============================================================================
// Estrutura:
// - Sidebar trigger (hamburger)
// - Nome do sistema
// - Acoes rapidas (notificacoes, refresh)
//
// Comportamento:
// - Fixo no topo
// - Apenas visivel em telas < md

interface MobileHeaderProps {
  /** Nome do sistema/app */
  brandName?: string;
  /** Acoes do lado direito */
  actions?: ReactNode;
  className?: string;
}

export function MobileHeader({
  brandName = "App Name",
  actions,
  className,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden",
        className
      )}
    >
      {/* Sidebar Trigger */}
      <SidebarTrigger className="-ml-1" />

      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Brand Name */}
      <span className="font-semibold">{brandName}</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      {actions}
    </header>
  );
}

// ==============================================================================
// MOBILE HEADER ACTIONS
// ==============================================================================
// Componente auxiliar para acoes comuns no header mobile

interface MobileHeaderActionsProps {
  /** Callback para refresh */
  onRefresh?: () => void;
  /** Indica se esta carregando */
  isRefreshing?: boolean;
  /** Callback para notificacoes */
  onNotifications?: () => void;
  /** Contador de notificacoes */
  notificationCount?: number;
  /** Acoes adicionais */
  children?: ReactNode;
}

export function MobileHeaderActions({
  onRefresh,
  isRefreshing = false,
  onNotifications,
  notificationCount = 0,
  children,
}: MobileHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Refresh */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 w-8"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
        </Button>
      )}

      {/* Notifications */}
      {onNotifications && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNotifications}
          className="relative h-8 w-8"
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>
      )}

      {/* Custom Actions */}
      {children}
    </div>
  );
}

// ==============================================================================
// EXEMPLO DE USO NO LAYOUT
// ==============================================================================
//
// import { MobileHeader, MobileHeaderActions } from "./mobile-header";
//
// export function AppShell({ children }) {
//   return (
//     <SidebarProvider>
//       <AppSidebar />
//       <SidebarInset>
//         {/* LAY025: Mobile Header */}
//         <MobileHeader
//           brandName="Meu App"
//           actions={
//             <MobileHeaderActions
//               onRefresh={handleRefresh}
//               isRefreshing={isLoading}
//               onNotifications={() => router.push("/notifications")}
//               notificationCount={5}
//             />
//           }
//         />
//
//         <main className="flex-1 overflow-auto">
//           {children}
//         </main>
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }
