import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useChatStore } from '../stores/chatStore'
import { useContactStore } from '../stores/contactStore'
import { useInstanceStore } from '../stores/instanceStore'
import type { Message } from '../types'

// Detecta URL do wa-sim baseado no contexto:
// - Se acessado via proxy (/app/wa em porta 8000), usa API proxy
// - Se acessado direto (porta 8004), conecta direto ao wa-sim
function getWaSimUrl(): string {
  // Em ambiente de build, usa env var se disponivel
  if (import.meta.env.VITE_WA_SIM_URL) {
    return import.meta.env.VITE_WA_SIM_URL
  }

  // Detecta se esta via proxy do Next.js (porta 8000)
  const isViaProxy = window.location.port === '8000' || window.location.port === ''

  if (isViaProxy) {
    // Via proxy: WebSocket nao passa pelo rewrite do Next.js
    // Conecta diretamente ao wa-sim (assumindo same network)
    return 'http://localhost:8003'
  }

  // Acesso direto ao wa-sim-ui
  return 'http://localhost:8003'
}

const WA_SIM_URL = getWaSimUrl()

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

  // Join da instancia na conexao inicial (baseado na URL)
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const handleConnect = () => {
      // Pega instancia da URL diretamente
      const params = new URLSearchParams(window.location.search)
      const instanceFromUrl = params.get('instance')

      // Ou do path /app/wa/channels/:instanceName
      const pathMatch = window.location.pathname.match(/\/(?:app\/)?wa\/channels\/([^/]+)/)
      const instanceFromPath = pathMatch ? pathMatch[1] : null

      const instance = instanceFromUrl || instanceFromPath

      if (instance) {
        console.log('[Socket] Auto-joining instance from URL:', instance)
        socket.emit('join:instance', instance)
      }
    }

    socket.on('connect', handleConnect)

    // Se ja conectou, faz join agora
    if (socket.connected) {
      handleConnect()
    }

    return () => {
      socket.off('connect', handleConnect)
    }
  }, [])

  return socketRef.current
}
