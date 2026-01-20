/**
 * Phase 2: Theme Toggle
 * Switch between light and dark mode
 */

import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-wa-text-secondary transition-colors"
      title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  )
}
