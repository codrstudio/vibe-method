import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateBrand, parseJsonSafely, ValidationError } from '../lib/validate-brand'
import { BrandData } from '../lib/brand-utils'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (data: BrandData) => void
}

type ImportState = 'idle' | 'validating' | 'success' | 'error'

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const [state, setState] = useState<ImportState>('idle')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [validData, setValidData] = useState<BrandData | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setState('idle')
    setErrors([])
    setValidData(null)
    setFileName('')
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setState('validating')
    setErrors([])

    // Verifica extensão
    if (!file.name.endsWith('.json')) {
      setState('error')
      setErrors([{ field: '/', message: 'Por favor, selecione um arquivo .json' }])
      return
    }

    try {
      const text = await file.text()

      // Parse JSON
      const { data, error: parseError } = parseJsonSafely(text)
      if (parseError) {
        setState('error')
        setErrors([{ field: '/', message: parseError }])
        return
      }

      // Valida contra o schema
      const result = await validateBrand(data)

      if (result.valid) {
        setState('success')
        setValidData(data as BrandData)
      } else {
        setState('error')
        setErrors(result.errors)
      }
    } catch {
      setState('error')
      setErrors([{ field: '/', message: 'Não foi possível ler o arquivo. Tente novamente.' }])
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleConfirmImport = useCallback(() => {
    if (validData) {
      onImport(validData)
      handleClose()
    }
  }, [validData, onImport, handleClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Importar Brand</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {state === 'idle' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione um arquivo <code className="bg-muted px-1 rounded">brand.json</code> para importar.
                O arquivo será validado antes da importação.
              </p>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <svg
                  className={cn(
                    'w-12 h-12 mx-auto mb-3 transition-colors',
                    dragActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                <p className="font-medium mb-1">
                  {dragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo aqui'}
                </p>
                <p className="text-sm text-muted-foreground">
                  ou clique para selecionar
                </p>
              </div>
            </>
          )}

          {state === 'validating' && (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="font-medium">Validando arquivo...</p>
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          )}

          {state === 'error' && (
            <>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-destructive shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-destructive mb-2">
                      Não foi possível importar o arquivo
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">{fileName}</p>

                    {errors.length > 0 && (
                      <div className="space-y-1.5 mt-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          {errors.length === 1 ? 'Problema encontrado:' : 'Problemas encontrados:'}
                        </p>
                        <ul className="space-y-1 max-h-48 overflow-y-auto pr-2">
                          {errors.map((error, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-destructive">•</span>
                              <span>{error.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Corrija os problemas acima e tente novamente.
                Se precisar de ajuda, consulte o arquivo <code className="bg-muted px-1 rounded">brand.schema.json</code>.
              </p>
            </>
          )}

          {state === 'success' && validData && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-700 dark:text-green-400 mb-1">
                    Arquivo válido!
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">{fileName}</p>

                  <div className="bg-background rounded-md p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: validData.themes.light.palette.accent }}
                      />
                      <span className="font-medium">{validData.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{validData.description}</p>
                    {validData.slogan && (
                      <p className="text-xs italic text-muted-foreground">"{validData.slogan}"</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          {state === 'idle' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {state === 'error' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={reset}>
                Tentar novamente
              </Button>
            </>
          )}

          {state === 'success' && (
            <>
              <Button variant="outline" onClick={reset}>
                Escolher outro
              </Button>
              <Button onClick={handleConfirmImport}>
                Importar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
