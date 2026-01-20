import { useState } from 'react'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { FileText, Reply, MoreVertical } from 'lucide-react'
import { MessageStatus } from './MessageStatus'
import { ReplyQuote } from './ReplyPreview'
import { AudioMessage } from './AudioMessage'
import { useChatStore } from '../../stores/chatStore'
import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  isHighlighted?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function MessageBubble({ message, isOwn, isHighlighted }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const { setReplyingTo } = useChatStore()
  const time = format(new Date(message.timestamp), 'HH:mm')

  function handleReply() {
    setReplyingTo(message)
    setShowMenu(false)
  }

  return (
    <div
      id={`message-${message.id}`}
      className={clsx(
        'flex mb-1 group',
        isOwn ? 'justify-end' : 'justify-start',
        isHighlighted && 'message-highlight rounded-lg'
      )}
    >
      {/* Phase 2: Quick reply button (left side for own messages) */}
      {isOwn && (
        <button
          onClick={handleReply}
          className="p-1 self-center mr-1 opacity-0 group-hover:opacity-100 transition-opacity text-wa-text-secondary hover:text-wa-text-primary"
          title="Responder"
        >
          <Reply className="w-4 h-4" />
        </button>
      )}

      <div className="relative">
        <div
          className={clsx(
            'max-w-[65%] min-w-[120px] rounded-lg px-3 py-2 shadow-sm relative',
            isOwn ? 'bg-wa-bubble-out' : 'bg-wa-bubble-in'
          )}
        >
          {/* Tail do balao */}
          <div
            className={clsx(
              'absolute top-0 w-3 h-3',
              isOwn
                ? 'right-0 -mr-1.5 bg-wa-bubble-out'
                : 'left-0 -ml-1.5 bg-wa-bubble-in',
              isOwn ? 'rounded-br-full' : 'rounded-bl-full'
            )}
            style={{
              clipPath: isOwn
                ? 'polygon(0 0, 100% 0, 0 100%)'
                : 'polygon(100% 0, 0 0, 100% 100%)'
            }}
          />

          {/* Phase 2: Reply Quote */}
          {message.replyTo && (
            <ReplyQuote replyTo={message.replyTo} />
          )}

          {/* Phase 2: Audio Message */}
          {message.audio ? (
            <AudioMessage
              duration={message.audio.duration}
              url={message.audio.url}
              isOwn={isOwn}
            />
          ) : (
            /* Texto */
            message.text && (
              <p className="text-wa-text-primary text-sm whitespace-pre-wrap break-words">
                {message.text}
              </p>
            )
          )}

          {/* Documento/Arquivo se houver */}
          {message.media && (
            <div className="mt-2 p-2 bg-wa-bg-hover/50 rounded flex items-center gap-2">
              <FileText className="w-8 h-8 text-wa-text-danger flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-wa-text-primary">{message.media.filename}</p>
                <p className="text-xs text-wa-text-secondary">{formatFileSize(message.media.size)}</p>
              </div>
            </div>
          )}

          {/* Timestamp + Status */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[11px] text-wa-text-secondary">
              {time}
            </span>
            {isOwn && <MessageStatus status={message.status} />}
          </div>

          {/* Phase 2: Context menu button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-wa-bg-hover/50"
          >
            <MoreVertical className="w-4 h-4 text-wa-text-secondary" />
          </button>

          {/* Context menu dropdown */}
          {showMenu && (
            <div className="absolute top-8 right-0 bg-wa-bg-dropdown rounded-lg shadow-lg border border-wa-border py-1 z-10 min-w-[120px]">
              <button
                onClick={handleReply}
                className="w-full px-4 py-2 text-left text-sm text-wa-text-primary hover:bg-wa-bg-hover flex items-center gap-2"
              >
                <Reply className="w-4 h-4" />
                Responder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phase 2: Quick reply button (right side for received messages) */}
      {!isOwn && (
        <button
          onClick={handleReply}
          className="p-1 self-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-wa-text-secondary hover:text-wa-text-primary"
          title="Responder"
        >
          <Reply className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
