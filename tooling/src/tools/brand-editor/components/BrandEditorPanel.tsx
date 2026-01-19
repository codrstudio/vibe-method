import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BrandData } from '../lib/brand-utils'
import { PaletteSection } from './PaletteSection'
import { TokensSection } from './TokensSection'
import { Preview } from './Preview'

interface BrandEditorPanelProps {
  brandData: BrandData
  onUpdate: (data: BrandData) => void
}

export function BrandEditorPanel({ brandData, onUpdate }: BrandEditorPanelProps) {
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light')
  const [activeSection, setActiveSection] = useState<'palette' | 'tokens'>('palette')

  const updatePaletteColor = useCallback(
    (theme: 'light' | 'dark', key: string, value: string) => {
      onUpdate({
        ...brandData,
        themes: {
          ...brandData.themes,
          [theme]: {
            ...brandData.themes[theme],
            palette: {
              ...brandData.themes[theme].palette,
              [key]: value,
            },
          },
        },
      })
    },
    [brandData, onUpdate]
  )

  const updateTokenColor = useCallback(
    (theme: 'light' | 'dark', key: string, value: string) => {
      onUpdate({
        ...brandData,
        themes: {
          ...brandData.themes,
          [theme]: {
            ...brandData.themes[theme],
            tokens: {
              ...brandData.themes[theme].tokens,
              [key]: value,
            },
          },
        },
      })
    },
    [brandData, onUpdate]
  )

  const updateCustomColor = useCallback(
    (theme: 'light' | 'dark', key: string, value: string) => {
      onUpdate({
        ...brandData,
        themes: {
          ...brandData.themes,
          [theme]: {
            ...brandData.themes[theme],
            custom: {
              ...brandData.themes[theme].custom,
              [key]: value,
            },
          },
        },
      })
    },
    [brandData, onUpdate]
  )

  const currentTheme = brandData.themes[activeTheme]

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Theme Toggle */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTheme('light')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeTheme === 'light'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Light
        </button>
        <button
          onClick={() => setActiveTheme('dark')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeTheme === 'dark'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          Dark
        </button>
      </div>

      {/* Main Content: Colors + Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Colors Column */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => setActiveSection('palette')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  activeSection === 'palette'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Palette
              </button>
              <button
                onClick={() => setActiveSection('tokens')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  activeSection === 'tokens'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Tokens
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {activeSection === 'palette' ? (
              <PaletteSection
                palette={currentTheme.palette}
                onColorChange={(key, value) => updatePaletteColor(activeTheme, key, value)}
              />
            ) : (
              <TokensSection
                tokens={currentTheme.tokens}
                custom={currentTheme.custom}
                palette={currentTheme.palette}
                onTokenChange={(key, value) => updateTokenColor(activeTheme, key, value)}
                onCustomChange={(key, value) => updateCustomColor(activeTheme, key, value)}
              />
            )}
          </CardContent>
        </Card>

        {/* Preview Column */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <Preview theme={currentTheme} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
