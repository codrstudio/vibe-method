"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Check,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { useNavigation } from "@/lib/navigation"
import { useSession } from "@/lib/hooks/use-session"
import { getInitials } from "@/lib/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { setTheme, theme } = useTheme()
  const pathname = usePathname()
  const { groups } = useNavigation()
  const { user, logout } = useSession()

  const userName = user?.name || "Carregando..."
  const userEmail = user?.email || ""
  const userImage = user?.image || ""

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de navegação</SheetTitle>
          <SheetDescription>Navegue pelo aplicativo</SheetDescription>
        </SheetHeader>

        {/* Perfil do usuário */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-lg">
              <AvatarImage src={userImage} alt={userName} />
              <AvatarFallback className="rounded-lg">{getInitials(userName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navegação principal */}
        <div className="flex-1 overflow-y-auto">
          {groups.map((group, groupIndex) => (
            <React.Fragment key={group.label || groupIndex}>
              {groupIndex > 0 && <Separator />}
              <div className="p-2">
                {group.label && (
                  <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const isActive = pathname === item.url

                  return (
                    <Link
                      key={item.title}
                      href={item.url}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted ${
                        isActive ? "bg-muted font-medium" : ""
                      } ${item.description ? "flex-col items-start gap-0.5" : ""}`}
                      onClick={() => onOpenChange(false)}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                        <span>{item.title}</span>
                      </div>
                      {item.description && (
                        <span className="text-xs text-muted-foreground ml-7">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Footer com tema e logout */}
        <div className="border-t p-2">
          <Separator className="my-2" />
          <p className="px-3 py-1 text-xs font-medium text-muted-foreground">
            Tema
          </p>
          <div className="flex gap-1 px-2">
            <Button
              variant={theme === "light" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4 mr-1" />
              Claro
              {theme === "light" && <Check className="h-3 w-3 ml-1" />}
            </Button>
            <Button
              variant={theme === "dark" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4 mr-1" />
              Escuro
              {theme === "dark" && <Check className="h-3 w-3 ml-1" />}
            </Button>
            <Button
              variant={theme === "system" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-4 w-4 mr-1" />
              Auto
              {theme === "system" && <Check className="h-3 w-3 ml-1" />}
            </Button>
          </div>
          <Separator className="my-2" />
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
