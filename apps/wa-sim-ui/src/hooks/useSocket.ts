import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useChatStore } from '../stores/chatStore'
import { useContactStore } from '../stores/contactStore'
import { useInstanceStore } from '../stores/instanceStore'
import type { Message } from '../types'

const WA_SIM_URL = 'http://localhost:8003'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { addMessage, updateMessageStatus } = useChatStore()
  const { getContactByPhone, selectedContactId } = useContactStore()
  const { selectedInstance, setInstances, instances } = useInstanceStore()

  useEffect(() => {
    // Conectar ao Socket.IO do wa-sim
    socketRef.current = io(WA_SIM_URL, {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('connect', () => {
      console.log('[Socket] Connected to wa-sim')
    })

    socketRef.current.on('connect_error', (err) => {
      console.log('[Socket] Connection error:', err.message)
    })

    // Receber mensagens novas
    socketRef.current.on('message:new', ({ instanceName, message }: { instanceName: string; message: Message }) => {
      console.log('[Socket] New message:', instanceName, message)

      // Encontra o contato pelo telefone
      const contact = getContactByPhone(message.remoteJid)
      if (contact) {
        const isSelected = selectedContactId === contact.id
        addMessage(contact.id, message, isSelected)
      }
    })

    // Atualizar status de mensagem
    socketRef.current.on('message:status', ({ messageId, status }: { messageId: string; status: Message['status'] }) => {
      console.log('[Socket] Message status:', messageId, status)

      // Atualiza em todos os contatos (simplificacao)
      // Em producao, seria melhor ter o contactId junto
      const { messagesByContact } = useChatStore.getState()
      for (const contactId of Object.keys(messagesByContact)) {
        updateMessageStatus(contactId, messageId, status)
      }
    })

    // Status de instancia mudou
    socketRef.current.on('instance:status', ({ instanceName, status }: { instanceName: string; status: string }) => {
      console.log('[Socket] Instance status:', instanceName, status)

      // Atualiza lista de instancias
      const updatedInstances = instances.map(i =>
        i.instanceName === instanceName
          ? { ...i, status: status as 'connected' | 'disconnected' }
          : i
      )
      setInstances(updatedInstances)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  // Entrar na sala da instancia selecionada
  useEffect(() => {
    if (selectedInstance && socketRef.current?.connected) {
      console.log('[Socket] Joining instance:', selectedInstance)
      socketRef.current.emit('join:instance', selectedInstance)
    }
  }, [selectedInstance])

  return socketRef.current
}
