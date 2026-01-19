import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  BrandData,
  BrandEntry,
  fetchBrands,
  saveBrand,
  applyBrand,
  downloadBrandJson,
} from './lib/brand-utils'
import { BrandEditorPanel } from './components/BrandEditorPanel'
import { ImportDialog } from './components/ImportDialog'

export default function BrandEditor() {
  const [brands, setBrands] = useState<BrandEntry[]>([])
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<BrandEntry | null>(null)
  const [originalData, setOriginalData] = useState<BrandData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBrands()
      setBrands(result.brands)
      setCurrentBrandId(result.currentBrand)

      if (result.currentBrand) {
        const current = result.brands.find((b) => b.id === result.currentBrand)
        if (current) {
          setSelectedBrand(current)
          setOriginalData(JSON.parse(JSON.stringify(current.data)))
        }
      } else if (result.brands.length > 0) {
        setSelectedBrand(result.brands[0])
        setOriginalData(JSON.parse(JSON.stringify(result.brands[0].data)))
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBrand = useCallback((brand: BrandEntry) => {
    setSelectedBrand(brand)
    setOriginalData(JSON.parse(JSON.stringify(brand.data)))
    setHasChanges(false)
  }, [])

  const handleBrandUpdate = useCallback((updatedData: BrandData) => {
    if (!selectedBrand) return
    setSelectedBrand({ ...selectedBrand, data: updatedData })
    setHasChanges(true)
  }, [selectedBrand])

  const handleSave = useCallback(async () => {
    if (!selectedBrand) return
    setSaving(true)
    try {
      await saveBrand(selectedBrand.id, selectedBrand.data)
      setOriginalData(JSON.parse(JSON.stringify(selectedBrand.data)))
      setHasChanges(false)
      setBrands((prev) => prev.map((b) => b.id === selectedBrand.id ? selectedBrand : b))
    } catch (err) {
      toast.error('Erro ao salvar', {
        description: String(err),
      })
    } finally {
      setSaving(false)
    }
  }, [selectedBrand])

  const handleApply = useCallback(async () => {
    if (!selectedBrand) return
    setApplying(true)
    try {
      // Primeiro salva
      await saveBrand(selectedBrand.id, selectedBrand.data)
      setOriginalData(JSON.parse(JSON.stringify(selectedBrand.data)))
      setHasChanges(false)
      setBrands((prev) => prev.map((b) => b.id === selectedBrand.id ? selectedBrand : b))

      // Depois aplica ao sistema
      await applyBrand(selectedBrand.id)

      // Atualiza o currentBrandId
      setCurrentBrandId(selectedBrand.id)

      toast.success('Brand aplicado!', {
        description: 'globals.css, manifest.ts e layout.tsx atualizados.',
      })
    } catch (err) {
      toast.error('Erro ao aplicar', {
        description: String(err),
      })
    } finally {
      setApplying(false)
    }
  }, [selectedBrand])

  const handleReset = useCallback(() => {
    if (!selectedBrand || !originalData) return
    setSelectedBrand({ ...selectedBrand, data: JSON.parse(JSON.stringify(originalData)) })
    setHasChanges(false)
  }, [selectedBrand, originalData])

  const handleDownload = useCallback(() => {
    if (!selectedBrand) return
    downloadBrandJson(selectedBrand.data, `${selectedBrand.id}-brand.json`)
  }, [selectedBrand])

  const handleImport = useCallback((data: BrandData) => {
    // Cria um novo brand entry com os dados importados
    const newEntry: BrandEntry = {
      id: data.brand || 'imported',
      data,
    }
    setSelectedBrand(newEntry)
    setOriginalData(null) // Sem original, tudo é "novo"
    setHasChanges(true)
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Carregando brands...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Erro ao carregar brands</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadBrands}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Brands Column */}
      <div className="w-64 flex flex-col border-r border-border bg-card">
        {/* Brands Header - Fixed */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Brands</h2>
            <Button variant="ghost" size="sm" onClick={loadBrands} title="Recarregar" className="h-7 w-7 p-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {brands.length} em specs/brand/
          </p>
        </div>

        {/* Brands List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {brands.map((brand) => {
            const isCurrent = brand.id === currentBrandId
            const isSelected = selectedBrand?.id === brand.id

            return (
              <button
                key={brand.id}
                onClick={() => handleSelectBrand(brand)}
                className={cn(
                  'w-full text-left p-2.5 rounded-lg transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border shrink-0"
                    style={{ backgroundColor: brand.data.themes.light.palette.accent }}
                  />
                  <span className="font-medium text-sm flex-1 truncate">{brand.data.title}</span>
                  {isCurrent && (
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1 py-0.5 rounded uppercase shrink-0',
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-green-500/10 text-green-600'
                      )}
                    >
                      Atual
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Editor Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedBrand ? (
          <>
            {/* Editor Header - Fixed */}
            <div className="p-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold truncate">{selectedBrand.data.title}</h2>
                    {selectedBrand.id === currentBrandId && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 uppercase shrink-0">
                        Atual
                      </span>
                    )}
                    {!brands.find(b => b.id === selectedBrand.id) && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 uppercase shrink-0">
                        Importado
                      </span>
                    )}
                    {hasChanges && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 uppercase shrink-0">
                        Não salvo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{selectedBrand.data.description}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportDialogOpen(true)}
                    className="h-7 text-xs"
                  >
                    Importar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges} className="h-7 text-xs">
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="h-7 text-xs">
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="h-7 text-xs">
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button size="sm" onClick={handleApply} disabled={applying} className="h-7 text-xs">
                    {applying ? 'Aplicando...' : 'Aplicar'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Editor Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <BrandEditorPanel
                brandData={selectedBrand.data}
                onUpdate={handleBrandUpdate}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Nenhum brand encontrado</p>
              <p className="text-sm">Verifique specs/brand/</p>
            </div>
          </div>
        )}
      </div>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImport}
      />
    </div>
  )
}
