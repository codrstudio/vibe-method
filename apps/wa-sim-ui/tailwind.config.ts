import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wa: {
          'green-primary': '#00a884',
          'green-dark': '#008069',
          'green-light': '#d9fdd3',
          'green-lighter': '#e7ffdb',
          'bg-chat': '#efeae2',
          'bg-sidebar': '#ffffff',
          'bg-header': '#f0f2f5',
          'bg-input': '#f0f2f5',
          'bubble-out': '#d9fdd3',
          'bubble-in': '#ffffff',
          'text-primary': '#111b21',
          'text-secondary': '#667781',
          'check-sent': '#667781',
          'check-read': '#53bdeb',
          'border': '#e9edef',
        }
      }
    },
  },
  plugins: [],
} satisfies Config
