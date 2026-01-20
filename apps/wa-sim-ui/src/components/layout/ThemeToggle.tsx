/**
 * Phase 2: Theme Toggle
 * Switch between light, dark, and system mode
 */

import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'

const THEME_CONFIG = {
  system: {
    icon: Monitor,
    title: 'Tema do sistema',
    next: 'Modo claro'
  },
  light: {
    icon: Sun,
    title: 'Modo claro',
    next: 'Modo escuro'
  },
  dark: {
    icon: Moon,
    title: 'Modo escuro',
    next: 'Tema do sistema'
  }
} as const

export function ThemeToggle() {
  const { preference, cycleTheme } = useThemeStore()
  const config = THEME_CONFIG[preference]
  const Icon = config.icon

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary transition-colors"
      title={`${config.title} (clique para ${config.next})`}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}
