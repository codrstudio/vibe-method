import { Clock, Check, CheckCheck } from 'lucide-react'
import type { Message } from '../../types'

interface MessageStatusProps {
  status: Message['status']
}

export function MessageStatus({ status }: MessageStatusProps) {
  if (status === 'pending') {
    return <Clock className="w-4 h-4 text-wa-check-sent" />
  }
  if (status === 'sent') {
    return <Check className="w-4 h-4 text-wa-check-sent" />
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-4 h-4 text-wa-check-sent" />
  }
  if (status === 'read') {
    return <CheckCheck className="w-4 h-4 text-wa-check-read" />
  }
  if (status === 'failed') {
    return <span className="text-red-500 text-xs">!</span>
  }
  return null
}
