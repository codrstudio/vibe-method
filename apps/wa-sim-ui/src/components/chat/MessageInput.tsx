import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Paperclip, Smile, Mic } from 'lucide-react'
import { useInstanceStore } from '../../stores/instanceStore'
import { useChatStore } from '../../stores/chatStore'
import { api } from '../../services/api'
import { EmojiPicker } from './EmojiPicker'
import { ReplyPreview } from './ReplyPreview'
import { AudioRecorder } from './AudioMessage'
import type { Contact, Message } from '../../types'

interface MessageInputProps {
  contact: Contact
}

export function MessageInput({ contact }: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { selectedInstance } = useInstanceStore()
  const { addMessage, replyingTo, setReplyingTo } = useChatStore()

  async function handleSend() {
    if (!text.trim() || !selectedInstance || sending) return

    const messageText = text.trim()
    setText('')
    setSending(true)

    try {
      const result = await api.sendMessage(selectedInstance, contact.phone, messageText)

      if (result.success) {
        // Adiciona mensagem localmente
        const message: Message = {
          id: result.messageId,
          direction: 'inbound', // Na perspectiva do simulador, estou enviando = inbound
          remoteJid: contact.phone,
          text: messageText,
          timestamp: new Date(),
          status: 'sent',
          // Phase 2: Include reply if replying to a message
          ...(replyingTo && {
            replyTo: {
              messageId: replyingTo.id,
              text: replyingTo.text,
              sender: replyingTo.direction === 'inbound' ? 'Voce' : contact.name
            }
          })
        }
        addMessage(contact.id, message, true)
        setReplyingTo(null) // Clear reply state
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Escape to cancel reply
    if (e.key === 'Escape' && replyingTo) {
      setReplyingTo(null)
    }
  }

  function handleEmojiSelect(emoji: string) {
    setText((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedInstance) return

    setSending(true)
    try {
      const result = await api.sendDocument(selectedInstance, contact.phone, file)

      if (result.success) {
        const message: Message = {
          id: result.messageId,
          direction: 'inbound',
          remoteJid: contact.phone,
          text: `[Documento] ${file.name}`,
          timestamp: new Date(),
          status: 'sent',
          media: {
            filename: file.name,
            mimetype: file.type,
            size: file.size
          }
        }
        addMessage(contact.id, message, true)
      }
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err)
    } finally {
      setSending(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Phase 2: Handle audio recording
  async function handleAudioRecorded(duration: number) {
    if (!selectedInstance) return

    setSending(true)
    try {
      // Send audio message (simulated)
      const result = await api.sendMessage(selectedInstance, contact.phone, `[Audio ${duration}s]`)

      if (result.success) {
        const message: Message = {
          id: result.messageId,
          direction: 'inbound',
          remoteJid: contact.phone,
          text: '',
          timestamp: new Date(),
          status: 'sent',
          audio: {
            duration
          }
        }
        addMessage(contact.id, message, true)
      }
    } catch (err) {
      console.error('Erro ao enviar audio:', err)
    } finally {
      setSending(false)
      setIsRecordingAudio(false)
    }
  }

  return (
    <div className="relative">
      {/* Phase 2: Reply Preview */}
      <ReplyPreview />

      <div className="flex items-center gap-2 px-4 py-3 bg-wa-bg-input dark:bg-wa-bg-input border-t border-wa-border dark:border-wa-border">
        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-wa-text-secondary"
            title="Emojis"
          >
            <Smile className="w-6 h-6" />
          </button>

          {/* Phase 2: Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {/* Anexo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-wa-text-secondary"
          title="Anexar arquivo"
        >
          <Paperclip className="w-6 h-6" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Digite uma mensagem"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="flex-1 px-4 py-2 bg-white dark:bg-wa-bg-header rounded-lg text-sm outline-none focus:ring-1 focus:ring-wa-green-primary disabled:opacity-50 text-wa-text-primary dark:text-wa-text-primary"
        />

        {/* Send button or Audio recorder */}
        {text.trim() ? (
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="p-2 rounded-full bg-wa-green-primary text-white hover:bg-wa-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          /* Phase 2: Audio Recorder */
          <AudioRecorder onRecorded={handleAudioRecorded} />
        )}
      </div>
    </div>
  )
}
