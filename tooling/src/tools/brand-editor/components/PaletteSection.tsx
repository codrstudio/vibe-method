import { BrandPalette, PALETTE_KEYS } from '../lib/brand-utils'
import { ColorPicker } from './ColorPicker'

interface PaletteSectionProps {
  palette: BrandPalette
  onColorChange: (key: string, value: string) => void
}

const PALETTE_LABELS: Record<keyof BrandPalette, string> = {
  background: 'Background',
  foreground: 'Foreground',
  card: 'Card',
  primary: 'Primary',
  secondary: 'Secondary',
  muted: 'Muted',
  accent: 'Accent',
  border: 'Border',
  input: 'Input',
  ring: 'Ring',
}

export function PaletteSection({ palette, onColorChange }: PaletteSectionProps) {
  return (
    <div className="space-y-3">
      {PALETTE_KEYS.map((key) => (
        <ColorPicker
          key={key}
          label={PALETTE_LABELS[key]}
          color={palette[key]}
          onChange={(value) => onColorChange(key, value)}
        />
      ))}
    </div>
  )
}
