import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MessageListProps {
  contactId: string
  highlightedMessageId?: string | null
}

function DateSeparator({ date }: { date: Date }) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label: string
  if (isSameDay(d, today)) {
    label = 'Hoje'
  } else if (isSameDay(d, yesterday)) {
    label = 'Ontem'
  } else {
    label = format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  return (
    <div className="flex justify-center my-3">
      <span className="bg-wa-bg-modal px-3 py-1 rounded-lg text-xs text-wa-text-secondary shadow-sm">
        {label}
      </span>
    </div>
  )
}

export function MessageList({ contactId, highlightedMessageId }: MessageListProps) {
  const { messagesByContact, typingByContact } = useChatStore()
  const endRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const messages = messagesByContact[contactId] || []
  const isTyping = typingByContact[contactId] || false

  // Scroll to bottom quando mensagens mudam
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isTyping])

  // Phase 2: Scroll to highlighted message when searching
  useEffect(() => {
    if (highlightedMessageId) {
      const element = document.getElementById(`message-${highlightedMessageId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlightId(highlightedMessageId)
        // Remove highlight after animation
        setTimeout(() => setHighlightId(null), 1500)
      }
    }
  }, [highlightedMessageId])

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wa-bg-chat chat-bg">
        <div className="bg-wa-bg-modal px-4 py-2 rounded-lg shadow-sm">
          <p className="text-sm text-wa-text-secondary">
            Nenhuma mensagem ainda. Envie uma mensagem para iniciar a conversa.
          </p>
        </div>
      </div>
    )
  }

  // Agrupa mensagens por dia
  let lastDate: Date | null = null

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-wa-bg-chat chat-bg px-16 py-4"
    >
      {messages.map((message) => {
        const messageDate = new Date(message.timestamp)
        const showDateSeparator = !lastDate || !isSameDay(lastDate, messageDate)
        lastDate = messageDate

        // Na UI do simulador, "inbound" sao mensagens que o cliente (simulador) envia
        // "outbound" sao mensagens que o business (app) envia
        // Entao para a perspectiva do wa-sim-ui:
        // - inbound = mensagem que EU (simulador) enviei = aparece na direita (isOwn=true)
        // - outbound = mensagem que o BUSINESS enviou = aparece na esquerda (isOwn=false)
        const isOwn = message.direction === 'inbound'

        return (
          <div key={message.id}>
            {showDateSeparator && <DateSeparator date={messageDate} />}
            <MessageBubble
              message={message}
              isOwn={isOwn}
              isHighlighted={highlightId === message.id}
            />
          </div>
        )
      })}

      {/* Phase 2: Typing indicator */}
      {isTyping && <TypingIndicator />}

      <div ref={endRef} />
    </div>
  )
}
