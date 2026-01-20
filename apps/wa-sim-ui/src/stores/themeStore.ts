import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',

      setTheme: (theme) => {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(theme)
        set({ theme })
      },

      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light'
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newTheme)
        return { theme: newTheme }
      })
    }),
    {
      name: 'wa-sim-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on load
        if (state?.theme) {
          document.documentElement.classList.add(state.theme)
        }
      }
    }
  )
)
