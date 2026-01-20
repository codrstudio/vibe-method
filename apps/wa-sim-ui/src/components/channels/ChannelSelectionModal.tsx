import { useState, useMemo } from 'react'
import { Drawer } from 'vaul'
import { MoreVertical, LogOut, Radio, Search } from 'lucide-react'
import { useInstanceStore } from '../../stores/instanceStore'
import { useMediaQuery } from '../../hooks/use-media-query'
import { Popover, PopoverContent } from '../ui/popover'
import type { Instance } from '../../types'

interface ChannelSelectionModalProps {
  open: boolean
  onClose: () => void
}

export function ChannelSelectionModal({ open, onClose }: ChannelSelectionModalProps) {
  const { instances, selectedInstance, setSelectedInstance } = useInstanceStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const connectedInstances = instances.filter(i => i.status === 'connected')

  const filteredInstances = useMemo(() => {
    if (!search.trim()) return connectedInstances
    const query = search.toLowerCase()
    return connectedInstances.filter(
      i => (i.displayName || i.instanceName).toLowerCase().includes(query) ||
           i.phoneNumber?.toLowerCase().includes(query)
    )
  }, [connectedInstances, search])

  function handleSelectChannel(instanceName: string) {
    setSelectedInstance(instanceName)
    setSearch('')
    onClose()
  }

  function handleClose() {
    setSearch('')
    onClose()
  }

  function handleExit() {
    window.close()
  }

  // Desktop: Popover com busca
  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="w-80 p-0 bg-wa-bg-primary border-wa-border"
          style={{
            position: 'fixed',
            top: '70px',
            left: '16px',
            transform: 'none'
          }}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-wa-border px-3">
            <Search className="w-4 h-4 text-wa-text-secondary opacity-50 shrink-0" />
            <input
              type="text"
              placeholder="Buscar canal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-10 bg-transparent px-2 text-sm text-wa-text-primary outline-none placeholder:text-wa-text-secondary"
              autoFocus
            />
          </div>

          {/* Channel List */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredInstances.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-wa-text-secondary">
                <Radio className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">
                  {connectedInstances.length === 0
                    ? 'Nenhum canal conectado'
                    : 'Nenhum resultado'}
                </p>
                {connectedInstances.length === 0 && (
                  <p className="text-xs mt-1 opacity-75">
                    Conecte um canal no painel principal
                  </p>
                )}
              </div>
            ) : (
              filteredInstances.map((instance) => (
                <button
                  key={instance.instanceName}
                  onClick={() => handleSelectChannel(instance.instanceName)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-colors hover:bg-wa-bg-hover ${
                    instance.instanceName === selectedInstance ? 'bg-wa-bg-active' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-wa-green-primary/20 flex items-center justify-center shrink-0">
                    <Radio className="w-5 h-5 text-wa-green-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wa-text-primary truncate">
                      {instance.displayName || instance.instanceName}
                    </p>
                    <p className="text-xs text-wa-text-secondary truncate">
                      {instance.phoneNumber || 'Sem numero'}
                    </p>
                  </div>
                  {instance.instanceName === selectedInstance && (
                    <div className="w-2.5 h-2.5 rounded-full bg-wa-green-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-wa-border p-2">
            <button
              onClick={handleExit}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-wa-text-secondary hover:bg-wa-bg-hover rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Mobile: Drawer (implementacao existente)
  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <Drawer.Portal>
        <div
          className="fixed inset-0 z-[100] bg-black/90"
          onClick={handleClose}
          aria-hidden="true"
        />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[101] outline-none"
          style={{ backgroundColor: '#111b21' }}
        >
          <div className="rounded-t-2xl max-h-[85vh] flex flex-col" style={{ backgroundColor: '#111b21' }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: '#8696a0' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-wa-border">
              <h2 className="text-lg font-semibold text-wa-text-primary">
                Selecionar Canal
              </h2>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
                  aria-label="Menu"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-wa-bg-modal border border-wa-border rounded-lg shadow-xl z-20 min-w-[150px]">
                      <button
                        onClick={handleExit}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-wa-text-primary hover:bg-wa-bg-hover"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto">
              {connectedInstances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-wa-text-secondary px-4">
                  <Radio className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-center">Nenhum canal conectado</p>
                  <p className="text-sm text-center mt-1 opacity-75">
                    Conecte um canal no painel principal
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-wa-border">
                  {connectedInstances.map((instance) => (
                    <ChannelItem
                      key={instance.instanceName}
                      instance={instance}
                      isSelected={instance.instanceName === selectedInstance}
                      onClick={() => handleSelectChannel(instance.instanceName)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

interface ChannelItemProps {
  instance: Instance
  isSelected: boolean
  onClick: () => void
}

function ChannelItem({ instance, isSelected, onClick }: ChannelItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-wa-bg-hover active:bg-wa-bg-active transition-colors ${
        isSelected ? 'bg-wa-bg-active' : ''
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-wa-green-primary/20 flex items-center justify-center shrink-0">
        <Radio className="w-6 h-6 text-wa-green-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-wa-text-primary truncate">
          {instance.displayName || instance.instanceName}
        </p>
        <p className="text-sm text-wa-text-secondary truncate">
          {instance.phoneNumber || 'Sem numero'}
        </p>
      </div>
      {isSelected && (
        <div className="w-3 h-3 rounded-full bg-wa-green-primary shrink-0" />
      )}
    </button>
  )
}
