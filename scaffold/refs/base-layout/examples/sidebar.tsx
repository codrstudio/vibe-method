// ==============================================================================
// LAY010-LAY014: SIDEBAR COMPLETO
// ==============================================================================
// Referencia: specs/design-layout.md
// Barra lateral de navegacao principal.
// ==============================================================================

"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Settings,
  Bell,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Sun,
  Moon,
  Monitor,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ==============================================================================
// LAY014: MENU ITEM
// ==============================================================================
// Estrutura: icone + titulo + descricao (opcional) + badge (opcional)

interface MenuItem {
  title: string;
  description?: string;
  url: string;
  icon: LucideIcon;
  badge?: number; // Contador opcional
}

// ==============================================================================
// CONFIGURACAO DO MENU
// ==============================================================================

const mainMenu: MenuItem[] = [
  {
    title: "Dashboard",
    description: "Visao geral",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Notificacoes",
    description: "Alertas e avisos",
    url: "/notifications",
    icon: Bell,
    badge: 3, // Exemplo: contador de notificacoes
  },
  {
    title: "Configuracoes",
    description: "Ajustes do sistema",
    url: "/settings",
    icon: Settings,
  },
];

// ==============================================================================
// LAY010: SIDEBAR
// ==============================================================================

interface AppSidebarProps {
  brandName?: string;
  brandIcon?: LucideIcon;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userAvatarUrl?: string;
  onLogout?: () => void;
}

export function AppSidebar({
  brandName = "App Name",
  brandIcon: BrandIcon = Home,
  userName = "Usuario",
  userEmail = "usuario@email.com",
  userRole = "Usuario",
  userAvatarUrl,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const [isBrandHovered, setIsBrandHovered] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  const isCollapsed = state === "collapsed";

  // Fecha o sidebar mobile quando um item e clicado
  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Extrai iniciais do nome
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar collapsible="icon">
      {/* ================================================================== */}
      {/* LAY011: BRAND AREA                                                 */}
      {/* Comportamento: Click toggle expanded/collapsed                     */}
      {/* ================================================================== */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={toggleSidebar}
              onMouseEnter={() => setIsBrandHovered(true)}
              onMouseLeave={() => setIsBrandHovered(false)}
              className="cursor-pointer"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-200">
                {isBrandHovered ? (
                  isCollapsed ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <ChevronLeft className="size-4" />
                  )
                ) : (
                  <BrandIcon className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{brandName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  Gestao
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* ================================================================== */}
      {/* LAY012: NAV MENU                                                   */}
      {/* Estrutura: Grupos de itens com Menu Items (LAY014)                 */}
      {/* ================================================================== */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenu.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url} onClick={handleMenuClick}>
                        <item.icon />
                        <div className="grid flex-1 text-left leading-tight">
                          <span className="truncate">{item.title}</span>
                          {!isCollapsed && item.description && (
                            <span className="truncate text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                    {/* Badge opcional */}
                    {!isCollapsed && item.badge && item.badge > 0 && (
                      <SidebarMenuBadge className="bg-accent !text-accent-foreground">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* ================================================================== */}
      {/* LAY013: USER MENU                                                  */}
      {/* Estrutura: Avatar + Nome + Role + Dropdown                         */}
      {/* ================================================================== */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={userAvatarUrl} alt={userName} />
                    <AvatarFallback className="rounded-lg">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userRole}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={userAvatarUrl} alt={userName} />
                      <AvatarFallback className="rounded-lg">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Perfil */}
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" onClick={handleMenuClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                {/* Tema */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Tema
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) =>
                      setTheme(value as "light" | "dark" | "system")
                    }
                  >
                    <DropdownMenuRadioItem value="light">
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Claro</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Escuro</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>Sistema</span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
