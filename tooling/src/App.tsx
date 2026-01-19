import { useState } from 'react'
import { Toaster } from 'sonner'
import { useTheme } from '@/hooks/useTheme'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import BrandEditor from './tools/brand-editor'

type Tool = 'brand-editor'

// Ícone Ferramentaria inline (de assets/icon.svg)
function ToolingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className}>
      <path
        d="m 331.7,225 c 28.3,0 54.9,11 74.9,31 l 19.4,19.4 c 15.8,-6.9 30.8,-16.5 43.8,-29.5 37.1,-37.1 49.7,-89.3 37.9,-136.7 -2.2,-9 -13.5,-12.1 -20.1,-5.5 L 413.2,178.1 345.3,166.8 334,98.9 408.4,24.5 C 415,17.9 411.8,6.6 402.7,4.3 355.3,-7.4 303.1,5.2 266.1,42.2 237.6,70.7 224.2,108.3 224.9,145.8 l 82.1,82.1 c 8.1,-1.9 16.5,-2.9 24.7,-2.9 z M 64,472 c -13.2,0 -24,-10.8 -24,-24 0,-13.3 10.7,-24 24,-24 13.3,0 24,10.7 24,24 0,13.2 -10.7,24 -24,24 z M 227.8,307 171.1,250.3 18.7,402.8 c -25,25 -25,65.5 0,90.5 25,25 65.5,25 90.5,0 L 232.8,369.7 c -7.6,-19.9 -9.9,-41.6 -5,-62.7 z"
        fill="#5a2ca0"
      />
      <path
        d="M 501.1,395.7 384,278.6 C 360.9,255.5 326.4,251 298.6,264.7 L 192,158.1 V 96 L 64,0 0,64 96,192 h 62.1 l 106.6,106.6 c -13.6,27.8 -9.2,62.3 13.9,85.4 l 117.1,117.1 c 14.6,14.6 38.2,14.6 52.7,0 l 52.7,-52.7 c 14.5,-14.6 14.5,-38.2 0,-52.7 z"
        fill="#ab37c8"
      />
    </svg>
  )
}

const TOOLS: { id: Tool; name: string; icon: JSX.Element }[] = [
  {
    id: 'brand-editor',
    name: 'Brand Editor',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
]

function AppSidebarHeader() {
  const { open, toggle } = useSidebar()

  return (
    <SidebarHeader>
      <div className="flex items-center justify-between">
        {open ? (
          <>
            <div className="flex items-center gap-2">
              <ToolingIcon className="w-5 h-5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Ferramentaria</span>
                <span className="text-[10px] text-sidebar-foreground/60">Vibe Method</span>
              </div>
            </div>
            <SidebarTrigger />
          </>
        ) : (
          <button
            onClick={toggle}
            className="group relative w-full flex items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors p-1.5"
            title="Expandir"
          >
            <ToolingIcon className="w-5 h-5 shrink-0 group-hover:opacity-0 transition-opacity" />
            <svg
              className="w-4 h-4 absolute opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </SidebarHeader>
  )
}

function AppSidebarFooter() {
  const { open } = useSidebar()
  const { theme, setTheme } = useTheme()

  return (
    <SidebarFooter>
      <div className="flex flex-col gap-2 items-center">
        <ThemeSwitcher theme={theme} onThemeChange={setTheme} vertical={!open} />
        {open && <span className="text-[10px] text-sidebar-foreground/60">v0.0.1</span>}
      </div>
    </SidebarFooter>
  )
}

export default function App() {
  const [activeTool] = useState<Tool>('brand-editor')
  const { theme } = useTheme()

  // Resolve system theme for Toaster
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <AppSidebarHeader />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {TOOLS.map((tool) => (
                  <SidebarMenuItem key={tool.id}>
                    <SidebarMenuButton isActive={activeTool === tool.id} tooltip={tool.name}>
                      {tool.icon}
                      <span>{tool.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <AppSidebarFooter />
      </Sidebar>

      <SidebarInset>
        {activeTool === 'brand-editor' && <BrandEditor />}
      </SidebarInset>

      <Toaster
        theme={resolvedTheme}
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'bg-background border-border text-foreground',
            title: 'text-foreground',
            description: 'text-muted-foreground',
            success: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
            error: 'bg-destructive/10 border-destructive/20 text-destructive',
          },
        }}
      />
    </SidebarProvider>
  )
}
