/**
 * Phase 2: Reply Preview
 * Shows a preview of the message being replied to
 */

import { X } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'

export function ReplyPreview() {
  const { replyingTo, setReplyingTo } = useChatStore()

  if (!replyingTo) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-wa-border dark:border-gray-600">
      <div className="w-1 h-10 bg-wa-green-primary rounded-full" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-wa-green-primary">
          Respondendo
        </p>
        <p className="text-sm text-wa-text-secondary truncate">
          {replyingTo.text}
        </p>
      </div>
      <button
        onClick={() => setReplyingTo(null)}
        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-wa-text-secondary"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/**
 * Reply quote shown inside a message bubble
 */
interface ReplyQuoteProps {
  replyTo: {
    messageId: string
    text: string
    sender: string
  }
}

export function ReplyQuote({ replyTo }: ReplyQuoteProps) {
  return (
    <div className="bg-black/5 dark:bg-white/10 rounded px-2 py-1 mb-1 border-l-2 border-wa-green-primary">
      <p className="text-xs font-medium text-wa-green-primary">
        {replyTo.sender}
      </p>
      <p className="text-xs text-wa-text-secondary truncate">
        {replyTo.text}
      </p>
    </div>
  )
}
