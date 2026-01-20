/**
 * Phase 2: Typing Indicator
 * Shows animated dots when someone is typing
 */

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-1">
      <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="typing-dot w-2 h-2 bg-wa-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="typing-dot w-2 h-2 bg-wa-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="typing-dot w-2 h-2 bg-wa-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
