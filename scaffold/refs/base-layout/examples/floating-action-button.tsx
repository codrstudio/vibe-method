// ==============================================================================
// LAY030: FLOATING ACTION BUTTON (FAB)
// ==============================================================================
// Referencia: specs/design-layout.md
// Botao flutuante para acao primaria contextual.
// ==============================================================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, X, type LucideIcon } from "lucide-react";

// ==============================================================================
// TIPOS
// ==============================================================================

export interface FABAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "accent";
}

interface FloatingActionButtonProps {
  /** Acoes para FAB expandido (speed dial) */
  actions?: FABAction[];
  /** Acao principal para FAB simples */
  onClick?: () => void;
  /** Icone principal (default: Plus) */
  icon?: LucideIcon;
  /** Label para acessibilidade e hover */
  label?: string;
  /** Posicao do FAB */
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  /** Offset do bottom */
  bottomOffset?: string;
  /** Cor de fundo */
  variant?: "default" | "destructive" | "outline" | "secondary" | "accent";
  /** Classe adicional */
  className?: string;
  /** Esconder em desktop */
  mobileOnly?: boolean;
}

// ==============================================================================
// LAY030: FLOATING ACTION BUTTON
// ==============================================================================
// Posicao: Fixo, bottom-right, acima de navegacao mobile
//
// Estrutura:
// - Botao principal (icone + label no hover)
// - Speed dial (acoes secundarias, opcional)
// - Backdrop com blur (quando expandido)
//
// Comportamento:
// - Simples: click executa acao
// - Speed dial: click expande submenu
// - Hover: mostra label
// - Expandido: backdrop blur no fundo

const positionClasses = {
  "bottom-right": "right-4",
  "bottom-left": "left-4",
  "bottom-center": "left-1/2 -translate-x-1/2",
};

export function FloatingActionButton({
  actions,
  onClick,
  icon: Icon = Plus,
  label = "Acao",
  position = "bottom-right",
  bottomOffset = "bottom-6",
  variant = "default",
  className,
  mobileOnly = false,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasSpeedDial = actions && actions.length > 0;

  const handleMainClick = () => {
    if (hasSpeedDial) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "fixed z-50",
        bottomOffset,
        positionClasses[position],
        mobileOnly && "md:hidden",
        className
      )}
    >
      {/* Speed Dial Actions */}
      {hasSpeedDial && isExpanded && (
        <div className="absolute bottom-16 right-1 flex flex-col-reverse gap-3 mb-2">
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Label */}
                <span className="bg-background/95 backdrop-blur-sm text-foreground text-sm px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap border">
                  {action.label}
                </span>
                {/* Action Button */}
                <Button
                  size="icon"
                  variant={action.variant || "secondary"}
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={() => {
                    action.onClick();
                    setIsExpanded(false);
                  }}
                >
                  <ActionIcon className="h-5 w-5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Backdrop when expanded or hovered */}
      {(isExpanded || isHovered) && (
        <div
          className={cn(
            "fixed inset-0 -z-10 transition-all duration-200",
            isExpanded
              ? "bg-background/50 backdrop-blur-sm"
              : "bg-background/30 backdrop-blur-[2px]"
          )}
          onClick={() => {
            setIsExpanded(false);
            setIsHovered(false);
          }}
        />
      )}

      {/* Main FAB with label on hover */}
      <div
        className="flex items-center gap-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isExpanded && setIsHovered(false)}
      >
        {/* Label - appears on hover (not when expanded) */}
        {(isHovered || isExpanded) && !isExpanded && (
          <span className="bg-background/95 backdrop-blur-sm text-foreground text-sm px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap border animate-in fade-in slide-in-from-right-2 duration-200">
            {label}
          </span>
        )}

        {/* Main FAB Button */}
        <Button
          size="icon"
          variant={variant}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform",
            isExpanded && "rotate-45"
          )}
          onClick={handleMainClick}
          aria-label={label}
        >
          {isExpanded ? <X className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}

// ==============================================================================
// EXEMPLO DE USO
// ==============================================================================
//
// // FAB simples (uma acao)
// <FloatingActionButton
//   icon={UserPlus}
//   label="Novo usuario"
//   onClick={() => openModal("create")}
// />
//
// // FAB com speed dial (multiplas acoes)
// <FloatingActionButton
//   icon={Download}
//   label="Exportar"
//   variant="accent"
//   actions={[
//     {
//       icon: FileText,
//       label: "Exportar PDF",
//       onClick: handleExportPDF,
//     },
//     {
//       icon: FileSpreadsheet,
//       label: "Exportar Excel",
//       onClick: handleExportExcel,
//     },
//   ]}
// />
//
// // FAB apenas em mobile
// <FloatingActionButton
//   icon={Plus}
//   label="Nova tarefa"
//   onClick={handleCreate}
//   mobileOnly
// />
