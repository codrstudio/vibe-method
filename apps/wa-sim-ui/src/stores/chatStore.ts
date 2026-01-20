import { create } from 'zustand'
import type { Message } from '../types'

interface ChatState {
  // Mensagens por contato (contactId -> messages)
  messagesByContact: Record<string, Message[]>

  // Nao lidas por contato
  unreadByContact: Record<string, number>

  // Phase 2: Typing indicator por contato
  typingByContact: Record<string, boolean>

  // Phase 2: Reply/Quote - mensagem sendo respondida
  replyingTo: Message | null

  // Phase 2: Search query
  searchQuery: string

  // Actions
  addMessage: (contactId: string, message: Message, isSelectedContact: boolean) => void
  setMessages: (contactId: string, messages: Message[]) => void
  markAsRead: (contactId: string) => void
  updateMessageStatus: (contactId: string, messageId: string, status: Message['status']) => void
  clearMessages: (contactId: string) => void

  // Phase 2 Actions
  setTyping: (contactId: string, isTyping: boolean) => void
  setReplyingTo: (message: Message | null) => void
  setSearchQuery: (query: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messagesByContact: {},
  unreadByContact: {},
  typingByContact: {},
  replyingTo: null,
  searchQuery: '',

  addMessage: (contactId, message, isSelectedContact) => set((state) => {
    const messages = state.messagesByContact[contactId] || []

    // Verifica se mensagem ja existe
    if (messages.some(m => m.id === message.id)) {
      return state
    }

    return {
      messagesByContact: {
        ...state.messagesByContact,
        [contactId]: [...messages, message]
      },
      // Incrementa nao lidas se nao esta selecionado e eh inbound (mensagem recebida do business)
      unreadByContact: {
        ...state.unreadByContact,
        [contactId]: !isSelectedContact && message.direction === 'outbound'
          ? (state.unreadByContact[contactId] || 0) + 1
          : state.unreadByContact[contactId] || 0
      }
    }
  }),

  setMessages: (contactId, messages) => set((state) => ({
    messagesByContact: {
      ...state.messagesByContact,
      [contactId]: messages
    }
  })),

  markAsRead: (contactId) => set((state) => ({
    unreadByContact: { ...state.unreadByContact, [contactId]: 0 }
  })),

  updateMessageStatus: (contactId, messageId, status) => set((state) => {
    const messages = state.messagesByContact[contactId] || []
    return {
      messagesByContact: {
        ...state.messagesByContact,
        [contactId]: messages.map(m =>
          m.id === messageId ? { ...m, status } : m
        )
      }
    }
  }),

  clearMessages: (contactId) => set((state) => ({
    messagesByContact: {
      ...state.messagesByContact,
      [contactId]: []
    },
    unreadByContact: {
      ...state.unreadByContact,
      [contactId]: 0
    }
  })),

  // Phase 2 Actions
  setTyping: (contactId, isTyping) => set((state) => ({
    typingByContact: {
      ...state.typingByContact,
      [contactId]: isTyping
    }
  })),

  setReplyingTo: (message) => set({ replyingTo: message }),

  setSearchQuery: (query) => set({ searchQuery: query })
}))
