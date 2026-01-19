import { useState, useCallback, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  BrandPalette,
  BrandTokens,
  BrandCustom,
  TOKEN_GROUPS,
  CUSTOM_GROUPS,
  PALETTE_KEYS,
  isReference,
  getReferenceKey,
  resolveTokenValue,
  getContrastColor,
  hexToRgb,
  rgbToHex,
  isValidHex,
  formatHex,
} from '../lib/brand-utils'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface TokensSectionProps {
  tokens: BrandTokens
  custom: BrandCustom
  palette: BrandPalette
  onTokenChange: (key: string, value: string) => void
  onCustomChange: (key: string, value: string) => void
}

const TOKEN_LABELS: Record<string, string> = {
  'card-foreground': 'Card Foreground',
  'primary-foreground': 'Primary Foreground',
  'secondary-foreground': 'Secondary Foreground',
  'muted-foreground': 'Muted Foreground',
  'accent-foreground': 'Accent Foreground',
  popover: 'Popover',
  'popover-foreground': 'Popover Foreground',
  destructive: 'Destructive',
  'destructive-foreground': 'Destructive Foreground',
  sidebar: 'Sidebar',
  'sidebar-foreground': 'Sidebar Foreground',
  'sidebar-primary': 'Sidebar Primary',
  'sidebar-primary-foreground': 'Sidebar Primary FG',
  'sidebar-accent': 'Sidebar Accent',
  'sidebar-accent-foreground': 'Sidebar Accent FG',
  'sidebar-border': 'Sidebar Border',
  'sidebar-ring': 'Sidebar Ring',
  'chart-1': 'Chart 1',
  'chart-2': 'Chart 2',
  'chart-3': 'Chart 3',
  'chart-4': 'Chart 4',
  'chart-5': 'Chart 5',
  trace: 'Trace',
  'trace-foreground': 'Trace Foreground',
  info: 'Info',
  'info-foreground': 'Info Foreground',
  highlight: 'Highlight',
  'highlight-foreground': 'Highlight Foreground',
  success: 'Success',
  'success-foreground': 'Success Foreground',
  warning: 'Warning',
  'warning-foreground': 'Warning Foreground',
  critical: 'Critical',
  'critical-foreground': 'Critical Foreground',
}

interface TokenItemProps {
  tokenKey: string
  value: string
  resolvedValue: string
  palette: BrandPalette
  onChange: (key: string, value: string) => void
}

function TokenItem({
  tokenKey,
  value,
  resolvedValue,
  palette,
  onChange,
}: TokenItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'reference' | 'custom'>(() =>
    isReference(value) ? 'reference' : 'custom'
  )
  const [hexInput, setHexInput] = useState(() =>
    isReference(value) ? resolvedValue : value
  )
  const [rgb, setRgb] = useState(() => {
    const hex = isReference(value) ? resolvedValue : value
    return hexToRgb(hex) || { r: 0, g: 0, b: 0 }
  })

  const isRef = isReference(value)
  const refKey = getReferenceKey(value)
  const contrastColor = getContrastColor(resolvedValue)

  useEffect(() => {
    setMode(isReference(value) ? 'reference' : 'custom')
    const hex = isReference(value) ? resolvedValue : value
    setHexInput(hex)
    const newRgb = hexToRgb(hex)
    if (newRgb) setRgb(newRgb)
  }, [value, resolvedValue])

  const handleHexChange = useCallback(
    (newHex: string) => {
      setHexInput(newHex)
      if (isValidHex(newHex)) {
        const formatted = formatHex(newHex)
        onChange(tokenKey, formatted)
        const newRgb = hexToRgb(formatted)
        if (newRgb) setRgb(newRgb)
      }
    },
    [onChange, tokenKey]
  )

  const handleRgbChange = useCallback(
    (channel: 'r' | 'g' | 'b', channelValue: string) => {
      const num = parseInt(channelValue, 10)
      if (isNaN(num)) return

      const newRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, num)) }
      setRgb(newRgb)

      const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
      setHexInput(hex)
      onChange(tokenKey, hex)
    },
    [rgb, onChange, tokenKey]
  )

  const handlePickerChange = useCallback(
    (newColor: string) => {
      const formatted = formatHex(newColor)
      setHexInput(formatted)
      onChange(tokenKey, formatted)
      const newRgb = hexToRgb(formatted)
      if (newRgb) setRgb(newRgb)
    },
    [onChange, tokenKey]
  )

  const handleReferenceSelect = useCallback(
    (paletteKey: string) => {
      onChange(tokenKey, `{${paletteKey}}`)
    },
    [onChange, tokenKey]
  )

  const handleEyedropper = useCallback(async () => {
    if (!('EyeDropper' in window)) {
      alert('EyeDropper API não suportada neste navegador')
      return
    }

    try {
      // @ts-expect-error EyeDropper is not in TypeScript DOM types yet
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      const formatted = formatHex(result.sRGBHex)
      setHexInput(formatted)
      onChange(tokenKey, formatted)
      const newRgb = hexToRgb(formatted)
      if (newRgb) setRgb(newRgb)
    } catch {
      // User cancelled
    }
  }, [onChange, tokenKey])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded border border-border shrink-0 transition-transform hover:scale-105"
          style={{ backgroundColor: resolvedValue }}
          title={`Editar ${TOKEN_LABELS[tokenKey] || tokenKey}`}
        />
        <span className="text-sm font-medium flex-1 truncate">
          {TOKEN_LABELS[tokenKey] || tokenKey}
        </span>
        <code
          className="text-xs px-2 py-1 rounded font-mono"
          style={{
            backgroundColor: resolvedValue,
            color: contrastColor,
          }}
        >
          {isRef ? `{${refKey}}` : value}
        </code>
      </div>

      {isOpen && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setMode('reference')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'reference'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Referência
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'custom'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cor Fixa
            </button>
          </div>

          {mode === 'reference' ? (
            <div className="grid grid-cols-4 gap-2">
              {PALETTE_KEYS.map((paletteKey) => {
                const paletteColor = palette[paletteKey]
                const isSelected = refKey === paletteKey
                return (
                  <button
                    key={paletteKey}
                    onClick={() => handleReferenceSelect(paletteKey)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    title={paletteColor}
                  >
                    <div
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: paletteColor }}
                    />
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {paletteKey}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <HexColorPicker color={hexInput} onChange={handlePickerChange} />

              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <Label className="w-10 text-xs">HEX</Label>
                  <Input
                    value={hexInput}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="font-mono text-sm h-8"
                    placeholder="#000000"
                  />
                  {'EyeDropper' in window && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleEyedropper}
                      title="Selecionar cor da tela"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m2 22 1-1h3l9-9" />
                        <path d="M3 21v-3l9-9" />
                        <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
                      </svg>
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <Label className="w-10 text-xs">R</Label>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.r}
                    onChange={(e) => handleRgbChange('r', e.target.value)}
                    className="font-mono text-sm h-8"
                  />
                  <Label className="w-10 text-xs">G</Label>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.g}
                    onChange={(e) => handleRgbChange('g', e.target.value)}
                    className="font-mono text-sm h-8"
                  />
                  <Label className="w-10 text-xs">B</Label>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.b}
                    onChange={(e) => handleRgbChange('b', e.target.value)}
                    className="font-mono text-sm h-8"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function TokensSection({
  tokens,
  custom,
  palette,
  onTokenChange,
  onCustomChange,
}: TokensSectionProps) {
  const getResolved = (value: string | undefined) => resolveTokenValue(value, palette, tokens, custom)

  return (
    <div className="space-y-4">
      {/* Foregrounds */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Foregrounds
        </h4>
        {TOKEN_GROUPS.foregrounds.map((key) =>
          tokens[key] !== undefined ? (
            <TokenItem
              key={key}
              tokenKey={key}
              value={tokens[key]}
              resolvedValue={getResolved(tokens[key])}
              palette={palette}
              onChange={onTokenChange}
            />
          ) : null
        )}
      </div>

      <Separator />

      {/* Popovers */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Popovers
        </h4>
        {TOKEN_GROUPS.popovers.map((key) =>
          tokens[key] !== undefined ? (
            <TokenItem
              key={key}
              tokenKey={key}
              value={tokens[key]}
              resolvedValue={getResolved(tokens[key])}
              palette={palette}
              onChange={onTokenChange}
            />
          ) : null
        )}
      </div>

      <Separator />

      {/* Destructive */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Destructive
        </h4>
        {TOKEN_GROUPS.destructive.map((key) =>
          tokens[key] !== undefined ? (
            <TokenItem
              key={key}
              tokenKey={key}
              value={tokens[key]}
              resolvedValue={getResolved(tokens[key])}
              palette={palette}
              onChange={onTokenChange}
            />
          ) : null
        )}
      </div>

      <Separator />

      {/* Sidebar */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Sidebar
        </h4>
        {TOKEN_GROUPS.sidebar.map((key) =>
          tokens[key] !== undefined ? (
            <TokenItem
              key={key}
              tokenKey={key}
              value={tokens[key]}
              resolvedValue={getResolved(tokens[key])}
              palette={palette}
              onChange={onTokenChange}
            />
          ) : null
        )}
      </div>

      <Separator />

      {/* Charts */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Charts
        </h4>
        {TOKEN_GROUPS.charts.map((key) =>
          tokens[key] !== undefined ? (
            <TokenItem
              key={key}
              tokenKey={key}
              value={tokens[key]}
              resolvedValue={getResolved(tokens[key])}
              palette={palette}
              onChange={onTokenChange}
            />
          ) : null
        )}
      </div>

      <Separator />

      {/* Custom / Semantic Colors */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Semantic Colors (Custom)
        </h4>
        {CUSTOM_GROUPS.semantic.map((key) =>
          custom?.[key] !== undefined ? (
            <TokenItem
              key={key}
              tokenKey={key}
              value={custom[key]}
              resolvedValue={getResolved(custom[key])}
              palette={palette}
              onChange={onCustomChange}
            />
          ) : null
        )}
      </div>
    </div>
  )
}
