import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  cycleTheme: () => void
  // Computed: actual theme being applied
  getEffectiveTheme: () => 'light' | 'dark'
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function applyTheme(preference: ThemePreference) {
  const effectiveTheme = preference === 'system' ? getSystemTheme() : preference
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(effectiveTheme)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system', // Default to system

      setPreference: (preference) => {
        applyTheme(preference)
        set({ preference })
      },

      cycleTheme: () => {
        const current = get().preference
        // Cycle: system -> light -> dark -> system
        const next: ThemePreference =
          current === 'system' ? 'light' :
          current === 'light' ? 'dark' : 'system'
        applyTheme(next)
        set({ preference: next })
      },

      getEffectiveTheme: () => {
        const preference = get().preference
        return preference === 'system' ? getSystemTheme() : preference
      }
    }),
    {
      name: 'wa-sim-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on load
        if (state?.preference) {
          applyTheme(state.preference)
        } else {
          // Default to system
          applyTheme('system')
        }
      }
    }
  )
)

// Listen for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useThemeStore.getState()
    if (state.preference === 'system') {
      applyTheme('system')
    }
  })
}
