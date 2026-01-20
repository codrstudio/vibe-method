import { useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { clsx } from 'clsx'
import { Copy, Check } from 'lucide-react'
import type { Contact, Message } from '../../types'

interface ContactItemProps {
  contact: Contact
  isSelected: boolean
  unreadCount: number
  lastMessage?: Message
  onClick: () => void
}

function formatMessageTime(date: Date): string {
  const d = new Date(date)
  if (isToday(d)) {
    return format(d, 'HH:mm')
  }
  if (isYesterday(d)) {
    return 'Ontem'
  }
  return format(d, 'dd/MM/yyyy')
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

export function ContactItem({ contact, isSelected, unreadCount, lastMessage, onClick }: ContactItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopyPhone(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(contact.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy phone:', err)
    }
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        'flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-wa-bg-input border-b border-wa-border',
        isSelected && 'bg-wa-bg-input'
      )}
    >
      {/* Avatar */}
      <div className={clsx(
        'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
        getAvatarColor(contact.name)
      )}>
        <span className="text-xl text-white font-medium">
          {contact.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-medium text-wa-text-primary truncate">
            {contact.name}
          </span>
          {lastMessage && (
            <span className={clsx(
              'text-xs flex-shrink-0 ml-2',
              unreadCount > 0 ? 'text-wa-green-primary font-medium' : 'text-wa-text-secondary'
            )}>
              {formatMessageTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="text-sm text-wa-text-secondary truncate">
              {lastMessage?.text || contact.phone}
            </span>
            {isHovered && !lastMessage && (
              <button
                onClick={handleCopyPhone}
                className="p-0.5 rounded hover:bg-wa-bg-hover text-wa-text-secondary hover:text-wa-text-primary flex-shrink-0"
                title="Copiar número"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-wa-green-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
          {/* Badge de nao lidas */}
          {unreadCount > 0 && (
            <span className="bg-wa-green-primary text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center ml-2 flex-shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
