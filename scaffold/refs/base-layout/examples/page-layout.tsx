// ==============================================================================
// LAY020-LAY023: PAGE STRUCTURE
// ==============================================================================
// Referencia: specs/design-layout.md
// Container principal de cada pagina.
// ==============================================================================

"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ==============================================================================
// LAY020: PAGE CONTENT
// ==============================================================================
// Espacamento: p-4 md:p-6 com space-y-6 entre secoes

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("space-y-6 p-4 md:p-6", className)}>
      {children}
    </div>
  );
}

// ==============================================================================
// LAY021: PAGE HEADER
// ==============================================================================
// Estrutura:
// - Esquerda: icone (em container com bg) + titulo + subtitulo
// - Direita: LAY023 Action Bar

interface PageHeaderProps {
  /** Icone da pagina */
  icon: LucideIcon;
  /** Titulo principal (h1) */
  title: string;
  /** Subtitulo (contador, descricao) */
  subtitle?: string;
  /** Acoes no lado direito (LAY023: Action Bar) */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Esquerda: Icone + Titulo + Subtitulo */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Direita: LAY023 Action Bar */}
      {actions && (
        <div className="flex items-center gap-2 sm:gap-3">{actions}</div>
      )}
    </div>
  );
}

// ==============================================================================
// LAY023: ACTION BAR
// ==============================================================================
// Agrupamento de acoes no lado direito do Page Header
// Ordem sugerida: View toggles -> Filtros -> Refresh -> Acao primaria

interface ActionBarProps {
  children: ReactNode;
  className?: string;
}

export function ActionBar({ children, className }: ActionBarProps) {
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      {children}
    </div>
  );
}

// ==============================================================================
// REFRESH BUTTON (Componente comum em Action Bar)
// ==============================================================================

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export function RefreshButton({
  onClick,
  isLoading = false,
  className,
}: RefreshButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={isLoading}
      className={cn("hidden md:flex", className)}
    >
      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
    </Button>
  );
}

// ==============================================================================
// LAY022: PAGE BODY
// ==============================================================================
// Area de conteudo principal da pagina

interface PageBodyProps {
  children: ReactNode;
  className?: string;
}

export function PageBody({ children, className }: PageBodyProps) {
  return <div className={className}>{children}</div>;
}

// ==============================================================================
// EXEMPLO DE USO
// ==============================================================================
//
// import { PageContent, PageHeader, ActionBar, RefreshButton } from "./page-layout";
// import { Users, Plus } from "lucide-react";
//
// export default function UsersPage() {
//   return (
//     <PageContent>
//       <PageHeader
//         icon={Users}
//         title="Usuarios"
//         subtitle="10 usuarios cadastrados"
//         actions={
//           <ActionBar>
//             <RefreshButton onClick={handleRefresh} isLoading={isLoading} />
//             <Button onClick={handleCreate}>
//               <Plus className="h-4 w-4 mr-2" />
//               Novo Usuario
//             </Button>
//           </ActionBar>
//         }
//       />
//
//       <PageBody>
//         {/* Conteudo: Search, Filters, Grid/List, Empty State, etc */}
//       </PageBody>
//     </PageContent>
//   );
// }
