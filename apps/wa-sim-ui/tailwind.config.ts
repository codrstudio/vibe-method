import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Dark mode is controlled by CSS variables, not Tailwind's dark: prefix
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All colors use CSS variables that change with .dark class
        wa: {
          'green-primary': 'var(--wa-green-primary)',
          'green-dark': 'var(--wa-green-dark)',
          'green-light': 'var(--wa-green-light)',
          'green-lighter': 'var(--wa-green-lighter)',
          'bg-chat': 'var(--wa-bg-chat)',
          'bg-sidebar': 'var(--wa-bg-sidebar)',
          'bg-header': 'var(--wa-bg-header)',
          'bg-input': 'var(--wa-bg-input)',
          'bg-hover': 'var(--wa-bg-hover)',
          'bg-active': 'var(--wa-bg-active)',
          'bg-modal': 'var(--wa-bg-modal)',
          'bg-dropdown': 'var(--wa-bg-dropdown)',
          'bubble-out': 'var(--wa-bubble-out)',
          'bubble-in': 'var(--wa-bubble-in)',
          'text-primary': 'var(--wa-text-primary)',
          'text-secondary': 'var(--wa-text-secondary)',
          'text-danger': 'var(--wa-text-danger)',
          'check-sent': 'var(--wa-check-sent)',
          'check-read': 'var(--wa-check-read)',
          'border': 'var(--wa-border)',
          'overlay': 'var(--wa-overlay)',
        }
      }
    },
  },
  plugins: [],
} satisfies Config
