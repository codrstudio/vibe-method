import { ChevronRight, Radio } from 'lucide-react'
import { useInstanceStore } from '../../stores/instanceStore'
import { ChannelSelectionModal } from '../channels'

export function InstanceSelector() {
  const {
    instances,
    selectedInstance,
    loading,
    showChannelSelector,
    setShowChannelSelector
  } = useInstanceStore()

  const connectedInstances = instances.filter(i => i.status === 'connected')
  const currentInstance = connectedInstances.find(i => i.instanceName === selectedInstance)

  function handleClick() {
    setShowChannelSelector(true)
  }

  function handleClose() {
    setShowChannelSelector(false)
  }

  if (loading) {
    return (
      <div className="text-sm text-wa-text-secondary px-3 py-2">
        Carregando instancias...
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-wa-bg-hover active:bg-wa-bg-active transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-wa-green-primary/20 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-wa-green-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {currentInstance ? (
            <>
              <p className="text-base font-medium text-wa-text-primary truncate">
                {currentInstance.instanceName}
              </p>
              <p className="text-sm text-wa-text-secondary truncate">
                {currentInstance.phoneNumber || 'Sem numero'}
              </p>
            </>
          ) : connectedInstances.length > 0 ? (
            <>
              <p className="text-base font-medium text-wa-text-primary">
                Selecionar canal
              </p>
              <p className="text-sm text-wa-text-secondary">
                {connectedInstances.length} canal(is) disponivel(is)
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-wa-text-primary">
                Nenhum canal
              </p>
              <p className="text-sm text-wa-text-secondary">
                Conecte um canal no painel
              </p>
            </>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-wa-text-secondary shrink-0" />
      </button>

      <ChannelSelectionModal open={showChannelSelector} onClose={handleClose} />
    </>
  )
}
