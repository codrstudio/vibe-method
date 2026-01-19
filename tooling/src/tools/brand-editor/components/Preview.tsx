import { BrandTheme, resolveTokenValue } from '../lib/brand-utils'

interface PreviewProps {
  theme: BrandTheme
}

export function Preview({ theme }: PreviewProps) {
  const { palette, tokens, custom } = theme

  const resolve = (value: string | undefined) => resolveTokenValue(value, palette, tokens, custom)

  const styles = {
    background: palette.background,
    foreground: palette.foreground,
    card: palette.card,
    primary: palette.primary,
    secondary: palette.secondary,
    muted: palette.muted,
    accent: palette.accent,
    border: palette.border,
    cardFg: resolve(tokens['card-foreground']),
    primaryFg: resolve(tokens['primary-foreground']),
    secondaryFg: resolve(tokens['secondary-foreground']),
    mutedFg: resolve(tokens['muted-foreground']),
    accentFg: resolve(tokens['accent-foreground']),
    destructive: resolve(tokens['destructive']),
    destructiveFg: resolve(tokens['destructive-foreground']),
    success: resolve(custom?.['success']),
    successFg: resolve(custom?.['success-foreground']),
    warning: resolve(custom?.['warning']),
    warningFg: resolve(custom?.['warning-foreground']),
    info: resolve(custom?.['info']),
    infoFg: resolve(custom?.['info-foreground']),
    trace: resolve(custom?.['trace']),
    traceFg: resolve(custom?.['trace-foreground']),
    highlight: resolve(custom?.['highlight']),
    highlightFg: resolve(custom?.['highlight-foreground']),
    critical: resolve(custom?.['critical']),
    criticalFg: resolve(custom?.['critical-foreground']),
  }

  return (
    <div
      className="rounded-lg p-6 space-y-6"
      style={{ backgroundColor: styles.background, color: styles.foreground }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: styles.primary,
              color: styles.primaryFg,
            }}
          >
            Primary
          </button>
          <button
            className="px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: styles.secondary,
              color: styles.secondaryFg,
            }}
          >
            Secondary
          </button>
          <button
            className="px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: styles.accent,
              color: styles.accentFg,
            }}
          >
            Accent
          </button>
        </div>
      </div>

      {/* Card */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: styles.card, color: styles.cardFg }}
      >
        <h4 className="font-semibold">Surface Card</h4>
        <p className="text-sm opacity-80">
          Este é um exemplo de texto dentro de uma surface. As cores aplicadas
          seguem os tokens definidos no brand.json.
        </p>
        <div
          className="p-3 rounded text-sm"
          style={{ backgroundColor: styles.muted, color: styles.mutedFg }}
        >
          Muted background com texto
        </div>
      </div>

      {/* Semantic Colors */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold mb-3">Semantic Colors</h4>
        <div className="grid grid-cols-2 gap-2">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded text-sm"
            style={{ backgroundColor: styles.success, color: styles.successFg }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Success
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded text-sm"
            style={{ backgroundColor: styles.warning, color: styles.warningFg }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Warning
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded text-sm"
            style={{ backgroundColor: styles.destructive, color: styles.destructiveFg }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Error
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded text-sm"
            style={{ backgroundColor: styles.info, color: styles.infoFg }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Info
          </div>
        </div>
      </div>

      {/* Additional Semantic Colors */}
      <div className="grid grid-cols-3 gap-2">
        <div
          className="flex items-center justify-center px-3 py-2 rounded text-sm"
          style={{ backgroundColor: styles.trace, color: styles.traceFg }}
        >
          Trace
        </div>
        <div
          className="flex items-center justify-center px-3 py-2 rounded text-sm"
          style={{ backgroundColor: styles.highlight, color: styles.highlightFg }}
        >
          Highlight
        </div>
        <div
          className="flex items-center justify-center px-3 py-2 rounded text-sm"
          style={{ backgroundColor: styles.critical, color: styles.criticalFg }}
        >
          Critical
        </div>
      </div>

      {/* Input Example */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Input Example</label>
        <input
          type="text"
          placeholder="Digite algo..."
          className="w-full px-3 py-2 rounded border text-sm"
          style={{
            backgroundColor: styles.card,
            color: styles.cardFg,
            borderColor: styles.border,
          }}
        />
      </div>
    </div>
  )
}
