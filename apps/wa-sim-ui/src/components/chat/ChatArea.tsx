import { useState } from 'react'
import { useContactStore } from '../../stores/contactStore'
import { useInstanceStore } from '../../stores/instanceStore'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { SearchBar } from './SearchBar'
import { MessageSquare, Unplug } from 'lucide-react'

export function ChatArea() {
  const { selectedContactId, contacts } = useContactStore()
  const { selectedInstance } = useInstanceStore()
  const [showSearch, setShowSearch] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

  const selectedContact = contacts.find(c => c.id === selectedContactId)

  // Estado vazio - nenhum contato selecionado
  if (!selectedContactId || !selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-wa-bg-chat chat-bg">
        <div className="bg-wa-bg-modal p-8 rounded-lg shadow-sm text-center max-w-md">
          <MessageSquare className="w-16 h-16 text-wa-green-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-wa-text-primary mb-2">
            WhatsApp Simulator
          </h2>
          <p className="text-wa-text-secondary">
            Selecione um contato para iniciar uma conversa simulada.
          </p>
          {!selectedInstance && (
            <p className="text-sm text-wa-text-danger mt-4">
              Selecione uma instancia conectada primeiro.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Sem instancia selecionada
  if (!selectedInstance) {
    return (
      <div className="flex-1 flex flex-col">
        <ChatHeader contact={selectedContact} onOpenSearch={() => setShowSearch(true)} />
        <div className="flex-1 flex items-center justify-center bg-wa-bg-chat chat-bg px-8">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-wa-bg-modal p-4 mb-4 shadow-sm">
              <Unplug className="size-8 text-wa-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-wa-text-primary mb-1">
              Nenhuma instância conectada
            </h3>
            <p className="text-sm text-wa-text-secondary max-w-xs">
              Selecione uma instância no menu superior para enviar mensagens
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader contact={selectedContact} onOpenSearch={() => setShowSearch(true)} />

      {/* Phase 2: Search bar */}
      {showSearch && (
        <SearchBar
          contactId={selectedContactId}
          onClose={() => {
            setShowSearch(false)
            setHighlightedMessageId(null)
          }}
          onNavigateToMessage={(messageId) => setHighlightedMessageId(messageId)}
        />
      )}

      <MessageList
        contactId={selectedContactId}
        highlightedMessageId={highlightedMessageId}
      />
      <MessageInput contact={selectedContact} />
    </div>
  )
}
