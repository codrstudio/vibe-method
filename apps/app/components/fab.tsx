"use client"

import * as React from "react"
import {
  Plus,
  X,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FABMenuItem {
  icon: React.ElementType
  label: string
  highlight?: "primary" | "secondary" | "accent" | "destructive"
}

const menuItems: FABMenuItem[] = [
  { icon: Zap, label: "Ação Rápida", highlight: "primary" },
  { icon: FileText, label: "Novo Documento", highlight: "secondary" },
  { icon: Users, label: "Adicionar Contato" },
  { icon: Calendar, label: "Agendar Evento" },
  { icon: MessageSquare, label: "Nova Mensagem" },
]

export function FAB() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [clickedItem, setClickedItem] = React.useState<string | null>(null)

  const handleItemClick = (label: string) => {
    setClickedItem(label)
    setIsOpen(false)
    // Auto-hide the dialog after 2 seconds
    setTimeout(() => setClickedItem(null), 2000)
  }

  const getHighlightClasses = (highlight?: string) => {
    switch (highlight) {
      case "primary":
        return "bg-primary text-primary-foreground hover:bg-primary/90"
      case "secondary":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      case "accent":
        return "bg-accent text-accent-foreground hover:bg-accent/80"
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80"
    }
  }

  return (
    <>
      {/* Overlay with blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Menu Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 md:hidden">
        {/* Menu Items - appear from bottom to top */}
        {isOpen && (
          <div className="flex flex-col-reverse gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => handleItemClick(item.label)}
                className={cn(
                  "flex items-center gap-3 rounded-full pl-4 pr-2 py-2 shadow-lg transition-all",
                  "animate-in fade-in slide-in-from-bottom-2",
                  getHighlightClasses(item.highlight)
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    item.highlight ? "bg-black/10" : "bg-black/5"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main FAB Button */}
        <Button
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform duration-200",
            isOpen && "rotate-45"
          )}
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          <span className="sr-only">{isOpen ? "Fechar" : "Adicionar"}</span>
        </Button>
      </div>

      {/* Mock Dialog */}
      {clickedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setClickedItem(null)}
          />
          <div className="relative z-10 bg-card border rounded-lg shadow-xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold mb-2">Clicado!</h3>
            <p className="text-muted-foreground">
              Você clicou em: <strong>{clickedItem}</strong>
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => setClickedItem(null)}
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
