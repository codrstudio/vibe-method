/**
 * Phase 2: Search Bar
 * Search messages in chat history
 */

import { useState } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import type { Message } from '../../types'

interface SearchBarProps {
  contactId: string
  onClose: () => void
  onNavigateToMessage: (messageId: string) => void
}

export function SearchBar({ contactId, onClose, onNavigateToMessage }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const { messagesByContact } = useChatStore()

  const messages = messagesByContact[contactId] || []

  // Find matching messages
  const matches = query.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(query.toLowerCase())
      )
    : []

  function handlePrevious() {
    if (matches.length === 0) return
    const newIndex = currentIndex > 0 ? currentIndex - 1 : matches.length - 1
    setCurrentIndex(newIndex)
    onNavigateToMessage(matches[newIndex].id)
  }

  function handleNext() {
    if (matches.length === 0) return
    const newIndex = currentIndex < matches.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(newIndex)
    onNavigateToMessage(matches[newIndex].id)
  }

  function handleQueryChange(newQuery: string) {
    setQuery(newQuery)
    setCurrentIndex(0)
    // Navigate to first match
    const newMatches = newQuery.trim()
      ? messages.filter((m) =>
          m.text.toLowerCase().includes(newQuery.toLowerCase())
        )
      : []
    if (newMatches.length > 0) {
      onNavigateToMessage(newMatches[0].id)
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-wa-bg-modal border-b border-wa-border">
      <Search className="w-5 h-5 text-wa-text-secondary flex-shrink-0" />

      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Buscar mensagens..."
        className="flex-1 bg-transparent text-sm outline-none text-wa-text-primary placeholder:text-wa-text-secondary"
        autoFocus
      />

      {query && (
        <span className="text-xs text-wa-text-secondary flex-shrink-0">
          {matches.length > 0
            ? `${currentIndex + 1} de ${matches.length}`
            : 'Nenhum resultado'}
        </span>
      )}

      {matches.length > 0 && (
        <>
          <button
            onClick={handlePrevious}
            className="p-1 rounded hover:bg-wa-bg-hover text-wa-text-secondary"
            title="Anterior"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded hover:bg-wa-bg-hover text-wa-text-secondary"
            title="Proximo"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </>
      )}

      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-wa-bg-hover text-wa-text-secondary"
        title="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
