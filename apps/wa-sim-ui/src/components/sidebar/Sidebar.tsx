import { useState, useEffect } from 'react'
import { Search, Plus, RefreshCw, Volume2, VolumeX, MoreVertical, LogOut } from 'lucide-react'
import { ContactList } from './ContactList'
import { InstanceSelector } from './InstanceSelector'
import { ContactModal } from '../contacts/ContactModal'
import { ThemeToggle } from '../layout/ThemeToggle'
import { api } from '../../services/api'
import { useInstanceStore } from '../../stores/instanceStore'
import { useSoundSettings } from '../../hooks/useNotificationSound'

export function Sidebar() {
  const [search, setSearch] = useState('')
  const [showContactModal, setShowContactModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { setInstances, setLoading } = useInstanceStore()
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } = useSoundSettings()

  // Carrega instancias ao iniciar
  useEffect(() => {
    loadInstances()
  }, [])

  async function loadInstances() {
    setLoading(true)
    try {
      const { data } = await api.getInstances()
      setInstances(data)
    } catch (err) {
      console.error('Erro ao carregar instancias:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 bg-wa-bg-header border-b border-wa-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-wa-text-primary">WhatsApp Simulator</h1>
          <div className="flex items-center gap-1">
            {/* Phase 2: Theme toggle */}
            <ThemeToggle />

            {/* Phase 2: Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
              title={soundEnabled ? 'Desativar som' : 'Ativar som'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={loadInstances}
              className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
              title="Atualizar instancias"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
              title="Novo contato"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Menu mobile-only */}
            <div className="relative md:hidden">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
                title="Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-wa-bg-dropdown rounded-lg shadow-lg border border-wa-border py-1 z-20 min-w-[120px]">
                    <button
                      onClick={() => window.location.href = '/app'}
                      className="w-full px-4 py-2 text-left text-sm text-wa-text-primary hover:bg-wa-bg-hover flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Instance Selector */}
        <InstanceSelector />
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-wa-bg-sidebar">
        <div className="flex items-center gap-3 px-3 py-1 bg-wa-bg-input rounded-lg">
          <Search className="w-4 h-4 text-wa-text-secondary" />
          <input
            type="text"
            placeholder="Pesquisar contato"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-wa-text-secondary text-wa-text-primary"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto bg-wa-bg-sidebar">
        <ContactList searchFilter={search} />
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </>
  )
}
