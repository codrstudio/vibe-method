import { MoreVertical, Trash2, Edit, Search as SearchIcon, ArrowLeft, LogOut } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import type { Contact } from '../../types'
import { useContactStore } from '../../stores/contactStore'
import { ContactModal } from '../contacts/ContactModal'

interface ChatHeaderProps {
  contact: Contact
  onOpenSearch: () => void
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-400',
    'bg-orange-400',
    'bg-amber-400',
    'bg-yellow-400',
    'bg-lime-400',
    'bg-green-400',
    'bg-emerald-400',
    'bg-teal-400',
    'bg-cyan-400',
    'bg-sky-400',
    'bg-blue-400',
    'bg-indigo-400',
    'bg-violet-400',
    'bg-purple-400',
    'bg-fuchsia-400',
    'bg-pink-400',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function ChatHeader({ contact, onOpenSearch }: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { deleteContact, setSelectedContact } = useContactStore()

  function handleDelete() {
    if (confirm(`Remover contato ${contact.name}?`)) {
      deleteContact(contact.id)
      setSelectedContact(null)
    }
    setShowMenu(false)
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-wa-bg-header border-b border-wa-border">
        {/* Back button - mobile only */}
        <button
          onClick={() => setSelectedContact(null)}
          className="p-2 -ml-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary md:hidden"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center',
          getAvatarColor(contact.name)
        )}>
          <span className="text-lg text-white font-medium">
            {contact.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h2 className="font-medium text-wa-text-primary">{contact.name}</h2>
          <p className="text-xs text-wa-text-secondary">{contact.phone}</p>
        </div>

        {/* Phase 2: Search button */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
          title="Buscar mensagens"
        >
          <SearchIcon className="w-5 h-5" />
        </button>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-wa-bg-dropdown rounded-lg shadow-lg border border-wa-border py-1 z-20 min-w-[150px]">
                <button
                  onClick={() => {
                    setShowEditModal(true)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-wa-text-primary hover:bg-wa-bg-hover flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-wa-text-danger hover:bg-wa-bg-hover flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
                <div className="border-t border-wa-border my-1" />
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

      {showEditModal && (
        <ContactModal
          contact={contact}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  )
}
