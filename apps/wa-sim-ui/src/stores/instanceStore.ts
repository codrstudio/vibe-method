import { create } from 'zustand'
import type { Instance } from '../types'

/**
 * Extrai instanceName da URL
 * Suporta: /app/wa/channels/:instanceName ou ?instance=
 */
function getInstanceFromUrl(): string | null {
  const pathname = window.location.pathname
  const search = window.location.search

  // Tenta /app/wa/channels/:instanceName
  const match = pathname.match(/\/(?:app\/)?wa\/channels\/([^/]+)/)
  if (match) {
    return match[1]
  }

  // Fallback: ?instance=
  const params = new URLSearchParams(search)
  return params.get('instance')
}

interface InstanceState {
  instances: Instance[]
  selectedInstance: string | null
  loading: boolean
  showChannelSelector: boolean

  setInstances: (instances: Instance[]) => void
  setSelectedInstance: (instanceName: string | null) => void
  setLoading: (loading: boolean) => void
  setShowChannelSelector: (show: boolean) => void
  initFromUrl: () => void
}

export const useInstanceStore = create<InstanceState>((set) => ({
  instances: [],
  selectedInstance: getInstanceFromUrl(),
  loading: false,
  showChannelSelector: false,

  setInstances: (instances) => set({ instances }),

  setShowChannelSelector: (show) => set({ showChannelSelector: show }),

  setSelectedInstance: (instanceName) => {
    set({ selectedInstance: instanceName })
    // Atualiza URL sem recarregar
    if (instanceName) {
      const basePath = window.location.pathname.startsWith('/app/wa') ? '/app/wa' : '/app/wa'
      window.history.replaceState(null, '', `${basePath}/channels/${instanceName}`)
    }
  },

  setLoading: (loading) => set({ loading }),

  initFromUrl: () => {
    const instance = getInstanceFromUrl()
    if (instance) {
      set({ selectedInstance: instance })
    }
  }
}))
