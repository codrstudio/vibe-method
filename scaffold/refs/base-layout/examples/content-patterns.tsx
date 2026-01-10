// ==============================================================================
// LAY040-LAY043: CONTENT PATTERNS
// ==============================================================================
// Referencia: specs/design-layout.md
// Padroes de conteudo reutilizaveis.
// ==============================================================================

"use client";

import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ==============================================================================
// LAY040: SEARCH BAR
// ==============================================================================
// Campo de busca com icone.
// Estrutura: Icone de busca (esquerda, dentro do input) + Input com placeholder

interface SearchBarProps {
  /** Valor atual */
  value: string;
  /** Callback de mudanca */
  onChange: (value: string) => void;
  /** Placeholder descritivo */
  placeholder?: string;
  /** Classe adicional */
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}

// ==============================================================================
// LAY041: EMPTY STATE
// ==============================================================================
// Feedback visual quando lista esta vazia.
//
// Variacoes:
// - Lista vazia (primeiro uso)
// - Sem resultados (busca sem match)

interface EmptyStateProps {
  /** Icone grande (muted) */
  icon: LucideIcon;
  /** Titulo */
  title: string;
  /** Descricao */
  description?: string;
  /** CTA (opcional) */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Classe adicional */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ==============================================================================
// EMPTY STATE VARIANTES
// ==============================================================================

/** Empty state para lista vazia (primeiro uso) */
export function EmptyListState({
  icon,
  title = "Nenhum item encontrado",
  description = "Comece adicionando o primeiro item.",
  onAdd,
  addLabel = "Adicionar",
}: {
  icon: LucideIcon;
  title?: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onAdd ? { label: addLabel, onClick: onAdd } : undefined}
    />
  );
}

/** Empty state para busca sem resultados */
export function NoResultsState({
  searchQuery,
  onClear,
}: {
  searchQuery: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="Nenhum resultado encontrado"
      description={`Nenhum item corresponde a "${searchQuery}". Tente buscar por outro termo.`}
      action={{ label: "Limpar busca", onClick: onClear }}
    />
  );
}

// ==============================================================================
// LAY042: LOADING STATE
// ==============================================================================
// Feedback visual durante carregamento.
// Implementacao: Skeleton screens (nao spinners)

interface LoadingGridProps {
  /** Numero de items skeleton */
  count?: number;
  /** Colunas responsivas */
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** Altura de cada skeleton */
  itemHeight?: string;
  /** Classe adicional */
  className?: string;
}

export function LoadingGrid({
  count = 6,
  columns = { default: 1, sm: 2, lg: 3 },
  itemHeight = "h-[140px]",
  className,
}: LoadingGridProps) {
  const gridClasses = cn(
    "grid gap-4",
    columns.default && `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    className
  );

  return (
    <div className={gridClasses}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("rounded-lg", itemHeight)} />
      ))}
    </div>
  );
}

/** Loading state para lista */
export function LoadingList({
  count = 5,
  itemHeight = "h-16",
}: {
  count?: number;
  itemHeight?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-lg", itemHeight)} />
      ))}
    </div>
  );
}

/** Loading state para cards KPI */
export function LoadingKPIs({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-xl" />
      ))}
    </div>
  );
}

// ==============================================================================
// LAY043: CONTENT GRID
// ==============================================================================
// Grid responsivo para cards.
//
// Breakpoints:
// - Mobile: 1 coluna
// - sm: 2 colunas
// - lg: 3 colunas
// - xl: 3-4 colunas

interface ContentGridProps {
  children: ReactNode;
  /** Colunas personalizadas */
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap entre items */
  gap?: number;
  /** Classe adicional */
  className?: string;
}

export function ContentGrid({
  children,
  columns = { default: 1, sm: 2, lg: 3 },
  gap = 4,
  className,
}: ContentGridProps) {
  // Monta classes de grid dinamicamente
  const colClasses = [
    columns.default && `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("grid", `gap-${gap}`, colClasses, className)}>
      {children}
    </div>
  );
}

// ==============================================================================
// EXEMPLO DE USO
// ==============================================================================
//
// import {
//   SearchBar,
//   EmptyListState,
//   NoResultsState,
//   LoadingGrid,
//   ContentGrid,
// } from "./content-patterns";
// import { Users, UserX } from "lucide-react";
//
// export default function UsersPage() {
//   const { users, isLoading, searchQuery, setSearchQuery } = useUsersStore();
//
//   const filteredUsers = users.filter(u =>
//     u.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );
//
//   return (
//     <PageContent>
//       <PageHeader icon={Users} title="Usuarios" />
//
//       {/* LAY040: Search Bar */}
//       <SearchBar
//         value={searchQuery}
//         onChange={setSearchQuery}
//         placeholder="Buscar por nome, email..."
//       />
//
//       {/* LAY042: Loading State */}
//       {isLoading && <LoadingGrid count={6} />}
//
//       {/* LAY041: Empty State - Lista vazia */}
//       {!isLoading && users.length === 0 && (
//         <EmptyListState
//           icon={UserX}
//           title="Nenhum usuario cadastrado"
//           description="Comece cadastrando o primeiro usuario."
//           onAdd={() => openModal("create")}
//           addLabel="Cadastrar Usuario"
//         />
//       )}
//
//       {/* LAY041: Empty State - Sem resultados */}
//       {!isLoading && users.length > 0 && filteredUsers.length === 0 && (
//         <NoResultsState
//           searchQuery={searchQuery}
//           onClear={() => setSearchQuery("")}
//         />
//       )}
//
//       {/* LAY043: Content Grid */}
//       {!isLoading && filteredUsers.length > 0 && (
//         <ContentGrid>
//           {filteredUsers.map((user) => (
//             <UserCard key={user.id} user={user} />
//           ))}
//         </ContentGrid>
//       )}
//     </PageContent>
//   );
// }
