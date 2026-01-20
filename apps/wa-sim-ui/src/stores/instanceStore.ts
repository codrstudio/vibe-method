import { create } from 'zustand'
import type { Instance } from '../types'

interface InstanceState {
  instances: Instance[]
  selectedInstance: string | null
  loading: boolean

  setInstances: (instances: Instance[]) => void
  setSelectedInstance: (instanceName: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useInstanceStore = create<InstanceState>((set) => ({
  instances: [],
  selectedInstance: null,
  loading: false,

  setInstances: (instances) => set({ instances }),

  setSelectedInstance: (instanceName) => set({ selectedInstance: instanceName }),

  setLoading: (loading) => set({ loading })
}))
