import { useState, useCallback, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  hexToRgb,
  rgbToHex,
  isValidHex,
  formatHex,
  getContrastColor,
} from '../lib/brand-utils'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  label: string
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hexInput, setHexInput] = useState(color)
  const [rgb, setRgb] = useState(() => hexToRgb(color) || { r: 0, g: 0, b: 0 })

  useEffect(() => {
    setHexInput(color)
    const newRgb = hexToRgb(color)
    if (newRgb) setRgb(newRgb)
  }, [color])

  const handleHexChange = useCallback(
    (value: string) => {
      setHexInput(value)
      if (isValidHex(value)) {
        const formatted = formatHex(value)
        onChange(formatted)
        const newRgb = hexToRgb(formatted)
        if (newRgb) setRgb(newRgb)
      }
    },
    [onChange]
  )

  const handleRgbChange = useCallback(
    (channel: 'r' | 'g' | 'b', value: string) => {
      const num = parseInt(value, 10)
      if (isNaN(num)) return

      const newRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, num)) }
      setRgb(newRgb)

      const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
      setHexInput(hex)
      onChange(hex)
    },
    [rgb, onChange]
  )

  const handlePickerChange = useCallback(
    (newColor: string) => {
      const formatted = formatHex(newColor)
      setHexInput(formatted)
      onChange(formatted)
      const newRgb = hexToRgb(formatted)
      if (newRgb) setRgb(newRgb)
    },
    [onChange]
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
      onChange(formatted)
      const newRgb = hexToRgb(formatted)
      if (newRgb) setRgb(newRgb)
    } catch {
      // User cancelled
    }
  }, [onChange])

  const contrastColor = getContrastColor(color)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded border border-border shrink-0 transition-transform hover:scale-105"
          style={{ backgroundColor: color }}
          title={`Editar ${label}`}
        />
        <span className="text-sm font-medium flex-1 truncate">{label}</span>
        <code
          className="text-xs px-2 py-1 rounded font-mono"
          style={{
            backgroundColor: color,
            color: contrastColor,
          }}
        >
          {color}
        </code>
      </div>

      {isOpen && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <HexColorPicker color={color} onChange={handlePickerChange} />

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
        </div>
      )}
    </div>
  )
}
