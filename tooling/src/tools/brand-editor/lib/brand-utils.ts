export interface BrandPalette {
  background: string
  foreground: string
  card: string
  primary: string
  secondary: string
  muted: string
  accent: string
  border: string
  input: string
  ring: string
}

export interface BrandTokens {
  [key: string]: string
}

export interface BrandCustom {
  [key: string]: string
}

export interface BrandTheme {
  palette: BrandPalette
  tokens: BrandTokens
  custom: BrandCustom
}

export interface BrandData {
  brand: string
  title: string
  description: string
  slogan: string
  themes: {
    light: BrandTheme
    dark: BrandTheme
  }
}

export interface BrandEntry {
  id: string
  data: BrandData
}

export const PALETTE_KEYS: (keyof BrandPalette)[] = [
  'background',
  'foreground',
  'card',
  'primary',
  'secondary',
  'muted',
  'accent',
  'border',
  'input',
  'ring',
]

export const TOKEN_GROUPS = {
  foregrounds: [
    'card-foreground',
    'primary-foreground',
    'secondary-foreground',
    'muted-foreground',
    'accent-foreground',
  ],
  popovers: [
    'popover',
    'popover-foreground',
  ],
  destructive: [
    'destructive',
    'destructive-foreground',
  ],
  sidebar: [
    'sidebar',
    'sidebar-foreground',
    'sidebar-primary',
    'sidebar-primary-foreground',
    'sidebar-accent',
    'sidebar-accent-foreground',
    'sidebar-border',
    'sidebar-ring',
  ],
  charts: [
    'chart-1',
    'chart-2',
    'chart-3',
    'chart-4',
    'chart-5',
  ],
}

export const CUSTOM_GROUPS = {
  semantic: [
    'trace',
    'trace-foreground',
    'info',
    'info-foreground',
    'highlight',
    'highlight-foreground',
    'success',
    'success-foreground',
    'warning',
    'warning-foreground',
    'critical',
    'critical-foreground',
  ],
}

/**
 * Resolve token references like {foreground} to actual hex values
 */
export function resolveTokenValue(
  value: string | undefined,
  palette: BrandPalette,
  tokens: BrandTokens,
  custom?: BrandCustom
): string {
  if (!value) {
    return '#FF00FF' // Fallback magenta for missing values
  }

  if (!value.startsWith('{')) {
    return value
  }

  const refKey = value.slice(1, -1)

  if (refKey in palette) {
    return palette[refKey as keyof BrandPalette]
  }

  if (refKey in tokens) {
    return resolveTokenValue(tokens[refKey], palette, tokens, custom)
  }

  if (custom && refKey in custom) {
    return resolveTokenValue(custom[refKey], palette, tokens, custom)
  }

  return value
}

/**
 * Check if a token value is a reference
 */
export function isReference(value: string | undefined): boolean {
  if (!value) return false
  return value.startsWith('{') && value.endsWith('}')
}

/**
 * Get reference key from value
 */
export function getReferenceKey(value: string | undefined): string | null {
  if (!value || !isReference(value)) return null
  return value.slice(1, -1)
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  ).toUpperCase()
}

/**
 * Validate hex color
 */
export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(hex)
}

/**
 * Format hex with uppercase
 */
export function formatHex(hex: string | undefined): string {
  if (!hex) return '#000000'
  if (!hex.startsWith('#')) {
    hex = '#' + hex
  }
  return hex.toUpperCase()
}

/**
 * Get contrast color (black or white) for a given background
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#000000'

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// ============ API Functions ============

/**
 * Fetch all brands from API
 */
export async function fetchBrands(): Promise<{ brands: BrandEntry[]; currentBrand: string | null }> {
  const response = await fetch('/api/brands')
  if (!response.ok) {
    throw new Error('Falha ao carregar brands')
  }
  return response.json()
}

/**
 * Save brand to API
 */
export async function saveBrand(id: string, data: BrandData): Promise<void> {
  const response = await fetch(`/api/brands/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Falha ao salvar brand')
  }
}

/**
 * Export brand data to downloadable JSON
 */
export function downloadBrandJson(data: BrandData, filename = 'brand.json') {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Apply brand to system (generates globals.css, updates manifest, etc.)
 */
export async function applyBrand(id: string): Promise<{ success: boolean; output?: string; error?: string }> {
  const response = await fetch(`/api/brands/${id}/apply`, {
    method: 'POST',
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error || 'Falha ao aplicar brand')
  }
  return result
}
