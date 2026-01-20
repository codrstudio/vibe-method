/**
 * Phase 2: Emoji Picker
 * Simple inline emoji picker without external dependencies
 */

import { useState } from 'react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  'Gestos': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾', '🖤', '❤️', '🧡', '💛', '💚', '💙', '💜'],
  'Objetos': ['💼', '📁', '📂', '📄', '📃', '📑', '📊', '📈', '📉', '📆', '📅', '📇', '🗃️', '🗄️', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🖊️', '🖋️', '✒️', '📝', '✏️', '🔍', '🔎', '🔐', '🔑', '💰', '💳', '📱', '💻', '🖥️', '⌨️', '🖨️', '📷', '📹', '🎥'],
  'Simbolos': ['✅', '❌', '❓', '❗', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '▶️', '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '🔀', '🔁', '🔂', '➕', '➖', '➗', '✖️', '💲', '💱', '©️', '®️', '™️', '🔔', '🔕', '🎵', '🎶', '💬', '💭']
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys')

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-wa-bg-dropdown rounded-lg shadow-xl border border-wa-border w-80 z-50">
      {/* Category tabs */}
      <div className="flex border-b border-wa-border px-2 pt-2">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              activeCategory === category
                ? 'bg-wa-green-primary text-white'
                : 'text-wa-text-secondary hover:bg-wa-bg-hover'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 h-48 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
            <button
              key={index}
              onClick={() => {
                onSelect(emoji)
                onClose()
              }}
              className="w-8 h-8 flex items-center justify-center text-xl hover:bg-wa-bg-hover rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Close button */}
      <div className="border-t border-wa-border p-2">
        <button
          onClick={onClose}
          className="w-full text-xs text-wa-text-secondary hover:text-wa-text-primary"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
